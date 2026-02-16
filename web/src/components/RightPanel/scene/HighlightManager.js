import { ARCH_BLOCKS } from '../../../data/architecture.js';

export class HighlightManager {
  constructor(blockRenderer, labelRenderer) {
    this.blockRenderer = blockRenderer;
    this.labelRenderer = labelRenderer;
  }

  applyStep(step) {
    const { highlight, dim } = step;

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
          // dim === 'none' or not in highlight list but dim is 'none'
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
  }
}
