'use strict';

var twitter = require('twitter-text');
var Publico = require('meatspace-publico');

var convert2webm = require('./convert2webm');

var publico = new Publico('none', {
  db: './db/db-messages',
  limit: 20
});

exports.recent = function (next) {
  publico.getChats(true, function (err, c) {
    if (err) {
      next(err);
      return;
    }

    if (c.chats && c.chats.length > 0) {
      c.chats.reverse();
    }

    next(null, c.chats);
  });
};

exports.addMessage = function (payload, next) {
  convert2webm.transform(payload.media, function (err, media) {
    if (err) {
      console.error(err);
      next(err);
      return;
    }

    var message = twitter.autoLink(twitter.htmlEscape(payload.message), {
      targetBlank: true
    });

    publico.addChat(message.slice(0, 250), {
      ttl: 600000,
      media: media,
      fingerprint: payload.fingerprint
    }, function (err, chat) {
      if (err) {
        next(err);
        return;
      }

      next(null, chat);
    });
  });
};
