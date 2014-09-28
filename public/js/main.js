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
var message = $('#composer-message');
var body = $('body');
var doc = $(document);
var messagesFiltered = $('#messages-filtered');
var filtered = $('#filtered');
var unmute = $('#unmute');
var invisible = $('#invisible');
var invisibleMode = $('#invisible-mode');
var form = $('form');
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

$('#music').click(music.toggle);

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

if (!rtc || !webmSupport) {
  sadBrowser.show();
  form.remove();
  $('#video-preview').remove();
}

form.submit(function (ev) {
  ev.preventDefault();
  message.prop('disabled', true);

  if (rtc && !submitting) {
    submitting = true;
    services.sendMessage(profile, rtc, function (submitted) {
      submitting = submitted;
      message.prop('disabled', false);
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
  services.getMessage(data, mutedFP, filteredFP, profile, messages);
});
