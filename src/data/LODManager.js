export class LODManager extends EventTarget {
  constructor() {
    super();
    this.level = 0;
    this.focusRegion = null;
  }

  setFocus(region) {
    this.focusRegion = region || null;
    this.setLevel(region ? 2 : 0);
  }

  updateByDistance(distance) {
    if (this.focusRegion) return;
    const next = distance < 62 ? 2 : distance < 92 ? 1 : 0;
    this.setLevel(next);
  }

  setLevel(level) {
    if (this.level === level) return;
    this.level = level;
    this.dispatchEvent(new CustomEvent('change', { detail: { level, focusRegion: this.focusRegion } }));
  }
}
