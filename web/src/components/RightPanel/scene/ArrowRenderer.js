import * as THREE from 'three';
import { CONNECTIONS, RESIDUAL_CONNECTIONS } from '../../../data/architecture.js';

export class ArrowRenderer {
  constructor(scene, blockRenderer) {
    this.scene = scene;
    this.blockRenderer = blockRenderer;

    this._buildArrows();
    this._buildResidualArrows();
  }

  _buildArrows() {
    const mat = new THREE.LineBasicMaterial({
      color: 0x30404d,
      transparent: true,
      opacity: 0.6,
    });

    for (const [srcId, dstId] of CONNECTIONS) {
      const src = this.blockRenderer.getBlockBounds(srcId);
      const dst = this.blockRenderer.getBlockBounds(dstId);
      if (!src || !dst) continue;

      const startY = src.bottom - 0.15;
      const endY = dst.top + 0.15;
      const midY = (startY + endY) / 2;

      const points = [];
      if (Math.abs(src.x - dst.x) < 0.1) {
        // Straight vertical
        points.push(new THREE.Vector3(src.x, startY, 0.1));
        points.push(new THREE.Vector3(dst.x, endY, 0.1));
      } else {
        // L-shaped with curve
        points.push(new THREE.Vector3(src.x, startY, 0.1));
        points.push(new THREE.Vector3(src.x, midY, 0.1));
        points.push(new THREE.Vector3(dst.x, midY, 0.1));
        points.push(new THREE.Vector3(dst.x, endY, 0.1));
      }

      const curve = new THREE.CatmullRomCurve3(points);
      const geo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(20));
      const line = new THREE.Line(geo, mat);
      this.scene.add(line);

      // Arrowhead
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(0.1, 0.25, 6),
        new THREE.MeshBasicMaterial({ color: 0x30404d, transparent: true, opacity: 0.6 })
      );
      cone.position.set(dst.x, endY + 0.05, 0.1);
      cone.rotation.x = Math.PI; // point downward
      this.scene.add(cone);
    }
  }

  _buildResidualArrows() {
    const mat = new THREE.LineDashedMaterial({
      color: 0x4a5568,
      transparent: true,
      opacity: 0.4,
      dashSize: 0.3,
      gapSize: 0.2,
    });

    for (const [srcId, dstId] of RESIDUAL_CONNECTIONS) {
      const src = this.blockRenderer.getBlockBounds(srcId);
      const dst = this.blockRenderer.getBlockBounds(dstId);
      if (!src || !dst) continue;

      const offsetZ = 1.2; // push toward camera
      const offsetX = Math.max(src.width, dst.width) / 2 + 1.5;
      const side = -1; // left side

      const points = [
        new THREE.Vector3(src.x + side * 0.5, src.y, offsetZ),
        new THREE.Vector3(src.x + side * offsetX, src.y, offsetZ),
        new THREE.Vector3(dst.x + side * offsetX, dst.y, offsetZ),
        new THREE.Vector3(dst.x + side * 0.5, dst.y, offsetZ),
      ];

      const curve = new THREE.CatmullRomCurve3(points);
      const geo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(30));
      const line = new THREE.Line(geo, mat);
      line.computeLineDistances(); // required for dashed lines
      this.scene.add(line);
    }
  }
}
