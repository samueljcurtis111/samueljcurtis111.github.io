
const canvas = document.getElementById('simCanvas');
const ctx = canvas.getContext('2d');

const kpInput = document.getElementById('kp');
const kiInput = document.getElementById('ki');
const kdInput = document.getElementById('kd');
const setpointInput = document.getElementById('setpoint');

const kpVal = document.getElementById('kp-val');
const kiVal = document.getElementById('ki-val');
const kdVal = document.getElementById('kd-val');
const setpointVal = document.getElementById('setpoint-val');
const resetBtn = document.getElementById('reset-btn');

let setpoint = parseFloat(setpointInput.value) || 0;
let prevSetpoint = setpoint;
let pv = 50;
let velocity = 0;
let integral = 0;


const MAX_OUTPUT = 1500;
const MIN_OUTPUT = -1500;
const MASS = 1.0;
const DAMPING = 0.1;

let lastTime = performance.now();
let history = [];

// Logical canvas dimension cache
let logicalWidth = canvas.width;
let logicalHeight = canvas.height;

function setupCanvasResolution() {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  if (rect.width === 0 || rect.height === 0) return;

  logicalWidth = rect.width;
  logicalHeight = rect.height;

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;

  ctx.scale(dpr, dpr);
}

function updateUIReadouts() {
  kpVal.textContent = parseFloat(kpInput.value).toFixed(2);
  kiVal.textContent = parseFloat(kiInput.value).toFixed(3);
  kdVal.textContent = parseFloat(kdInput.value).toFixed(2);
  setpointVal.textContent = setpointInput.value;
}

function updateSimulation(dt) {
  if (dt <= 0 || dt > 0.5) return;

  const kp = parseFloat(kpInput.value) || 0;
  const ki = parseFloat(kiInput.value) || 0;
  const kd = parseFloat(kdInput.value) || 0;
  setpoint = parseFloat(setpointInput.value) || 0;

  if (setpoint !== prevSetpoint) {
    integral = 0;
    prevSetpoint = setpoint;
  }

  const error = setpoint - pv;

  const pTerm = kp * error;
  const dTerm = kd * -velocity;

  let output = pTerm + ki * integral + dTerm;

  if (!(
      (output >= MAX_OUTPUT && error > 0) ||
      (output <= MIN_OUTPUT && error < 0)
  )) {
    integral += error * dt;
  }

  output = pTerm + ki * integral + dTerm;
  if (output > MAX_OUTPUT) output = MAX_OUTPUT;
  else if (output < MIN_OUTPUT) output = MIN_OUTPUT;

  const acceleration = (output - velocity * DAMPING) / MASS;
  velocity += acceleration * dt;
  pv += velocity * dt;

  history.push(pv);
  if (history.length > logicalWidth) {
    history.shift();
  }
}

function render() {
  ctx.clearRect(0, 0, logicalWidth, logicalHeight);
  ctx.imageSmoothingEnabled = false; // Ensure crisp lines

  const MAX_Y_VAL = 1000;
  const scaleY = logicalHeight / MAX_Y_VAL;

  ctx.strokeStyle = '#ff4444';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  const scaledSetpointY = Math.floor(logicalHeight - setpoint * scaleY) + 0.5;
  ctx.moveTo(0, scaledSetpointY);
  ctx.lineTo(logicalWidth, scaledSetpointY);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.strokeStyle = '#44ff44';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  history.forEach((val, x) => {
    const y = Math.round(logicalHeight - val * scaleY);
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
}

function loop(currentTime) {
  let rawDt = (currentTime - lastTime) / 1000;
  lastTime = currentTime;

  const SIM_SPEED = 2.5;
  const dt = rawDt * SIM_SPEED;

  updateUIReadouts();
  updateSimulation(dt);
  render();

  requestAnimationFrame(loop);
}

function resetSimulation() {
  pv = 50;
  velocity = 0;
  integral = 0;
  history = [];
  lastTime = performance.now();
}

resetBtn.addEventListener('click', resetSimulation);
window.addEventListener('resize', setupCanvasResolution);

window.addEventListener('load', () => {
  setupCanvasResolution();
});

setupCanvasResolution();
requestAnimationFrame(loop);