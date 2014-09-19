'use strict';

var nconf = require('nconf');
var WebSocket = require('ws');

nconf.argv().env().file({ file: 'local.json' });

var wsServer = nconf.get('wsServer');
var ws = new WebSocket(wsServer);

exports.home = function (request, reply) {
  reply.view('index', {
    analytics: nconf.get('analytics')
  });
};

exports.add = function (request, reply) {
  try {
    ws.send(result.content.data);
  } catch (err) {
    ws = new WebSocket(wsServer);
    ws.on('open', function (ws) {
      console.log('opened');
    });

    setTimeout(function () {
      ws.send(result.content.data);
    }, 1000);
  }
};