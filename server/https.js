
var greenlock = require('greenlock-express').create({
  server: 'https://acme-v02.api.letsencrypt.org/directory'
, version: 'draft-11'
, configDir: '~/.config/acme/'
, approveDomains: approveDomains
, app: require('./test.js')
});
var server = greenlock.listen(8080, 8443);
//const server = require('http').Server(app);
const path = require('path');
const io = require('socket.io').listen(server);
const Datauri = require('datauri');
const datauri = new Datauri();
const jsdom = require('jsdom');
const { JSDOM } = jsdom;


function approveDomains(opts, certs, cb) {
  if (certs) {
    opts.domains = [certs.subject].concat(certs.altnames);
  }
  fooCheckDb(opts.domains, function (err, agree, email) {
    if (err) { cb(err); return; }
    opts.agreeTos = agree;
    opts.email = email;
    cb(null, { options: opts, certs: certs });
  });
}

function fooCheckDb(domains, cb) {
  var userEmail = 'contact@foxyninjastudions.com';
  var userAgrees = true;
  cb(null, userAgrees, userEmail);
}

function setupAuthoritativePhaser() {
  JSDOM.fromFile(path.join(__dirname, 'authoritative_server/index.html'), {
    // To run the scripts in the html file
    runScripts: "dangerously",
    // Also load supported external resources
    resources: "usable",
    // So requestAnimatinFrame events fire
    pretendToBeVisual: true
  }).then((dom) => {
    dom.window.URL.createObjectURL = (blob) => {
      if (blob){
        return datauri.format(blob.type, blob[Object.getOwnPropertySymbols(blob)[0]]._buffer).content;
      }
    };
    dom.window.URL.revokeObjectURL = (objectURL) => {};
    dom.window.gameLoaded = () => {
      server.listen(8082, function () {
        console.log(`Listening on ${server.address().port}`);
      });
    };
    dom.window.io = io;
  }).catch((error) => {
    console.log(error.message);
  });
}

setupAuthoritativePhaser();2
