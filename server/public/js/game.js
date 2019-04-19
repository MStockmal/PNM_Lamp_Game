var config = {
  type: Phaser.AUTO,
  parent: 'phaser-example',
  width: 1280,
  height: 800,
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

var game = new Phaser.Game(config);
var leftP = false;
var rightP = false;
var upP = false;
var downP = false;
var color = "";
var name = "";
var score


function preload() {
  this.load.image('lamp', 'assets/PNM_Lamp.png');
  this.load.image('otherPlayer', 'assets/PNM_Lamp.png');
  this.load.image('star', 'assets/PNM_Star.png');
  this.load.image('sky', 'assets/PNM_Background.jpg');
}

function create() {
  var self = this;
  this.add.image(0, 0, 'sky').setOrigin(0, 0);
  this.socket = io();
  this.players = this.add.group();

  this.blueScoreText = this.add.text(16, 16, '', { fontSize: '32px', fill: '#05fcfc' });
  this.redScoreText = this.add.text(584, 16, '', { fontSize: '32px', fill: '#ff26a1' });

  this.socket.on('currentPlayers', function (players) {
    Object.keys(players).forEach(function (id) {
      if (players[id].playerId === self.socket.id) {
        displayPlayers(self, players[id], 'lamp');
      } else {
        displayPlayers(self, players[id], 'otherPlayer');
      }
    });
  });

  this.socket.on('newPlayer', function (playerInfo) {
    displayPlayers(self, playerInfo, 'otherPlayer');
  });

  this.socket.on('disconnect', function (playerId) {
    self.players.getChildren().forEach(function (player) {
      if (playerId === player.playerId) {
        player.destroy();
      }
    });
  });

  this.socket.on('playerUpdates', function (players) {
    Object.keys(players).forEach(function (id) {
      self.players.getChildren().forEach(function (player) {
        if (players[id].playerId === player.playerId) {
          player.setRotation(players[id].rotation);
          player.setPosition(players[id].x, players[id].y);
          player.score = players[id].score;
        }
      });
    });
  });

  this.socket.on('updateScore', function (scores) {
    self.blueScoreText.setText('Username: ' + scores.username);
    self.redScoreText.setText('High Score: ' + scores.highscore);
  });

  this.socket.on('starLocation', function (starLocation) {
    if (!self.star) {
      self.star = self.add.image(starLocation.x, starLocation.y, 'star').setDisplaySize(60, 60);
    } else {
      self.star.setPosition(starLocation.x, starLocation.y);
    }
  });

  this.cursors = this.input.keyboard.createCursorKeys();
  this.leftKeyPressed = false;
  this.rightKeyPressed = false;
  this.upKeyPressed = false;
}


function update() {
  const left = this.leftKeyPressed;
  const right = this.rightKeyPressed;
  const up = this.upKeyPressed;

  if (this.cursors.left.isDown) {
    this.leftKeyPressed = true;
  } else if (this.cursors.right.isDown) {
    this.rightKeyPressed = true;
  } else {
    this.leftKeyPressed = false;
    this.rightKeyPressed = false;
  }

  if (this.cursors.up.isDown) {
    this.upKeyPressed = true;
  } else {
    this.upKeyPressed = false;
  }

  if (left !== this.leftKeyPressed || right !== this.rightKeyPressed || up !== this.upKeyPressed) {
    this.socket.emit('playerInput', { left: this.leftKeyPressed , right: this.rightKeyPressed, up: this.upKeyPressed });
  }
  // var leftP = false;
  // var rightP = false;
  // var upP = false;
  // var downP = false;
   // if(document.getElementById("result").innerHTML.indexOf("left") > 0){
   //   leftP = true;
   //
   // }
   // if(document.getElementById("result").innerHTML.indexOf("right") > 0){
   //   rightP = true;
   // }
   // if(document.getElementById("result").innerHTML.indexOf("up") > 0){
   //   upP = true;
   // }
   // if(document.getElementById("result").innerHTML.indexOf("down") > 0){
   //   downP = true;
   // }
   // if(document.getElementById("color").innerHTML.indexOf("down") > 0){
   //   downP = true;
   // }



 console.log(upP, rightP, downP, leftP, color, name);
  if (leftP || rightP  || upP || downP) {
    this.socket.emit('playerInput', { left: leftP, right: rightP, up: upP, down: downP, color: color, name: name});
  }
}

function displayPlayers(self, playerInfo, sprite) {
  console.log(color);
  const player = self.add.sprite(playerInfo.x, playerInfo.y, sprite).setOrigin(0.5, 0.5).setDisplaySize(83, 70).setTint(playerInfo.tint);
  // if (playerInfo.team === 'blue') player.setTint((0xcc00ff));
  // else player.setTint(0xcc00ff);
  player.playerId = playerInfo.playerId;
  self.players.add(player);
}
