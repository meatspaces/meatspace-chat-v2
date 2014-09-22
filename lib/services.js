'use strict';

var crypto = require('crypto');

var Publico = require('meatspace-publico');

var convert2webm = require('./convert2webm');

var getUserId = function (fingerprint, ip) {
  return crypto.createHash('md5').update(fingerprint + ip).digest('hex');
};

var messages = new Publico('none', {
  db: './db/db-messages',
  limit: 20
});

exports.recent = function (request, reply) {

};

exports.addMessage = function (payload, next) {
  convert2webm.transform(payload.media, function (err, media) {
    if (err) {
      console.error(err);
      next(err);
      return;
    }

    next(null, media);
  });
};
