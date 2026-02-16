// Block definitions for the 3D scene
// Each block represents a weight matrix, operation, or annotation in the micro-gpt architecture
// Positions are in world units: Y goes upward, X is horizontal, Z is depth

const CELL = 0.18;
const GAP = 0.02;
export const PITCH = CELL + GAP; // 0.20 per cell

// Smaller pitch for large matrices (64-dim)
export const SMALL_PITCH = 0.10;

export const COLORS = {
  embedding: '#388bfd',
  attention: '#3fb950',
  mlp: '#bc8cff',
  output: '#f78166',
  norm: '#d29922',
  neutral: '#6e7681',
};

export const ARCH_BLOCKS = [
  // ── Input ──
  {
    id: 'input',
    label: 'Input Tokens',
    sublabel: '[6]',
    shape: [1, 6],
    position: [0, 28, 0],
    color: COLORS.neutral,
    type: 'matrix',
  },

  // ── Embeddings ──
  {
    id: 'wte',
    label: 'wte',
    sublabel: '27 x 16',
    shape: [27, 16],
    position: [-2.5, 24, 0],
    color: COLORS.embedding,
    type: 'matrix',
  },
  {
    id: 'wpe',
    label: 'wpe',
    sublabel: '16 x 16',
    shape: [16, 16],
    position: [2.5, 24, 0],
    color: COLORS.embedding,
    type: 'matrix',
  },
  {
    id: 'emb_add',
    label: '+',
    sublabel: 'add',
    shape: null,
    position: [0, 17.5, 0],
    color: COLORS.neutral,
    type: 'op',
  },

  // ── Pre-layer RMSNorm ──
  {
    id: 'rmsnorm_pre',
    label: 'RMSNorm',
    sublabel: '[16]',
    shape: [1, 16],
    position: [0, 16, 0],
    color: COLORS.norm,
    type: 'matrix',
  },

  // ── Transformer Block ──
  // Pre-attention RMSNorm
  {
    id: 'rmsnorm_attn',
    label: 'RMSNorm',
    sublabel: '[16]',
    shape: [1, 16],
    position: [0, 14, 0],
    color: COLORS.norm,
    type: 'matrix',
  },

  // Q, K, V projections
  {
    id: 'attn_wq',
    label: 'Wq',
    sublabel: '16 x 16',
    shape: [16, 16],
    position: [-5, 12, 0],
    color: COLORS.attention,
    type: 'matrix',
  },
  {
    id: 'attn_wk',
    label: 'Wk',
    sublabel: '16 x 16',
    shape: [16, 16],
    position: [0, 12, 0],
    color: COLORS.attention,
    type: 'matrix',
  },
  {
    id: 'attn_wv',
    label: 'Wv',
    sublabel: '16 x 16',
    shape: [16, 16],
    position: [5, 12, 0],
    color: COLORS.attention,
    type: 'matrix',
  },

  // Multi-head attention
  {
    id: 'multihead_attn',
    label: '4-Head Attention',
    sublabel: 'head_dim=4',
    shape: [4, 4],
    position: [0, 8.5, 0],
    color: COLORS.attention,
    type: 'matrix',
  },

  // Output projection
  {
    id: 'attn_wo',
    label: 'Wo',
    sublabel: '16 x 16',
    shape: [16, 16],
    position: [0, 6.5, 0],
    color: COLORS.attention,
    type: 'matrix',
  },

  // Attention residual
  {
    id: 'attn_residual',
    label: '+',
    sublabel: 'residual',
    shape: null,
    position: [0, 3, 0],
    color: COLORS.neutral,
    type: 'op',
  },

  // Pre-MLP RMSNorm
  {
    id: 'rmsnorm_mlp',
    label: 'RMSNorm',
    sublabel: '[16]',
    shape: [1, 16],
    position: [0, 1.5, 0],
    color: COLORS.norm,
    type: 'matrix',
  },

  // MLP fc1 (64x16) - large block
  {
    id: 'mlp_fc1',
    label: 'fc1',
    sublabel: '64 x 16',
    shape: [64, 16],
    position: [-4, -1, 0],
    color: COLORS.mlp,
    type: 'matrix',
    smallScale: true,
  },

  // MLP ReLU
  {
    id: 'mlp_relu',
    label: 'ReLU',
    sublabel: 'max(0, x)',
    shape: null,
    position: [0, -5, 0],
    color: COLORS.neutral,
    type: 'op',
  },

  // MLP fc2 (16x64) - large block
  {
    id: 'mlp_fc2',
    label: 'fc2',
    sublabel: '16 x 64',
    shape: [16, 64],
    position: [4, -1, 0],
    color: COLORS.mlp,
    type: 'matrix',
    smallScale: true,
  },

  // MLP residual
  {
    id: 'mlp_residual',
    label: '+',
    sublabel: 'residual',
    shape: null,
    position: [0, -8, 0],
    color: COLORS.neutral,
    type: 'op',
  },

  // ── Output Head ──
  {
    id: 'lm_head',
    label: 'lm_head',
    sublabel: '27 x 16',
    shape: [27, 16],
    position: [0, -10, 0],
    color: COLORS.output,
    type: 'matrix',
  },

  // Logits
  {
    id: 'logits',
    label: 'logits',
    sublabel: '[27]',
    shape: [1, 27],
    position: [0, -16, 0],
    color: COLORS.output,
    type: 'matrix',
  },

  // Softmax
  {
    id: 'softmax',
    label: 'softmax',
    sublabel: 'P(next)',
    shape: [1, 27],
    position: [0, -17.5, 0],
    color: COLORS.output,
    type: 'matrix',
  },
];

// Connections between blocks (source → target)
export const CONNECTIONS = [
  ['input', 'wte'],
  ['input', 'wpe'],
  ['wte', 'emb_add'],
  ['wpe', 'emb_add'],
  ['emb_add', 'rmsnorm_pre'],
  ['rmsnorm_pre', 'rmsnorm_attn'],
  ['rmsnorm_attn', 'attn_wq'],
  ['rmsnorm_attn', 'attn_wk'],
  ['rmsnorm_attn', 'attn_wv'],
  ['attn_wq', 'multihead_attn'],
  ['attn_wk', 'multihead_attn'],
  ['attn_wv', 'multihead_attn'],
  ['multihead_attn', 'attn_wo'],
  ['attn_wo', 'attn_residual'],
  ['attn_residual', 'rmsnorm_mlp'],
  ['rmsnorm_mlp', 'mlp_fc1'],
  ['mlp_fc1', 'mlp_relu'],
  ['mlp_relu', 'mlp_fc2'],
  ['mlp_fc2', 'mlp_residual'],
  ['mlp_residual', 'lm_head'],
  ['lm_head', 'logits'],
  ['logits', 'softmax'],
];

// Residual skip connections (rendered as dotted lines offset in Z)
export const RESIDUAL_CONNECTIONS = [
  ['rmsnorm_pre', 'attn_residual'],
  ['attn_residual', 'mlp_residual'],
];
