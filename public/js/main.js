var $ = require('jquery');
var ReconnectingWebSocket = require('ReconnectingWebSocket');
var Webrtc2images = require('webrtc2images');

var rtc = false;
var webmSupport = false;

rtc = new Webrtc2images({
  width: 200,
  height: 150,
  frames: 10,
  type: 'image/png',
  interval: 200
});

var testVideo = $('video')[0];

if (testVideo.canPlayType('video/webm; codecs="vp8, vorbis"')) {
  webmSupport = true;
}

var ws = new ReconnectingWebSocket('ws://' +
  location.hostname + (location.port ? ':' + location.port : ''));

ws.onopen = function () {
  console.log('Connected');
};

var messages = $('#messages');
var messagesFiltered = $('#messages-filtered');
var filtered = $('#filtered');
var unmute = $('#unmute');
var invisible = $('#invisible');
var invisibleMode = $('#invisible-mode');
var form = $('form');
var comment = $('#comment');
var sadBrowser = $('#sad-browser');

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
        ws.send(JSON.stringify({
          message: comment.val(),
          media: frames
        }));
      }

      submitting = false;
      comment.val('');
    });
  }
});

ws.onmessage = function (ev) {
  var data = JSON.parse(ev.data);
  var li = $('<li></li>');
  var video = $('<video src="' + data.media + '", autoplay="autoplay", loop></video>');
  var p = $('<p></p>');
  var actions = $('<div class="actions"><button id="mute">mute</button><button id="filter">filter</button>');
  p.html(data.message);
  li.append(video).append(p).append(actions);
  messages.append(li);
  li[0].scrollIntoView();
}
