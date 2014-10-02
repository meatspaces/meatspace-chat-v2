var $ = require('jquery');
var Webrtc2images = require('webrtc2images');
var Fingerprint = require('fingerprintjs');
var crypto = require('crypto');
var music = require('./music');
var services = require('./services');
var socket = io();

var rtc = false;
var webmSupport = false;

rtc = new Webrtc2images({
  width: 200,
  height: 150,
  frames: 10,
  type: 'image/jpeg',
  quality: 0.8,
  interval: 300
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
var doc = $(document);
var unmute = $('#unmute');
var form = $('form');
var sadBrowser = $('#sad-browser');
var active = $('#active');
var info = $('#info');
var infoScreen = $('#info-screen');
var mutedFP = {};

try {
  mutedFP = JSON.parse(localStorage.getItem('muted')) || {};
} catch (err) { }

rtc.startVideo(function (err) {
  if (err) {
    rtc = false;
  }
});

$('#music').click(music.toggle);

$('.close').click(function () {
  infoScreen.removeClass('on');
});

unmute.click(function (ev) {
  mutedFP = {};
  localStorage.setItem('muted', JSON.stringify(mutedFP));
});

var submitting = false;

if (!rtc || !webmSupport) {
  sadBrowser.show();
  form.remove();
  $('#video-preview').remove();
}

form.submit(function (ev) {
  ev.preventDefault();

  if (rtc && !submitting) {
    submitting = true;
    services.sendMessage(profile, rtc, function (submitted) {
      submitting = submitted;
    });
  }
});

info.click(function () {
  if (infoScreen.hasClass('on')) {
    infoScreen.removeClass('on');
  } else {
    infoScreen.addClass('on');
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

doc.on('visibilitychange', function (ev) {
  var hidden = document.hidden;
  $('video').each(function () {
    if (hidden) {
      this.pause();
    } else {
      this.play();
    }
  });
});

socket.on('ip', function (data) {
  profile.ip = data;
  profile.md5 = crypto.createHash('md5').update(profile.fingerprint + data).digest('hex');
});

socket.on('active', function (data) {
  active.text(data);
});

socket.on('message', function (data) {
  services.getMessage(data, mutedFP, profile, messages);
});
