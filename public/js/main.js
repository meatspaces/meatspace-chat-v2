var $ = require('jquery');
var Webrtc2images = require('webrtc2images');
var Fingerprint = require('fingerprintjs');
var crypto = require('crypto');
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
var mutedFP = [];
var filteredFP = [];

try {
  mutedFP = JSON.parse(localStorage.getItem('muted')) || [];
} catch (err) {
  mutedFP = [];
}

try {
  filteredFP = JSON.parse(localStorage.getItem('filtered')) || [];
} catch (err) {
  filteredFP = [];
}

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
  mutedFP = [];
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

  if (mutedFP.indexOf(fp === -1)) {
    mutedFP.push(fp);

    localStorage.setItem('muted', JSON.stringify(mutedFP));
    body.find('li[data-fp="' + fp + '"]').remove();
  }
});

messages.on('click', '.filter', function (ev) {
  ev.preventDefault();
  var fp = $(this).closest('li').data('fp');

  if (filteredFP.indexOf(fp === -1)) {
    filteredFP.push(fp);
    localStorage.setItem('filtered', JSON.stringify(filteredFP));
  }
});

messagesFiltered.on('click', '.unfilter', function (ev) {
  ev.preventDefault();
  var fp = $(this).closest('li').data('fp');

  if (filteredFP.indexOf(fp) > -1) {
    filteredFP.splice(fp, 1);
    localStorage.setItem('filtered', JSON.stringify(filteredFP));
  }
});

socket.on('ip', function (data) {
  profile.ip = data;
  profile.md5 = crypto.createHash('md5').update(profile.fingerprint + data).digest('hex');
});

socket.on('active', function (data) {
  active.text(data);
});

socket.on('message', function (data) {
  if (mutedFP.indexOf(data.fingerprint) === -1) {
    var li = $('<li data-fp="' + data.fingerprint + '"></li>');
    var video = $('<video src="' + data.media + '", autoplay="autoplay", loop></video>');
    var p = $('<p></p>');
    var userControls = '';

    if (data.fingerprint !== profile.md5) {
      userControls = '<button class="mute">mute</button><button class="filter">filter</button>';
    }

    var actions = $('<div class="actions">' + userControls +'</div>');
    p.html(data.message);
    li.append(video).append(p).append(actions);
    messages.append(li);

    if (filteredFP.indexOf(data.fingerprint) > -1 || data.fingerprint === profile.md5) {
      var liFiltered = li.clone();
      liFiltered.find('.filter')
                .removeClass('filter')
                .addClass('unfilter')
                .text('unfilter');
      messagesFiltered.append(liFiltered);

      var childrenFiltered = messagesFiltered.find('li');
       if (childrenFiltered.length > MAX_LIMIT) {
        childrenFiltered.slice(0, childrenFiltered.length - MAX_LIMIT).remove();
      }
    }

    var children = messages.find('li');

    if (children.length > MAX_LIMIT) {
      children.slice(0, children.length - MAX_LIMIT).remove();
    }

    li[0].scrollIntoView();
  }
});
