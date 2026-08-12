import * as THREE from 'three';

export class CameraDirector {
  constructor(camera, controls, animations) {
    this.camera = camera;
    this.controls = controls;
    this.animations = animations;
    // Keep the combined view close to plan view, but not exactly on the Z axis.
    // The small Y offset prevents OrbitControls from starting at its polar singularity.
    this.homePosition = new THREE.Vector3(0, -18, 118);
    this.homeTarget = new THREE.Vector3(0, 0, 1);
    this.cancelMoveTweens = [];
  }

  reset(duration = 0.8) {
    this.moveTo(this.homePosition, this.homeTarget, duration);
  }

  setExploded(active) {
    // View the co-axial stack obliquely. Separation is produced by real Z depth,
    // not by sliding the three maps apart across the map plane.
    const position = active ? new THREE.Vector3(6, -138, 122) : this.homePosition;
    const target = active ? new THREE.Vector3(0, 0, 20) : this.homeTarget;
    this.moveTo(position, target, active ? 0.95 : 0.8);
  }

  focusPoint(point, options = {}) {
    const distance = options.distance ?? 58;
    const target = new THREE.Vector3(point.x, point.y, 2);
    const position = new THREE.Vector3(point.x, point.y - distance * 0.22, 2 + distance * 0.98);
    this.moveTo(position, target, options.duration ?? 0.7);
  }

  focusBounds(box, duration = 0.7) {
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const distance = THREE.MathUtils.clamp(Math.max(size.x, size.y) * 3.4, 46, 72);
    this.focusPoint(center, { distance, duration });
  }

  moveTo(position, target, duration = 0.8) {
    this.cancelMove();
    this.cancelMoveTweens = [
      this.animations.to(this.camera.position, { x: position.x, y: position.y, z: position.z }, duration),
      this.animations.to(this.controls.target, { x: target.x, y: target.y, z: target.z }, duration),
    ];
  }

  cancelMove() {
    this.cancelMoveTweens.forEach((cancel) => cancel?.());
    this.cancelMoveTweens = [];
  }
}
