var $ = require('jquery');
var Webrtc2images = require('webrtc2images');
var Fingerprint = require('fingerprintjs');
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
  fingerprint: new Fingerprint({ canvas: true }).get()
};

var testVideo = $('video')[0];

if (testVideo.canPlayType('video/webm; codecs="vp8, vorbis"')) {
  webmSupport = true;
}

var messages = $('#messages');
var messagesFiltered = $('#messages-filtered');
var filtered = $('#filtered');
var unmute = $('#unmute');
var invisible = $('#invisible');
var invisibleMode = $('#invisible-mode');
var form = $('form');
var comment = $('#comment');
var sadBrowser = $('#sad-browser');
var active = $('#active');

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

socket.on('ip', function (data) {
  profile.ip = data;
});

socket.on('active', function (data) {
  active.text(data);
});

socket.on('message', function (data) {
  var li = $('<li data-fp="' + data.fingerprint + '"></li>');
  var video = $('<video src="' + data.media + '", autoplay="autoplay", loop></video>');
  var p = $('<p></p>');
  var actions = $('<div class="actions"><button id="mute">mute</button><button id="filter">filter</button>');
  p.html(data.message);
  li.append(video).append(p).append(actions);
  messages.append(li);

  var children = messages.find('li');

  if (children.length > MAX_LIMIT) {
    children.slice(0, children.length - MAX_LIMIT).remove();
  }

  li[0].scrollIntoView();
});
