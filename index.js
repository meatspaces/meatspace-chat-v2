'use strict';

var Hapi = require('hapi');
var nconf = require('nconf');

nconf.argv().env().file({ file: 'local.json' });

var server = Hapi.createServer(nconf.get('domain'), nconf.get('port'));

var routes = [
  {
    method: 'GET',
    path: '/',
    config: {
      handler: home
    }
  }
];

server.route(routes);

server.start();

function home(request, reply) {
  reply('home page');
}
