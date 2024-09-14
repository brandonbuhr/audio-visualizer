const canvas = document.getElementById("visualizer");
const canvasCtx = canvas.getContext("2d");
const audioFileInput = document.getElementById("audioFile");
const playButton = document.getElementById("playButton");
const pauseButton = document.getElementById("pauseButton");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let audioContext;
let analyzer;
let dataArray;
let source;
let audioBuffer;
let isPlaying = false;

audioFileInput.addEventListener("change", handleFileSelect);
playButton.addEventListener("click", playAudio);
pauseButton.addEventListener("click", pauseAudio);

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (file) {
    const fileReader = new FileReader();
    fileReader.onload = function () {
      decodeAudio(fileReader.result);
    };
    fileReader.readAsArrayBuffer(file);
  }
}

function decodeAudio(audioData) {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  audioContext.decodeAudioData(audioData, (buffer) => {
    audioBuffer = buffer;
  });
}

function playAudio() {
  if (!audioBuffer) return;

  if (isPlaying) {
    source.stop();
  }

  source = audioContext.createBufferSource();
  source.buffer = audioBuffer;

  analyzer = audioContext.createAnalyser();
  analyzer.fftSize = 2048;
  const bufferLength = analyzer.fftSize;
  dataArray = new Uint8Array(bufferLength);

  source.connect(analyzer);
  analyzer.connect(audioContext.destination);

  source.start();
  isPlaying = true;

  visualize();
}

function pauseAudio() {
  if (isPlaying && source) {
    source.stop();
    isPlaying = false;
  }
}

function visualize() {
  function draw() {
    if (!isPlaying) return;

    requestAnimationFrame(draw);

    analyzer.getByteTimeDomainData(dataArray);

    canvasCtx.fillStyle = "black";
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

    canvasCtx.lineWidth = 5;
    canvasCtx.strokeStyle = "blue";

    canvasCtx.beginPath();
    const sliceWidth = (canvas.width * 1.0) / dataArray.length;
    let x = 0;

    for (let i = 0; i < dataArray.length; i++) {
      const v = dataArray[i] / 128.0;
      const y = (v * canvas.height) / 2;

      if (i === 0) {
        canvasCtx.moveTo(x, y);
      } else {
        canvasCtx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    canvasCtx.lineTo(canvas.width, canvas.height / 2);
    canvasCtx.stroke();
  }

  draw();
}
