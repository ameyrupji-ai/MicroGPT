import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

export class CameraController {
  constructor(camera, domElement) {
    this.camera = camera;
    this.controls = new OrbitControls(camera, domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.screenSpacePanning = true;
    this.controls.maxDistance = 100;
    this.controls.minDistance = 3;

    this._animating = false;
    this._startPos = new THREE.Vector3();
    this._endPos = new THREE.Vector3();
    this._startTarget = new THREE.Vector3();
    this._endTarget = new THREE.Vector3();
    this._startTime = 0;
    this._duration = 1400; // ms
  }

  animateTo({ position, lookAt }) {
    this._startPos.copy(this.camera.position);
    this._startTarget.copy(this.controls.target);
    this._endPos.set(...position);
    this._endTarget.set(...lookAt);
    this._startTime = performance.now();
    this._animating = true;
    this.controls.enabled = false;
  }

  update() {
    if (this._animating) {
      const elapsed = performance.now() - this._startTime;
      const raw = Math.min(elapsed / this._duration, 1);
      const t = easeInOutCubic(raw);

      this.camera.position.lerpVectors(this._startPos, this._endPos, t);
      this.controls.target.lerpVectors(this._startTarget, this._endTarget, t);

      if (raw >= 1) {
        this._animating = false;
        this.controls.enabled = true;
      }
    }
    this.controls.update();
  }
}
