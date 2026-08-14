import * as THREE from 'three';

export class CameraDirector {
  constructor(camera, controls, animations) {
    this.camera = camera;
    this.controls = controls;
    this.animations = animations;
    // Keep the combined view close to plan view, but not exactly on the Z axis.
    // The small Y offset prevents OrbitControls from starting at its polar singularity.
    // Target sits slightly south so Hainan clears the bottom chrome, without
    // pushing the whole national silhouette too high in the viewport.
    this.homePosition = new THREE.Vector3(0, -22, 120);
    this.homeTarget = new THREE.Vector3(0, -3, 1);
    this.cancelMoveTweens = [];
    this.programmatic = false;
  }

  setFieldOfView(fov) {
    if (Math.abs(this.camera.fov - fov) < 0.01) return;
    this.camera.fov = fov;
    this.camera.updateProjectionMatrix();
  }

  reset(duration = 0.8) {
    this.moveTo(this.homePosition, this.homeTarget, duration, { fov: 35 });
  }

  setExploded(active) {
    // 三层货架视角：轻微侧向倾斜，避免完全正南的平板感；目标略偏东，
    // 让全国轮廓整体偏左，给右下角南海附图留出空间。
    this.controls.maxPolarAngle = THREE.MathUtils.degToRad(active ? 80 : 68);
    const position = active ? new THREE.Vector3(26, -146, 82) : this.homePosition;
    const target = active ? new THREE.Vector3(10, 1, 8) : this.homeTarget;
    this.moveTo(position, target, active ? 0.95 : 0.8, { fov: active ? 28 : 35 });
  }

  setOperationOverview() {
    // Pull back so the national outline sits in the center column between the
    // side panels and above the ticker; bias south so Hainan is not clipped.
    this.moveTo(new THREE.Vector3(2, -20, 170), new THREE.Vector3(2, -2, 8), 0.85, { fov: 31 });
  }

  focusPoint(point, options = {}) {
    const distance = options.distance ?? 58;
    const target = new THREE.Vector3(point.x, point.y, 2);
    const position = new THREE.Vector3(point.x, point.y - distance * 0.22, 2 + distance * 0.98);
    this.moveTo(position, target, options.duration ?? 0.7, { fov: options.fov ?? 35 });
  }

  focusBounds(box, duration = 0.7) {
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const distance = THREE.MathUtils.clamp(Math.max(size.x, size.y) * 3.4, 46, 72);
    this.focusPoint(center, { distance, duration });
  }

  focusProvinceBounds(box, {
    exploded = false,
    cockpit = false,
    fill = 1.08,
    duration = 0.85,
    viewWidth = 0,
    viewHeight = 0,
    aspect = 0,
  } = {}) {
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const span = Math.max(size.x, size.y);
    if (exploded) {
      // A distant camera with a narrow field of view reduces perspective size
      // differences between the lower and upper province sheets without making
      // the province itself look small on screen.
      const distance = THREE.MathUtils.clamp(span * 5.4, 92, 148);
      const target = new THREE.Vector3(center.x, center.y, 8);
      const position = new THREE.Vector3(center.x + distance * 0.03, center.y - distance * 0.78, 8 + distance * 0.82);
      this.moveTo(position, target, duration, { fov: 26 });
      return;
    }
    const distance = THREE.MathUtils.clamp(span * 4.2, 38, 76);
    if (cockpit) {
      this.focusCockpitBounds(center, size, { duration, viewWidth, viewHeight, aspect, margin: fill });
      return;
    }
    this.focusPoint(center, { distance, duration, fov: 28 });
  }

  focusCockpitBounds(center, size, { duration = 0.85, viewWidth = 0, viewHeight = 0, aspect = 0, margin = 1.08 } = {}) {
    const fov = 24;
    const halfFov = THREE.MathUtils.degToRad(fov) * 0.5;
    const width = viewWidth > 0 ? viewWidth : 1600;
    const height = viewHeight > 0 ? viewHeight : 900;
    const cameraAspect = aspect > 0 ? aspect : width / height;
    const padLeft = 348;
    const padRight = 348;
    const padTop = 118;
    const padBottom = 92;
    const wellWidth = Math.max(240, width - padLeft - padRight);
    const wellHeight = Math.max(200, height - padTop - padBottom);
    const wellX = padLeft + wellWidth * 0.5;
    const wellY = padTop + wellHeight * 0.5;
    const fitWidth = Math.max(size.x, 0.8) * margin;
    const fitHeight = Math.max(size.y, 0.8) * margin;
    const wellWidthFrac = wellWidth / width;
    const wellHeightFrac = wellHeight / height;
    const distForHeight = fitHeight / (2 * Math.tan(halfFov) * wellHeightFrac);
    const distForWidth = fitWidth / (2 * Math.tan(halfFov) * cameraAspect * wellWidthFrac);
    const pullback = THREE.MathUtils.clamp(Math.max(distForHeight, distForWidth), 16, 320);
    const visibleHeight = 2 * pullback * Math.tan(halfFov);
    const visibleWidth = visibleHeight * cameraAspect;
    const shiftX = ((wellX - width * 0.5) / width) * visibleWidth;
    const shiftY = -((wellY - height * 0.5) / height) * visibleHeight;
    const tilt = THREE.MathUtils.degToRad(16);
    const surfaceZ = Number.isFinite(center.z) ? center.z : 8;
    const target = new THREE.Vector3(center.x + shiftX, center.y + shiftY, surfaceZ);
    const position = new THREE.Vector3(
      center.x + shiftX,
      center.y + shiftY - pullback * Math.sin(tilt),
      surfaceZ + pullback * Math.cos(tilt),
    );
    this.moveTo(position, target, duration, { fov });
  }

  settleControls() {
    const delta = this.controls.sphericalDelta ?? this.controls._sphericalDelta;
    if (delta?.set) delta.set(0, 0, 0);
    const pan = this.controls.panOffset ?? this.controls._panOffset;
    if (pan?.set) pan.set(0, 0, 0);
    this.controls.update();
  }

  moveTo(position, target, duration = 0.8, { fov } = {}) {
    this.cancelMove();
    this.programmatic = true;
    this.controls.enabled = false;
    this.cancelMoveTweens = [
      this.animations.to(this.camera.position, { x: position.x, y: position.y, z: position.z }, duration),
      this.animations.to(this.controls.target, { x: target.x, y: target.y, z: target.z }, duration, 'easeInOut', () => {
        this.programmatic = false;
        this.controls.enabled = true;
        this.settleControls();
      }),
    ];
    if (Number.isFinite(fov)) {
      // Use an accessor so the projection matrix is refreshed on every tween
      // frame. Lens changes now travel with the camera instead of snapping at
      // stage boundaries or leaking a close-up FOV into the next scene.
      const lens = {
        get value() { return this.camera.fov; },
        set value(value) {
          this.camera.fov = value;
          this.camera.updateProjectionMatrix();
        },
        camera: this.camera,
      };
      this.cancelMoveTweens.push(this.animations.to(lens, { value: fov }, duration));
    }
  }

  cancelMove() {
    this.cancelMoveTweens.forEach((cancel) => cancel?.());
    this.cancelMoveTweens = [];
    this.programmatic = false;
    if (this.controls) this.controls.enabled = true;
  }
}
