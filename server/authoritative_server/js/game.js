const players = {};

const config = {
  type: Phaser.HEADLESS,
  parent: 'phaser-example',
  width: 1280,
  height: 800,
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
      gravity: { y: 0 }
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  },
  autoFocus: false
};

function preload() {
  this.load.image('lamp', 'assets/PNM_Lamp.png');
  this.load.image('star', 'assets/PNM_Star.png');
  this.load.image('sky', 'assets/PNM_Background.jpg');
}

function create() {
  const self = this;
  this.add.image(0, 0, 'sky').setOrigin(0, 0);
  this.players = this.physics.add.group();

  this.scores = {
    blue: 0,
    red: 0,
    highscore: 0,
    username: ''
  };

  this.star = this.physics.add.image(randomPosition(1280), randomPosition(800), 'star').setDisplaySize(60, 60);
  this.physics.add.collider(this.players);

  this.physics.add.overlap(this.players, this.star, function (star, player) {
    if (typeof players[player.playerId].score !== 'undefined' && !isNaN(players[player.playerId].score)) {
      players[player.playerId].score += 10;
    } else {
      players[player.playerId].score = 10;
    }

    // Top 3.
    playerIds = Object.keys(players);
    playerIds.sort(function(a, b) { return players[b].score - players[a].score });
    var top_scores = [];

    for (var i = 0; i < playerIds.length && top_scores.length < 3; i++) {
      var pid = playerIds[i];

      if (typeof players[pid].score !== 'undefined' && !isNaN(players[pid].score))
        top_scores.push({name: players[pid].input.name, score: players[pid].score});
    }

    io.emit('topScores', top_scores);

    self.star.setPosition(10+randomPosition(1180), 10+randomPosition(680));
    io.emit('updateScore', players[player.playerId].score);
    io.emit('starLocation', { x: self.star.x, y: self.star.y });
  });

  io.on('connection', function (socket) {
    console.log('a user connected');
    // create a new player and add it to our players object
    players[socket.id] = {
      rotation: 0,
      x: Math.floor(Math.random() * 1280) + 50,
      y: Math.floor(Math.random() * 800) + 50,
      playerId: socket.id,
      team: (Math.floor(Math.random() * 2) == 0) ? 'red' : 'blue',
      input: {
        left: false,
        right: false,
        up: false,
        name: 'Winner'
      },
      score: 0,
      tint: Math.random() * 0xffffff,
      username: 'Winner'

    };

    // add player to server
    addPlayer(self, players[socket.id]);
    // send the players object to the new player
    socket.emit('currentPlayers', players);
    // update all other players of the new player
    socket.broadcast.emit('newPlayer', players[socket.id]);

    socket.emit('yourPlayer', players[socket.id]);

    // send the star object to the new player
    socket.emit('starLocation', { x: self.star.x, y: self.star.y });
    // send the current scores
    socket.emit('updateScore', players[socket.id].score);

    socket.on('disconnect', function () {
      console.log('user disconnected');
      // remove player from server
      removePlayer(self, socket.id);
      // remove this player from our players object
      delete players[socket.id];
      // emit a message to all players to remove this player
      io.emit('disconnect', socket.id);
    });

    // when a player moves, update the player data
    socket.on('playerInput', function (inputData) {
      handlePlayerInput(self, socket.id, inputData);
    });
  });
}

function update() {
  this.players.getChildren().forEach((player) => {
    const input = players[player.playerId].input;
    //Set Player Tint
    // player.setTint('Ox' + input.color);
    if (input.left) {
      player.setAngularVelocity(-300);
    } else if (input.right) {
      player.setAngularVelocity(300);
    } else {
      player.setAngularVelocity(0);
    }

    if (input.up) {
      this.physics.velocityFromRotation(player.rotation + 1.5, 200, player.body.acceleration);
    } else {
      player.setAcceleration(0);
    }

    players[player.playerId].x = player.x;
    players[player.playerId].y = player.y;
    players[player.playerId].rotation = player.rotation;

    //players[player.playerId].score = player.score;
    //players[player.playerId].tint = '0x' + input.tint;
  });
  this.physics.world.wrap(this.players, 5);
  io.emit('playerUpdates', players);
}

function randomPosition(max) {
  return Math.floor(Math.random() * max) + 50;
}

function handlePlayerInput(self, playerId, input) {
  self.players.getChildren().forEach((player) => {
    if (playerId === player.playerId) {
      players[player.playerId].input = input;
      if (players[player.playerId].score > self.scores.highscore) {
        self.scores.highscore = players[player.playerId].score;
        self.scores.username = players[player.playerId].username;

      }
    }
  });
}

function addPlayer(self, playerInfo) {
  const player = self.physics.add.image(playerInfo.x, playerInfo.y, 'lamp').setOrigin(0.5, 0.5).setDisplaySize(83, 70);
  player.setDrag(100);
  player.setAngularDrag(100);
  player.setMaxVelocity(200);
  player.playerId = playerInfo.playerId;
  self.players.add(player);
}

function removePlayer(self, playerId) {
  self.players.getChildren().forEach((player) => {
    if (playerId === player.playerId) {
      player.destroy();
    }
  });
}

const game = new Phaser.Game(config);
window.gameLoaded();
