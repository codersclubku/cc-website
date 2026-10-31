export interface HalftoneInstance {
  tick: (now: number) => boolean;
  isVisible: () => boolean;
}

const instances = new Set<HalftoneInstance>();
let rafId: number | null = null;

function loop(now: number) {
  let anyActive = false;
  for (const inst of instances) {
    if (inst.isVisible()) {
      const needsNext = inst.tick(now);
      if (needsNext) {
        anyActive = true;
      }
    }
  }

  if (anyActive && instances.size > 0) {
    rafId = requestAnimationFrame(loop);
  } else {
    rafId = null;
  }
}

export function requestHalftoneTick(): void {
  if (rafId === null && instances.size > 0) {
    rafId = requestAnimationFrame(loop);
  }
}

export function registerHalftoneInstance(inst: HalftoneInstance): () => void {
  instances.add(inst);
  requestHalftoneTick();
  return () => {
    instances.delete(inst);
    if (instances.size === 0 && rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };
}
