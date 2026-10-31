export interface PointerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  isMoving: boolean;
  isDown: boolean;
  isInWindow: boolean;
}

type Subscriber = (state: PointerState) => void;

let x = -1000;
let y = -1000;
let vx = 0;
let vy = 0;
let isDown = false;
let isInWindow = false;
let isMoving = false;
let lastMoveTime = 0;
let lastX = -1000;
let lastY = -1000;
let lastTime = 0;
let rafId: number | null = null;
let initialized = false;
let storeCleanup: (() => void) | null = null;

const subscribers = new Set<Subscriber>();

function loop(currentTime: number) {
  if (currentTime - lastMoveTime >= 1500) {
    isMoving = false;
    vx = 0;
    vy = 0;
    rafId = null;
    const currentState: PointerState = { x, y, vx, vy, isMoving, isDown, isInWindow };
    subscribers.forEach((fn) => fn(currentState));
    return;
  }

  const dt = (currentTime - lastTime) / 1000;
  if (dt > 0.001) {
    const rawVx = (x - lastX) / dt;
    const rawVy = (y - lastY) / dt;
    vx = vx * 0.7 + rawVx * 0.3;
    vy = vy * 0.7 + rawVy * 0.3;
    lastX = x;
    lastY = y;
    lastTime = currentTime;
  }

  const currentState: PointerState = { x, y, vx, vy, isMoving: true, isDown, isInWindow };
  subscribers.forEach((fn) => fn(currentState));

  if (subscribers.size > 0) {
    rafId = requestAnimationFrame(loop);
  } else {
    rafId = null;
  }
}

function startLoop() {
  if (rafId === null && subscribers.size > 0) {
    lastTime = performance.now();
    rafId = requestAnimationFrame(loop);
  }
}

function onPointerMove(e: PointerEvent) {
  x = e.clientX;
  y = e.clientY;
  isInWindow = true;
  lastMoveTime = performance.now();
  startLoop();
}

function onPointerDown() {
  isDown = true;
}

function onPointerUp() {
  isDown = false;
}

function onWindowLeave() {
  isInWindow = false;
}

function onWindowEnter() {
  isInWindow = true;
}

export function initPointerStore(): () => void {
  if (typeof window === 'undefined' || initialized) {
    return () => {};
  }
  initialized = true;

  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerdown', onPointerDown, { passive: true });
  window.addEventListener('pointerup', onPointerUp, { passive: true });
  document.documentElement.addEventListener('pointerleave', onWindowLeave, { passive: true });
  document.documentElement.addEventListener('pointerenter', onWindowEnter, { passive: true });

  return () => {
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerdown', onPointerDown);
    window.removeEventListener('pointerup', onPointerUp);
    document.documentElement.removeEventListener('pointerleave', onWindowLeave);
    document.documentElement.removeEventListener('pointerenter', onWindowEnter);
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    initialized = false;
  };
}

export function subscribePointer(fn: Subscriber): () => void {
  subscribers.add(fn);
  if (subscribers.size === 1) {
    storeCleanup = initPointerStore();
  }
  startLoop();
  return () => {
    subscribers.delete(fn);
    if (subscribers.size === 0 && storeCleanup) {
      storeCleanup();
      storeCleanup = null;
    }
  };
}

export function getPointerState(): PointerState {
  return { x, y, vx, vy, isMoving, isDown, isInWindow };
}
