var $ = require('jquery');
var Webrtc2images = require('webrtc2images');
var Fingerprint = require('fingerprintjs');
var crypto = require('crypto');
var Waypoint = require('waypoints')
var socket = io();

var rtc = false;
var webmSupport = false;

var MAX_LIMIT = 15;

rtc = new Webrtc2images({
  width: 200,
  height: 150,
  frames: 10,
  type: 'image/png',
  interval: 200
});

var profile = {
  ip: false,
  fingerprint: new Fingerprint({ canvas: true }).get(),
  md5: false
};

var testVideo = $('<video></video>')[0];

if (testVideo.canPlayType('video/webm; codecs="vp8, vorbis"')) {
  webmSupport = true;
}

var messages = $('#messages');
var body = $('body');
var messagesFiltered = $('#messages-filtered');
var filtered = $('#filtered');
var unmute = $('#unmute');
var invisible = $('#invisible');
var invisibleMode = $('#invisible-mode');
var form = $('form');
var comment = $('#comment');
var sadBrowser = $('#sad-browser');
var active = $('#active');
var mutedFP = {};
var filteredFP = {};

try {
  mutedFP = JSON.parse(localStorage.getItem('muted')) || {};
} catch (err) { }

try {
  filteredFP = JSON.parse(localStorage.getItem('filtered')) || {};
} catch (err) { }

rtc.startVideo(function (err) {
  if (err) {
    rtc = false;
  }
});

filtered.click(function () {
  messagesFiltered.slideToggle('fast', function () {
    if (filtered.hasClass('on')) {
      filtered.removeClass('on');
    } else {
      filtered.addClass('on');
    }
  });
});

invisible.click(function () {
  if (!invisible.hasClass('on')) {
    invisibleMode.slideDown('fast');
    invisible.addClass('on');
  } else {
    invisibleMode.slideUp('fast');
    invisible.removeClass('on');
  }
});

unmute.click(function (ev) {
  mutedFP = {};
  localStorage.setItem('muted', JSON.stringify(mutedFP));
});

invisibleMode.on('click', 'button', function () {
  invisibleMode.slideUp('fast');
});

var submitting = false;

if (!rtc && !webmSupport) {
  sadBrowser.show();
  form.remove();
  $('#video-preview').remove();
}

form.submit(function (ev) {
  ev.preventDefault();

  if (rtc && !submitting) {
    submitting = true;
    rtc.recordVideo(function (err, frames) {
      if (!err) {
        if (window.ga) {
          window.ga('send', 'event', 'message', 'send');
        }

        socket.emit('message', JSON.stringify({
          message: comment.val(),
          media: frames,
          ip: profile.ip,
          fingerprint: profile.fingerprint
        }));
      }

      submitting = false;
      comment.val('');
    });
  }
});

messages.on('click', '.mute', function (ev) {
  ev.preventDefault();
  var fp = $(this).closest('li').data('fp');

  if (!mutedFP[fp]) {
    mutedFP[fp] = true;

    localStorage.setItem('muted', JSON.stringify(mutedFP));
    body.find('li[data-fp="' + fp + '"]').remove();
  }
});

body.on('click', '.filter', function (ev) {
  ev.preventDefault();
  var fp = $(this).closest('li').data('fp');

  filteredFP[fp] = true;
  messages.find('li[data-fp="' + fp + '"] .filter').removeClass('filter')
                                                   .addClass('unfilter')
                                                   .text('unfilter');
  localStorage.setItem('filtered', JSON.stringify(filteredFP));
});

body.on('click', '.unfilter', function (ev) {
  ev.preventDefault();
  var fp = $(this).closest('li').data('fp');

  delete filteredFP[fp];
  localStorage.setItem('filtered', JSON.stringify(filteredFP));
  messagesFiltered.find('li[data-fp="' + fp + '"]').remove();
  messages.find('li[data-fp="' + fp + '"] .unfilter').removeClass('unfilter')
                                                     .addClass('filter')
                                                     .text('filter');
});

socket.on('ip', function (data) {
  profile.ip = data;
  profile.md5 = crypto.createHash('md5').update(profile.fingerprint + data).digest('hex');
});

socket.on('active', function (data) {
  active.text(data);
});

socket.on('message', function (data) {
  if (window.ga) {
    window.ga('send', 'event', 'message', 'receive');
  }

  if (!mutedFP[data.fingerprint]) {
    var li = $('<li data-fp="' + data.fingerprint + '"></li>');
    var video = $('<video src="' + data.media + '", autoplay="autoplay", loop></video>');
    var p = $('<p></p>');
    var userControls = '';

    if (data.fingerprint !== profile.md5) {
      userControls = '<button class="mute">mute</button>';

      if (filteredFP[data.fingerprint]) {
        userControls += '<button class="unfilter">unfilter</button>';
      } else {
        userControls += '<button class="filter">filter</button>';
      }
    }

    var actions = $('<div class="actions">' + userControls +'</div>');
    p.html(data.message);
    li.append(video).append(p).append(actions);
    messages.append(li);

    if (filteredFP[data.fingerprint] || data.fingerprint === profile.md5) {
      var liFiltered = li.clone();
      messagesFiltered.append(liFiltered);

      var childrenFiltered = messagesFiltered.find('li');
       if (childrenFiltered.length > MAX_LIMIT) {
        childrenFiltered.slice(0, childrenFiltered.length - MAX_LIMIT).remove();
      }
    }

    var children = messages.find('li');

    if (children.length > MAX_LIMIT) {
      var toBeRemoved = children.slice(0, children.length - MAX_LIMIT);

      if (toBeRemoved && typeof toBeRemoved === 'object') {
        toBeRemoved.forEach(function (dead) {
          dead.data('waypoints').forEach(function (waypoint) {
            waypoint.destroy();
          });
        })
        toBeRemoved.remove();
      }
    }

    var waypoints = [];

    waypoints.push(new Waypoint({
      element: li[0],
      handler: function (direction) {
        $(this.element).toggleClass('in-view', direction === 'up');
      },
      offset: function () {
        return -$(this.element).outerHeight();
      }
    }));

    waypoints.push(new Waypoint({
      element: li[0],
      handler: function (direction) {
        $(this.element).toggleClass('in-view', direction === 'down');
      },
      offset: '100%'
    }));

    li.data('waypoints', waypoints);

    li[0].scrollIntoView();
  }
});
