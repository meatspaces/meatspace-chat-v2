var $ = require('jquery');

var music = [
  'meatspace.wav',
  'pleasure.wav',
  'funk.wav'
];

exports.showMusic = function () {
  var audio = music[Math.floor(Math.random() * music.length)];
  var audioTag = '<audio controls><source src="https://dl.dropboxusercontent.com/u/17064414/' + audio + '" type="audio/wav"></source></audio>';

  document.getElementById('audio').innerHTML = audioTag;
};
