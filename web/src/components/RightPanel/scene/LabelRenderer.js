import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { ARCH_BLOCKS, PITCH, SMALL_PITCH } from '../../../data/architecture.js';

export class LabelRenderer {
  constructor(scene) {
    this.scene = scene;
    this.labels = {}; // id → CSS2DObject

    this._buildLabels();
  }

  _buildLabels() {
    for (const block of ARCH_BLOCKS) {
      const div = document.createElement('div');
      div.style.fontFamily = "'JetBrains Mono', 'Fira Code', monospace";
      div.style.fontSize = '11px';
      div.style.whiteSpace = 'nowrap';
      div.style.userSelect = 'none';
      div.style.pointerEvents = 'none';
      div.style.textShadow = '0 1px 4px rgba(0,0,0,0.8)';
      div.style.transition = 'opacity 0.4s ease';

      const nameSpan = document.createElement('span');
      nameSpan.textContent = block.label;
      nameSpan.style.color = block.color;
      nameSpan.style.fontWeight = '700';
      div.appendChild(nameSpan);

      if (block.sublabel) {
        const sub = document.createElement('span');
        sub.textContent = '  ' + block.sublabel;
        sub.style.color = '#8b949e';
        sub.style.fontWeight = '400';
        div.appendChild(sub);
      }

      const label = new CSS2DObject(div);

      // Position label to the right of the block
      let offsetX = 0.8;
      if (block.shape) {
        const [, cols] = block.shape;
        const pitch = block.smallScale ? SMALL_PITCH : PITCH;
        offsetX = (cols * pitch) / 2 + 0.6;
      }

      label.position.set(
        block.position[0] + offsetX,
        block.position[1],
        block.position[2] + 0.5
      );

      this.scene.add(label);
      this.labels[block.id] = { object: label, element: div };
    }
  }

  getLabel(id) {
    return this.labels[id] || null;
  }
}
