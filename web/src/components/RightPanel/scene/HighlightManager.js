import * as THREE from 'three';
import { ARCH_BLOCKS, PITCH, SMALL_PITCH } from '../../../data/architecture.js';

export class HighlightManager {
  constructor(blockRenderer, labelRenderer) {
    this.blockRenderer = blockRenderer;
    this.labelRenderer = labelRenderer;
    this._cellOverlays = []; // wireframe overlay meshes for cell/row/col highlights
  }

  applyStep(step) {
    const { highlight, dim } = step;

    // Block-level highlighting (existing)
    for (const block of ARCH_BLOCKS) {
      const mesh = this.blockRenderer.getMesh(block.id);
      const label = this.labelRenderer.getLabel(block.id);
      if (!mesh) continue;

      const isHighlighted = highlight.includes(block.id);
      const isDimmed = dim === 'others' && !isHighlighted && highlight.length > 0;

      if (mesh.material) {
        if (isDimmed) {
          mesh.material.opacity = 0.08;
          mesh.material.transparent = true;
          if (mesh.material.emissive) mesh.material.emissiveIntensity = 0;
        } else if (isHighlighted) {
          mesh.material.opacity = 1.0;
          mesh.material.transparent = false;
          if (mesh.material.emissive) mesh.material.emissiveIntensity = 0.3;
        } else {
          mesh.material.opacity = 1.0;
          mesh.material.transparent = false;
          if (mesh.material.emissive) mesh.material.emissiveIntensity = 0.05;
        }
        mesh.material.needsUpdate = true;
      }

      if (label) {
        label.element.style.opacity = isDimmed ? '0.1' : '1.0';
      }
    }

    // Cell-level highlighting (new)
    this._clearCellOverlays();
    if (step.cellHighlights) {
      this._applyCellHighlights(step.cellHighlights);
    }
  }

  _clearCellOverlays() {
    for (const overlay of this._cellOverlays) {
      if (overlay.parent) {
        overlay.parent.remove(overlay);
      }
      if (overlay.geometry) overlay.geometry.dispose();
      if (overlay.material) overlay.material.dispose();
    }
    this._cellOverlays = [];
  }

  _applyCellHighlights(highlights) {
    for (const hl of highlights) {
      switch (hl.type) {
        case 'row':
          this._createRowHighlight(hl.blockId, hl.row, hl.color);
          break;
        case 'col':
          this._createColHighlight(hl.blockId, hl.col, hl.color);
          break;
        case 'cell':
          this._createCellHighlight(hl.blockId, hl.row, hl.col, hl.color);
          break;
      }
    }
  }

  _createRowHighlight(blockId, row, color) {
    const block = this.blockRenderer.getBlockDef(blockId);
    if (!block || !block.shape) return;

    const [rows, cols] = block.shape;
    const pitch = block.smallScale ? SMALL_PITCH : PITCH;
    const cellDepth = (pitch - 0.02) * 0.5;

    const width = cols * pitch;
    const height = pitch;
    const blockHeight = rows * pitch;

    const geo = new THREE.BoxGeometry(width + 0.02, height + 0.02, cellDepth + 0.04);
    const edges = new THREE.EdgesGeometry(geo);
    const mat = new THREE.LineBasicMaterial({
      color: new THREE.Color(color),
      linewidth: 2,
      depthTest: true,
      transparent: true,
      opacity: 0.9,
    });
    const line = new THREE.LineSegments(edges, mat);

    line.position.set(
      0,
      -row * pitch + blockHeight / 2 - pitch / 2,
      0.06
    );

    const group = this.blockRenderer.getGroup(blockId);
    if (group) {
      group.add(line);
      this._cellOverlays.push(line);
    }
  }

  _createColHighlight(blockId, col, color) {
    const block = this.blockRenderer.getBlockDef(blockId);
    if (!block || !block.shape) return;

    const [rows, cols] = block.shape;
    const pitch = block.smallScale ? SMALL_PITCH : PITCH;
    const cellDepth = (pitch - 0.02) * 0.5;

    const width = pitch;
    const height = rows * pitch;
    const blockWidth = cols * pitch;
    const blockHeight = rows * pitch;

    const geo = new THREE.BoxGeometry(width + 0.02, height + 0.02, cellDepth + 0.04);
    const edges = new THREE.EdgesGeometry(geo);
    const mat = new THREE.LineBasicMaterial({
      color: new THREE.Color(color),
      linewidth: 2,
      depthTest: true,
      transparent: true,
      opacity: 0.9,
    });
    const line = new THREE.LineSegments(edges, mat);

    line.position.set(
      col * pitch - blockWidth / 2 + pitch / 2,
      0,
      0.06
    );

    const group = this.blockRenderer.getGroup(blockId);
    if (group) {
      group.add(line);
      this._cellOverlays.push(line);
    }
  }

  _createCellHighlight(blockId, row, col, color) {
    const block = this.blockRenderer.getBlockDef(blockId);
    if (!block || !block.shape) return;

    const [rows, cols] = block.shape;
    const pitch = block.smallScale ? SMALL_PITCH : PITCH;
    const cellSize = pitch - 0.02;
    const cellDepth = cellSize * 0.5;

    const blockWidth = cols * pitch;
    const blockHeight = rows * pitch;

    const geo = new THREE.BoxGeometry(cellSize + 0.04, cellSize + 0.04, cellDepth + 0.06);
    const edges = new THREE.EdgesGeometry(geo);
    const mat = new THREE.LineBasicMaterial({
      color: new THREE.Color(color),
      linewidth: 2,
      depthTest: true,
      transparent: true,
      opacity: 0.9,
    });
    const line = new THREE.LineSegments(edges, mat);

    line.position.set(
      col * pitch - blockWidth / 2 + pitch / 2,
      -row * pitch + blockHeight / 2 - pitch / 2,
      0.06
    );

    const group = this.blockRenderer.getGroup(blockId);
    if (group) {
      group.add(line);
      this._cellOverlays.push(line);
    }
  }
}
