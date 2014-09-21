'use strict';

var crypto = require('crypto');
var Publico = require('meatspace-publico');

var getUserId = function (fingerprint, ip) {
  return crypto.createHash('md5').update(fingerprint + ip).digest('hex');
};

var publico = new Publico('none', {
  db: './db/db-messages',
  limit: 20
});

var convertToWebm = function (media, next) {
  // video/webm
};

exports.recent = function (request, reply) {

};

exports.addMessage = function (payload, next) {

};