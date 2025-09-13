const videoElement = document.getElementById('video');
const canvasElement = document.getElementById('overlay');
const canvasCtx = canvasElement.getContext('2d');
const detectBtn = document.getElementById('detectBtn');
const stopBtn = document.getElementById('stopBtn');
const statusEl = document.getElementById('status');
const fingerCountEl = document.getElementById('fingerCount');

let camera = null;
let running = false;

const hands = new Hands({
  locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
  }
});

hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.6,
  minTrackingConfidence: 0.6
});

hands.onResults(onResults);

function resizeCanvasToVideo() {
  canvasElement.width = videoElement.videoWidth;
  canvasElement.height = videoElement.videoHeight;
}

function onResults(results) {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  if (results.image) {
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
  }

  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    for (const landmarks of results.multiHandLandmarks) {
      drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {lineWidth:2});
      drawLandmarks(canvasCtx, landmarks, {radius:3});
      const count = countFingersFromLandmarks(landmarks);
      fingerCountEl.textContent = count;
    }
  } else {
    fingerCountEl.textContent = 0;
  }

  canvasCtx.restore();
}

function countFingersFromLandmarks(landmarks) {
  const tips = [4, 8, 12, 16, 20];
  const pips = [2, 6, 10, 14, 18];
  let count = 0;

  const wrist = landmarks[0];
  const indexMcp = landmarks[5];
  const isLeft = indexMcp.x < wrist.x;

  const thumbTip = landmarks[4];
  const thumbIp = landmarks[3];
  if (isLeft) {
    if (thumbTip.x < thumbIp.x - 0.02) count++;
  } else {
    if (thumbTip.x > thumbIp.x + 0.02) count++;
  }

  for (let i = 1; i < 5; i++) {
    const tip = landmarks[tips[i]];
    const pip = landmarks[pips[i]];
    if (tip.y < pip.y - 0.02) count++;
  }

  return count;
}

detectBtn.addEventListener('click', async () => {
  if (running) return;
  statusEl.textContent = 'Status: Initializing camera...';
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: false });
    videoElement.srcObject = stream;
    await videoElement.play();
    resizeCanvasToVideo();

    camera = new Camera(videoElement, {
      onFrame: async () => {
        await hands.send({ image: videoElement });
      },
      width: 640,
      height: 480
    });
    camera.start();

    running = true;
    detectBtn.disabled = true;
    stopBtn.disabled = false;
    statusEl.textContent = 'Status: Detecting...';
  } catch (e) {
    console.error(e);
    statusEl.textContent = 'Status: Camera not available.';
  }
});

stopBtn.addEventListener('click', () => {
  if (!running) return;
  if (camera) camera.stop();
  const stream = videoElement.srcObject;
  if (stream) {
    stream.getTracks().forEach(t => t.stop());
  }
  videoElement.srcObject = null;
  running = false;
  detectBtn.disabled = false;
  stopBtn.disabled = true;
  statusEl.textContent = 'Status: Stopped';
});
