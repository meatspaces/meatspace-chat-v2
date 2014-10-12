'use strict';

var twitter = require('twitter-text');
var Publico = require('meatspace-publico');

var convert2video = require('./convert2video');

var publico = new Publico('none', {
  db: './db/db-messages',
  limit: 15
});

var validateImageType = function (data, next) {
  if (data.length !== 10) {
    next(new Error('Invalid number of frames'));
    return;
  }

  for (var i = 0; i < data.length; i ++) {
    if (!data[i].match(/^data:image\/jpeg;base64,/)) {
      return next(new Error('Invalid image type'));
    }
  }

  next(null, true);
};

/**
 * Default twitter.autoLink behavior is to _not_ link
 * urls without protocol, with no way to override
 * https://github.com/twitter/twitter-text-js/blob/master/twitter-text.js#L759
 * And: https://github.com/twitter/twitter-text-js/issues/136
 */
var autoLink = function(text, options) {
  var entities = twitter.extractEntitiesWithIndices(text, { extractUrlsWithoutProtocol: true });
  return twitter.autoLinkEntities(text, entities, options);
};

exports.recent = function (socket, format) {
  publico.getChats(true, function (err, c) {
    if (err) {
      console.log(err);
      return;
    }

    for (var i = c.chats.length - 1; i >= 0; i--) {
      c.chats[i].value.media = c.chats[i].value.media[format];
      socket.emit('message', c.chats[i].value);
    }
  });
};

exports.addMessage = function (payload, next) {
  validateImageType(payload.media, function (err) {
    if (err) {
      next(err);
      return;
    }

    convert2video.transform(payload.media, function (err, media) {
      if (err) {
        next(err);
        return;
      }

      var message = autoLink(payload.message.slice(0, 250), {
        htmlEscapeNonEntities: true,
        targetBlank: true
      });

      publico.addChat(message, {
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
  });
};
