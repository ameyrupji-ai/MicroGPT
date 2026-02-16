import * as THREE from 'three';
import { ARCH_BLOCKS, PITCH, SMALL_PITCH } from '../../../data/architecture.js';

// Deterministic seeded PRNG (mulberry32)
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

// Map a value in [-1, 1] to a color: negative=orange, positive=blue
function weightToColor(val, baseColor) {
  const color = new THREE.Color();
  if (val >= 0) {
    // Blue range
    const brightness = 0.15 + Math.abs(val) * 0.55;
    color.setHSL(0.6, 0.7, brightness);
  } else {
    // Orange range
    const brightness = 0.15 + Math.abs(val) * 0.55;
    color.setHSL(0.08, 0.75, brightness);
  }
  return color;
}

export class BlockRenderer {
  constructor(scene) {
    this.scene = scene;
    this.meshes = {};   // id → InstancedMesh
    this.groups = {};   // id → THREE.Group
    this.opMeshes = {}; // id → Mesh (for op nodes)

    this._buildBlocks();
  }

  _buildBlocks() {
    for (const block of ARCH_BLOCKS) {
      if (block.type === 'op') {
        this._buildOpNode(block);
      } else if (block.shape) {
        this._buildMatrixBlock(block);
      }
    }
  }

  _buildMatrixBlock(block) {
    const [rows, cols] = block.shape;
    const pitch = block.smallScale ? SMALL_PITCH : PITCH;
    const cellSize = pitch - 0.02;
    const count = rows * cols;

    const group = new THREE.Group();
    group.position.set(...block.position);
    this.scene.add(group);
    this.groups[block.id] = group;

    const geo = new THREE.BoxGeometry(cellSize, cellSize, cellSize * 0.5);
    const baseColor = new THREE.Color(block.color);
    const mat = new THREE.MeshPhongMaterial({
      flatShading: true,
      transparent: true,
      opacity: 1.0,
      emissive: baseColor,
      emissiveIntensity: 0.05,
    });

    const mesh = new THREE.InstancedMesh(geo, mat, count);
    mesh.userData = { blockId: block.id };

    const dummy = new THREE.Object3D();
    const colorObj = new THREE.Color();
    const rand = mulberry32(hashString(block.id));

    const blockWidth = cols * pitch;
    const blockHeight = rows * pitch;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        const val = (rand() - 0.5) * 2; // [-1, 1]

        dummy.position.set(
          c * pitch - blockWidth / 2 + pitch / 2,
          -r * pitch + blockHeight / 2 - pitch / 2,
          0
        );
        dummy.updateMatrix();
        mesh.setMatrixAt(idx, dummy.matrix);

        const col = weightToColor(val, block.color);
        mesh.setColorAt(idx, col);
      }
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

    group.add(mesh);
    this.meshes[block.id] = mesh;
  }

  _buildOpNode(block) {
    const group = new THREE.Group();
    group.position.set(...block.position);
    this.scene.add(group);
    this.groups[block.id] = group;

    const geo = new THREE.OctahedronGeometry(0.3, 0);
    const mat = new THREE.MeshPhongMaterial({
      color: new THREE.Color(block.color),
      flatShading: true,
      transparent: true,
      opacity: 1.0,
      emissive: new THREE.Color(block.color),
      emissiveIntensity: 0.1,
    });
    const mesh = new THREE.Mesh(geo, mat);
    group.add(mesh);
    this.opMeshes[block.id] = mesh;
    this.meshes[block.id] = mesh; // for highlight manager
  }

  getMesh(id) {
    return this.meshes[id] || null;
  }

  getGroup(id) {
    return this.groups[id] || null;
  }

  // Get the world-space bounding info for a block (for arrows)
  getBlockBounds(id) {
    const block = ARCH_BLOCKS.find(b => b.id === id);
    if (!block) return null;

    const [px, py, pz] = block.position;

    if (block.type === 'op' || !block.shape) {
      return { x: px, y: py, z: pz, top: py + 0.3, bottom: py - 0.3, width: 0.6 };
    }

    const [rows, cols] = block.shape;
    const pitch = block.smallScale ? SMALL_PITCH : PITCH;
    const halfH = (rows * pitch) / 2;
    const halfW = (cols * pitch) / 2;
    return { x: px, y: py, z: pz, top: py + halfH, bottom: py - halfH, width: halfW * 2 };
  }
}
