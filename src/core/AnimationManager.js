const easing = {
  easeInOut: (t) => (t < 0.5 ? 4 * t ** 3 : 1 - ((-2 * t + 2) ** 3) / 2),
  easeOut: (t) => 1 - (1 - t) ** 3,
  linear: (t) => t,
};

export class AnimationManager {
  constructor() {
    this.tweens = new Set();
  }

  to(target, values, duration = 0.8, ease = 'easeInOut', onComplete) {
    const start = {};
    Object.keys(values).forEach((key) => { start[key] = target[key]; });
    const tween = {
      target,
      start,
      values,
      duration: Math.max(duration * 1000, 1),
      startedAt: performance.now(),
      ease: easing[ease] ?? easing.easeInOut,
      onComplete,
    };
    this.tweens.add(tween);
    return () => this.tweens.delete(tween);
  }

  update(now = performance.now()) {
    this.tweens.forEach((tween) => {
      const progress = Math.min(1, (now - tween.startedAt) / tween.duration);
      const amount = tween.ease(progress);
      Object.entries(tween.values).forEach(([key, value]) => {
        tween.target[key] = tween.start[key] + (value - tween.start[key]) * amount;
      });
      if (progress >= 1) {
        this.tweens.delete(tween);
        tween.onComplete?.();
      }
    });
  }

  clear() {
    this.tweens.clear();
  }
}
