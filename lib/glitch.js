'use strict';

var glitcher = require('glitcher');
var readimage = require('readimage');

module.exports = glitch;


var MAX_GLITCHES = 5;
var MAX_TIME = 500;

var playlist = {
  'interlace': interlace,
  'interlaced': interlace,
  'invert': solarize,
  'solarize': solarize,
  'solarized': solarize,
  'tiedye': tiedye,
  'predator': tiedye,
  'predators': tiedye,
  'grayscale': grayscale,
  'greyscale': grayscale,
  'smear': smear,
  'smeared': smear,
  'pieces': pieces,
  'slice': pieces,
  'shuffle': shuffle,
  'tracer': tracers,
  'tracers': tracers,
  'rainbow': rainbow,
  'rainbows': rainbow,
  'mesh': mesh,
  'bars': bars,
  'bands': bands,
  'band': bands,
  'swap': swap,
  'sparkle': sparkles,
  'sparkles': sparkles,
  'red': red,
  'unred': unred,
  'green': green,
  'ungreen': ungreen,
  'blue': blue,
  'unblue': unblue,
  'white': white,
  'unwhite': unwhite,
  'black': black,
  'unblack': unblack,
  'bginterlace': bginterlace,
  'fginterlace': fginterlace,
  'bggray': bggray,
  'bggrey': bggray,
  'fggray': fggray,
  'fggrey': fggray,
  'bg': background, // random memory into background
  'background': background,
  'fg': foreground, // random memory into foreground
  'foreground': foreground,
  'lsd': lsd, // predator foreground
  'dmt': dmt, // predator background
  'sort': sort,

};

function glitch(images, message) {
  var s = Date.now();
  var words = message.split(/\W/);
  var glitchCount = 0;
  words.forEach(function (word) {
    if (glitchCount > MAX_GLITCHES) {
      // Abort on too many glitches
      return;
    }
    if (Date.now() - s > MAX_TIME) {
      // Abort early for too many slow glitches
      return;
    }
    word = word.toLowerCase();
    if (playlist[word]) {
      glitchCount++;
      playlist[word](images);
    }
  })
  // Always at least do smear
  if (glitchCount === 0) {
    smear(images);
  }
  //console.log("elapsed %s", Date.now() - s);
}

function dropper(images) {
  for (var i = 0; i < images.length; i++) {
    glitcher.glitchClamp(images[i].frames[0].data, 120, 25);
  }
}

function pieces(images) {
  for (var i = 0; i < images.length; i++) {
    var image = images[i];
    var factor = (Math.random() * image.width * image.height * 4) | 0;
    glitcher.rowslice(image.frames[0].data, factor);
  }
}

function hack(images) {
  for (var i = 0; i < images.length; i++) {
    glitcher.superGhost(images[i].frames[0].data, 120, 25);
  }
}

function smear(images) {
  for (var i = 0; i < images.length; i++) {
    glitcher.smearChannel(images[i].frames[0].data, 0, (Math.random() * 10) | 0);
  }
}

function interlace(images) {
  for (var i = 0; i < images.length; i++) {
    glitcher.interleave(images[i].width, images[i].frames[0].data);
  }
}

function solarize(images) {
  for (var i = 0; i < images.length; i++) {
    glitcher.invertRGBA(images[i].frames[0].data);
  }
}

function grayscale(images) {
  for (var i = 0; i < images.length; i++) {
    glitcher.grayscale(images[i].frames[0].data);
  }
}

function tiedye(images) {
  for (var i = 0; i < images.length; i++) {
    glitcher.rainbowClamp(images[i].frames[0].data);
  }
}

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;
  while (0 !== currentIndex) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
}

function rainbow(images) {
  var superImage = new readimage.Image(images[0].height, images[0].width);
  for (var i = 0; i < images.length; i++) {
    superImage.addFrame(images[i].frames[0].data);
  }
  glitcher.rainbow(superImage.frames);
}

function tracers(images) {
  var dupe = null;
  for (var i = images.length - 1; i > 0; i--) {
    dupe = glitcher.copy(images[i - 1].frames[0].data);
    glitcher.cloneChannel(dupe, images[i].frames[0].data, 0);
    if (i - 2 >= 0) {
      dupe = glitcher.copy(images[i - 2].frames[0].data);
      glitcher.cloneChannel(dupe, images[i].frames[0].data, 1);
    }
    if (i - 3 >= 0) {
      dupe = glitcher.copy(images[i - 3].frames[0].data);
      glitcher.cloneChannel(dupe, images[i].frames[0].data, 2);
    }
  }
}

function mesh(images) {
  for (var i = 0; i < images.length; i++) {
    var dupe = glitcher.copy(images[i].frames[0].data);
    glitcher.reverseRGBA(dupe)
    glitcher.interleave(images[i].width, images[i].frames[0].data, dupe);
  }
}

function bars(images) {
  for (var i = 0; i < images.length; i++) {
    glitcher.interleaveVertical(images[i].frames[0].data);
  }
}

function bands(images) {
  for (var i = 0; i < images.length; i++) {
    var dupe = glitcher.copy(images[i].frames[0].data);
    glitcher.reverseRGBA(dupe)
    glitcher.interleaveVertical(images[i].frames[0].data, dupe);
  }
}

function swap(images) {
  var chan1 = (Math.random() * 100) | 0
  var chan2 = (Math.random() * 100) | 0
  for (var i = 0; i < images.length; i++) {
    glitcher.swapChannels(images[i].frames[0].data, chan1, chan2);
  }
}

function sparkles(images) {
  for (var i = 0; i < images.length; i++) {
    glitcher.sparkle(images[i].width, images[i].frames[0].data);
  }
}

function red(images) {
  for (var i = 0; i < images.length; i++) {
    var rgba = images[i].frames[0].data
    glitcher.chromaKey(rgba, [255, 0, 0], new Buffer(rgba.length), 200);
  }
}

function unred(images) {
  for (var i = 0; i < images.length; i++) {
    var rgba = images[i].frames[0].data
    glitcher.chromaKeyInverse(rgba, [255, 0, 0], new Buffer(rgba.length), 200);
  }
}

function green(images) {
  for (var i = 0; i < images.length; i++) {
    var rgba = images[i].frames[0].data
    glitcher.chromaKey(rgba, [0, 255, 0], new Buffer(rgba.length), 200);
  }
}

function ungreen(images) {
  for (var i = 0; i < images.length; i++) {
    var rgba = images[i].frames[0].data
    glitcher.chromaKeyInverse(rgba, [0, 255, 0], new Buffer(rgba.length), 200);
  }
}

function blue(images) {
  for (var i = 0; i < images.length; i++) {
    var rgba = images[i].frames[0].data
    glitcher.chromaKey(rgba, [0, 0, 255], new Buffer(rgba.length), 150);
  }
}

function unblue(images) {
  for (var i = 0; i < images.length; i++) {
    var rgba = images[i].frames[0].data
    glitcher.chromaKeyInverse(rgba, [0, 0, 255], new Buffer(rgba.length), 150);
  }
}

function white(images) {
  for (var i = 0; i < images.length; i++) {
    var rgba = images[i].frames[0].data
    glitcher.chromaKey(rgba, [255, 255, 255], new Buffer(rgba.length), 150);
  }
}

function unwhite(images) {
  for (var i = 0; i < images.length; i++) {
    var rgba = images[i].frames[0].data
    glitcher.chromaKeyInverse(rgba, [255, 255, 255], new Buffer(rgba.length), 150);
  }
}

function black(images) {
  for (var i = 0; i < images.length; i++) {
    var rgba = images[i].frames[0].data
    glitcher.chromaKey(rgba, [0, 0, 0], new Buffer(rgba.length), 150);
  }
}

function unblack(images) {
  for (var i = 0; i < images.length; i++) {
    var rgba = images[i].frames[0].data
    glitcher.chromaKeyInverse(rgba, [0, 0, 0], new Buffer(rgba.length), 150);
  }
}

function bginterlace(images) {
  var superImage = new readimage.Image(images[0].height, images[0].width);
  for (var i = 0; i < images.length; i++) {
    superImage.addFrame(images[i].frames[0].data);
  }
  function replacer(frame) {
    glitcher.interleave(superImage.width, frame)
  }
  glitcher.replaceBackground(superImage.frames, replacer, 30);
}

function fginterlace(images) {
  var superImage = new readimage.Image(images[0].height, images[0].width);
  for (var i = 0; i < images.length; i++) {
    superImage.addFrame(images[i].frames[0].data);
  }
  function replacer(frame) {
    glitcher.interleave(superImage.width, frame)
  }
  glitcher.replaceForeground(superImage.frames, replacer, 30);
}

function bggray(images) {
  var superImage = new readimage.Image(images[0].height, images[0].width);
  for (var i = 0; i < images.length; i++) {
    superImage.addFrame(images[i].frames[0].data);
  }
  function replacer(frame) {
    glitcher.grayscale(frame)
  }
  glitcher.replaceBackground(superImage.frames, replacer, 30);
}

function fggray(images) {
  var superImage = new readimage.Image(images[0].height, images[0].width);
  for (var i = 0; i < images.length; i++) {
    superImage.addFrame(images[i].frames[0].data);
  }
  function replacer(frame) {
    glitcher.grayscale(frame)
  }
  glitcher.replaceForeground(superImage.frames, replacer, 30);
}

function background(images) {
  var superImage = new readimage.Image(images[0].height, images[0].width);
  for (var i = 0; i < images.length; i++) {
    superImage.addFrame(images[i].frames[0].data);
  }
  function replacer(frame) {
    new Buffer(frame.length).copy(frame)
  }
  glitcher.replaceBackground(superImage.frames, replacer, 30);
}

function foreground(images) {
  var superImage = new readimage.Image(images[0].height, images[0].width);
  for (var i = 0; i < images.length; i++) {
    superImage.addFrame(images[i].frames[0].data);
  }
  function replacer(frame) {
    new Buffer(frame.length).copy(frame)
  }
  glitcher.replaceForeground(superImage.frames, replacer, 30);
}

function lsd(images) {
  var superImage = new readimage.Image(images[0].height, images[0].width);
  for (var i = 0; i < images.length; i++) {
    superImage.addFrame(images[i].frames[0].data);
  }
  function replacer(frame) {
    glitcher.rainbowClamp(frame)
  }
  glitcher.replaceForeground(superImage.frames, replacer, 30);
}

function dmt(images) {
  var superImage = new readimage.Image(images[0].height, images[0].width);
  for (var i = 0; i < images.length; i++) {
    superImage.addFrame(images[i].frames[0].data);
  }
  function replacer(frame) {
    glitcher.rainbowClamp(frame)
  }
  glitcher.replaceBackground(superImage.frames, replacer, 30);
}

function sort(images) {
  var rowWidth = images[0].width;
  for (var i = 0; i < images.length; i++) {
    glitcher.rowSort(rowWidth, images[i].frames[0].data);
  }
}
