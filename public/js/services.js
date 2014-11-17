var $ = require('jquery');
var Waypoint = require('waypoints');
var socket = io();
var moment = require('moment');

var comment = $('#composer-message');

var MAX_LIMIT = 30;

exports.sendMessage = function (profile, rtc, next) {
  rtc.recordVideo(function (err, frames) {
    if (!err) {
      if (window.ga) {
        window.ga('send', 'event', 'message', 'send');
      }

      socket.emit('message', {
        message: comment.val(),
        media: frames,
        fingerprint: profile.fingerprint
      });
    }

    comment.val('');
    next();
  });
};

exports.getMessage = function (data, mutedFP, userIdManager, profile, messages) {
  if (window.ga) {
    window.ga('send', 'event', 'message', 'receive');
  }

  if (mutedFP[data.fingerprint]) {
    return;
  }

  var children = messages.children();
  var length = children.length;

  if (length) {
    var last = children.get(-1);
    var size = $(window).innerHeight();
    var bottom = last ? last.getBoundingClientRect().bottom : 0;
    var follow = bottom < size + 50;

    if (follow) {
      if (length > MAX_LIMIT) {
        children.slice(0, length - MAX_LIMIT).each(function () {
          $(this).data('waypoints').forEach(function (waypoint) {
            waypoint.destroy();
          });

          var saveLink = $(this).find('.save');
          if (saveLink.length) {
            window.URL.revokeObjectURL(saveLink.attr('href'));
          }
        }).remove();
      }
    }
  }

  var userControls = '';
  if (!userIdManager.contains(data.fingerprint)) {
    userControls = '<button class="mute">mute</button>';
  }

  var created = moment(new Date(data.created));

  var timestamp =
        '<time datetime="' + created.toISOString() + '" class="timestamp">' +
          created.format('LT') + '</time>';

  var markup =
        '<li data-fp="' + data.fingerprint + '">' +
          '<div class="video-container">' +
            '<video src="' + data.media + '" autoplay="autoplay" loop />' +
            '<a class="convert">Save as GIF</a>' +
          '</div>' +
          '<p>' + data.message + timestamp + '</p>' +
          '<div class="actions">' + userControls +'</div>' +
        '</li>';

  var li = $(markup);
  var eLi = li[0];

  messages.append(li);

  var opts = function (refDir, offsetFn) {
    return {
      element: eLi,
      offset: offsetFn,
      handler: function (direction) {
        $(this.element).toggleClass('in-view', direction === refDir);
        li.find('video')[0][direction === refDir ? 'play' : 'pause']();
      }
    };
  };

  li.data('waypoints', [
    new Waypoint(opts('up', function () {return -$(this.element).outerHeight();})),
    new Waypoint(opts('down', '100%'))
  ]);

  Waypoint.refreshAll();

  if (follow) {
    eLi.scrollIntoView();
  }
};
