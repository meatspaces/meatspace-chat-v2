'use strict';

var twitter = require('twitter-text');
var Publico = require('meatspace-publico');

var convert2webm = require('./convert2webm');

var publico = new Publico('none', {
  db: './db/db-messages',
  limit: 15
});

var IMAGE_TYPE = 'jpeg';

var validateImageType = function (data, next) {
  if (!data.length || data.length !== 10) {
    next(new Error('Invalid number of frames'));
    return;
  }

  var isJPG = true;

  for (var i = 0; i < data.length; i ++) {
    if (!data[i].match(/^data:image\/jpeg;base64,/)) {
      isJPG = false;
      break;
    }
  }

  if (!isJPG) {
    next(new Error('No JPEG detected'));
    return;
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

exports.recent = function (socket) {
  publico.getChats(true, function (err, c) {
    if (err) {
      console.log(err);
      return;
    }

    if (c.chats && c.chats.length > 0) {
      c.chats.reverse();
    }

    c.chats.forEach(function (chat) {
      setImmediate(function () {
        socket.emit('message', chat.value);
      });
    });
  });
};

exports.addMessage = function (payload, next) {
  validateImageType(payload.media, function (err) {
    if (err) {
      next(err);
      return;
    }

    convert2webm.transform(payload.videoType, payload.media, function (err, media) {
      if (err) {
        next(err);
        return;
      }

      var message = autoLink(twitter.htmlEscape(payload.message), {
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
  });
};
