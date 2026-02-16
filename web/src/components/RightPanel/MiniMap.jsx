import { CHAPTERS } from '../../data/chapters';
import styles from './RightPanel.module.css';

const blocks = [
  { id: 'input', label: 'Input', y: 4, h: 8, color: '#6e7681' },
  { id: 'wte', label: 'wte', y: 18, h: 16, color: '#388bfd' },
  { id: 'wpe', label: 'wpe', y: 18, h: 12, color: '#388bfd', x: 50 },
  { id: 'rmsnorm_pre', label: 'Norm', y: 38, h: 6, color: '#d29922' },
  { id: 'attn', label: 'Attn', y: 48, h: 28, color: '#3fb950' },
  { id: 'mlp', label: 'MLP', y: 80, h: 24, color: '#bc8cff' },
  { id: 'lm_head', label: 'Head', y: 108, h: 16, color: '#f78166' },
  { id: 'softmax', label: 'Out', y: 128, h: 8, color: '#f78166' },
];

// Map chapter IDs to which minimap blocks should be highlighted
const chapterHighlightMap = {
  intro: [],
  tokenization: ['input'],
  embedding: ['wte', 'wpe'],
  rmsnorm: ['rmsnorm_pre'],
  self_attention: ['attn'],
  projection: ['attn'],
  mlp: ['mlp'],
  transformer: ['attn', 'mlp'],
  output: ['lm_head', 'softmax'],
  training: [],
  inference: [],
};

export default function MiniMap({ chapterId }) {
  const highlighted = chapterHighlightMap[chapterId] || [];

  return (
    <div className={styles.miniMapOverlay}>
      <svg width="80" height="148" viewBox="0 0 80 148">
        {blocks.map(b => {
          const isActive = highlighted.includes(b.id);
          const x = b.x || 8;
          const w = b.x ? 22 : 64;
          return (
            <g key={b.id}>
              <rect
                x={x}
                y={b.y}
                width={w}
                height={b.h}
                rx={2}
                fill={isActive ? b.color + '40' : b.color + '15'}
                stroke={isActive ? b.color : b.color + '30'}
                strokeWidth={isActive ? 1.5 : 0.5}
              />
              <text
                x={x + w / 2}
                y={b.y + b.h / 2 + 3}
                textAnchor="middle"
                fill={isActive ? b.color : '#484f58'}
                fontSize="7"
                fontFamily="monospace"
              >
                {b.label}
              </text>
            </g>
          );
        })}
        {/* Arrows */}
        <line x1="40" y1="12" x2="40" y2="18" stroke="#30363d" strokeWidth="0.5" />
        <line x1="40" y1="34" x2="40" y2="38" stroke="#30363d" strokeWidth="0.5" />
        <line x1="40" y1="44" x2="40" y2="48" stroke="#30363d" strokeWidth="0.5" />
        <line x1="40" y1="76" x2="40" y2="80" stroke="#30363d" strokeWidth="0.5" />
        <line x1="40" y1="104" x2="40" y2="108" stroke="#30363d" strokeWidth="0.5" />
        <line x1="40" y1="124" x2="40" y2="128" stroke="#30363d" strokeWidth="0.5" />
      </svg>
    </div>
  );
}
