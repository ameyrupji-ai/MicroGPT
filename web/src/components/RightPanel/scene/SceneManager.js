import * as THREE from 'three';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { BlockRenderer } from './BlockRenderer.js';
import { LabelRenderer } from './LabelRenderer.js';
import { ArrowRenderer } from './ArrowRenderer.js';
import { CameraController } from './CameraController.js';
import { HighlightManager } from './HighlightManager.js';

export class SceneManager {
  constructor(container) {
    this.container = container;
    const w = container.clientWidth;
    const h = container.clientHeight;

    // WebGL renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(w, h);
    this.renderer.setClearColor(new THREE.Color('#0d1117'));
    container.appendChild(this.renderer.domElement);

    // CSS2D renderer for labels
    this.css2dRenderer = new CSS2DRenderer();
    this.css2dRenderer.setSize(w, h);
    this.css2dRenderer.domElement.style.position = 'absolute';
    this.css2dRenderer.domElement.style.top = '0';
    this.css2dRenderer.domElement.style.left = '0';
    this.css2dRenderer.domElement.style.pointerEvents = 'none';
    container.appendChild(this.css2dRenderer.domElement);

    // Scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(new THREE.Color('#0d1117'), 0.004);

    // Camera
    this.camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 500);
    this.camera.position.set(0, 8, 55);
    this.camera.lookAt(0, 5, 0);

    // Lights
    const ambient = new THREE.AmbientLight(0x8090b0, 0.8);
    this.scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight.position.set(15, 30, 20);
    this.scene.add(dirLight);

    const backLight = new THREE.DirectionalLight(0x6366f1, 0.3);
    backLight.position.set(-10, -10, -10);
    this.scene.add(backLight);

    // Grid floor
    const grid = new THREE.GridHelper(80, 80, 0x1e2640, 0x161b22);
    grid.position.y = -20;
    this.scene.add(grid);

    // Build model components
    this.blockRenderer = new BlockRenderer(this.scene);
    this.labelRenderer = new LabelRenderer(this.scene);
    this.arrowRenderer = new ArrowRenderer(this.scene, this.blockRenderer);
    this.cameraController = new CameraController(this.camera, this.renderer.domElement);
    this.highlightManager = new HighlightManager(this.blockRenderer, this.labelRenderer);

    // Resize observer
    this._resizeObserver = new ResizeObserver(() => this._onResize());
    this._resizeObserver.observe(container);

    // Start animation loop
    this._animId = null;
    this._animate();
  }

  _onResize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.css2dRenderer.setSize(w, h);
  }

  _animate() {
    this._animId = requestAnimationFrame(() => this._animate());
    this.cameraController.update();
    this.renderer.render(this.scene, this.camera);
    this.css2dRenderer.render(this.scene, this.camera);
  }

  dispose() {
    if (this._animId) cancelAnimationFrame(this._animId);
    this._resizeObserver.disconnect();
    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
    this.container.removeChild(this.css2dRenderer.domElement);
  }
}
