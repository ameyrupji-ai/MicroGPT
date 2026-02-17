// Chapter and step definitions for the walkthrough
// Each chapter has multiple steps. Each step defines:
// - content: array of content nodes to render in the left panel
// - camera: { position: [x,y,z], lookAt: [x,y,z] } for the 3D view
// - highlight: array of block IDs to brighten
// - dim: 'others' | 'none' - whether to dim non-highlighted blocks

export const CHAPTERS = [
  {
    id: 'intro',
    title: 'Introduction',
    steps: [
      {
        id: 'intro_0',
        camera: { position: [0, 8, 55], lookAt: [0, 5, 0] },
        highlight: [],
        dim: 'none',
        content: [
          { type: 'h2', text: 'What is micro-gpt?' },
          { type: 'p', text: 'micro-gpt is Andrej Karpathy\'s ~200-line pure-Python implementation of a GPT language model. It trains from scratch on a dataset of human names and learns to generate new, plausible-sounding names.' },
          { type: 'p', text: 'Despite its tiny size, it contains every component of a production GPT: tokenization, embeddings, multi-head self-attention, a feed-forward MLP, and an output head.' },
          { type: 'quote', text: '"This file is the complete algorithm. Everything else is just efficiency." \u2014 @karpathy' },
        ],
      },
      {
        id: 'intro_1',
        camera: { position: [0, 8, 55], lookAt: [0, 5, 0] },
        highlight: [],
        dim: 'none',
        content: [
          { type: 'p', text: 'The 3D visualization on the right shows the full model architecture. Each colored block represents a weight matrix \u2014 the learnable parameters that store the model\'s knowledge.' },
          { type: 'stats', items: [
            { label: 'Parameters', value: '4,192' },
            { label: 'Embedding dim', value: '16' },
            { label: 'Attention heads', value: '4' },
            { label: 'Layers', value: '1' },
            { label: 'Vocab size', value: '27' },
            { label: 'Block size', value: '16' },
          ]},
          { type: 'p', text: 'Each cell in a block is one parameter. ', spans: [
            { text: 'Blue cells', color: '#388bfd' },
            { text: ' = positive values, ' },
            { text: 'orange cells', color: '#f0883e' },
            { text: ' = negative values. Brightness indicates magnitude.' },
          ]},
          { type: 'p', text: 'Use your mouse to orbit (left-drag), pan (right-drag), and zoom (scroll) the 3D view. Press Space or click Continue to advance.' },
          { type: 'press_space' },
        ],
      },
    ],
  },

  {
    id: 'tokenization',
    title: 'Tokenization',
    steps: [
      {
        id: 'tok_0',
        camera: { position: [0, 28, 14], lookAt: [0, 27, 0] },
        highlight: ['input'],
        dim: 'others',
        cellHighlights: [
          { blockId: 'input', type: 'cell', row: 0, col: 0, color: '#ef4444' },
          { blockId: 'input', type: 'cell', row: 0, col: 1, color: '#ef4444' },
          { blockId: 'input', type: 'cell', row: 0, col: 2, color: '#ef4444' },
          { blockId: 'input', type: 'cell', row: 0, col: 3, color: '#ef4444' },
          { blockId: 'input', type: 'cell', row: 0, col: 4, color: '#ef4444' },
          { blockId: 'input', type: 'cell', row: 0, col: 5, color: '#ef4444' },
        ],
        content: [
          { type: 'h2', text: 'Character-Level Tokenization' },
          { type: 'p', text: 'micro-gpt uses a character-level tokenizer. Every unique character in the names dataset becomes a token. With 26 lowercase letters plus a special BOS (Beginning of Sequence) token, we get:' },
          { type: 'code', text: "uchars = sorted(set(''.join(docs)))\nBOS = len(uchars)      # token id 26\nvocab_size = len(uchars) + 1  # 27" },
          { type: 'p', spans: [
            { text: 'vocab_size = 27', color: '#f78166' },
            { text: ' tokens total (26 letters + 1 BOS token).' },
          ]},
        ],
      },
      {
        id: 'tok_1',
        camera: { position: [0, 28, 14], lookAt: [0, 27, 0] },
        highlight: ['input'],
        dim: 'others',
        cellHighlights: [
          { blockId: 'input', type: 'cell', row: 0, col: 0, color: '#3fb950' },
          { blockId: 'input', type: 'cell', row: 0, col: 1, color: '#ef4444' },
          { blockId: 'input', type: 'cell', row: 0, col: 2, color: '#ef4444' },
          { blockId: 'input', type: 'cell', row: 0, col: 3, color: '#ef4444' },
          { blockId: 'input', type: 'cell', row: 0, col: 4, color: '#ef4444' },
          { blockId: 'input', type: 'cell', row: 0, col: 5, color: '#3fb950' },
        ],
        content: [
          { type: 'p', text: 'Each training example wraps a name with BOS tokens on both sides. The name "emma" becomes:' },
          { type: 'code', text: 'tokens = [BOS] + [uchars.index(ch) for ch in "emma"] + [BOS]\n# = [26, 4, 12, 12, 0, 26]' },
          { type: 'p', text: 'The model learns: "given this sequence so far, what is the next character?" BOS marks both the start and end of a name \u2014 predicting BOS means "stop generating."' },
          { type: 'press_space' },
        ],
      },
    ],
  },

  {
    id: 'embedding',
    title: 'Embedding',
    steps: [
      {
        id: 'emb_0',
        camera: { position: [0, 24, 20], lookAt: [0, 22, 0] },
        highlight: ['wte', 'wpe'],
        dim: 'others',
        cellHighlights: [
          { blockId: 'input', type: 'cell', row: 0, col: 0, color: '#ef4444' },
          { blockId: 'wte', type: 'row', row: 26, color: '#3fb950' },
          { blockId: 'wpe', type: 'row', row: 0, color: '#3fb950' },
        ],
        content: [
          { type: 'h2', text: 'Token + Position Embeddings' },
          { type: 'p', text: 'The model has two embedding lookup tables:' },
          { type: 'p', spans: [
            { text: 'wte [27\u00d716]', color: '#388bfd' },
            { text: ' \u2014 token embedding. Each of the 27 tokens maps to a learned 16-dimensional vector. "What is this character?"' },
          ]},
          { type: 'p', spans: [
            { text: 'wpe [16\u00d716]', color: '#388bfd' },
            { text: ' \u2014 position embedding. Each of the 16 possible sequence positions maps to a 16-dimensional vector. "Where am I in the sequence?"' },
          ]},
        ],
      },
      {
        id: 'emb_1',
        camera: { position: [0, 20, 16], lookAt: [0, 18, 0] },
        highlight: ['wte', 'wpe', 'emb_add', 'rmsnorm_pre'],
        dim: 'others',
        cellHighlights: [
          { blockId: 'wte', type: 'row', row: 26, color: '#3fb950' },
          { blockId: 'wpe', type: 'row', row: 0, color: '#3fb950' },
          { blockId: 'rmsnorm_pre', type: 'row', row: 0, color: '#d29922' },
        ],
        content: [
          { type: 'p', text: 'For each token, we look up one row from each table and add them element-wise:' },
          { type: 'code', text: "tok_emb = state_dict['wte'][token_id]  # row from wte\npos_emb = state_dict['wpe'][pos_id]    # row from wpe\nx = [t + p for t, p in zip(tok_emb, pos_emb)]" },
          { type: 'p', text: 'This gives a single 16-dimensional vector that encodes both what the token IS and where it is in the sequence.' },
          { type: 'p', spans: [
            { text: 'The result is immediately normalized with ' },
            { text: 'RMSNorm', color: '#d29922' },
            { text: ' before entering the transformer block.' },
          ]},
          { type: 'press_space' },
        ],
      },
    ],
  },

  {
    id: 'rmsnorm',
    title: 'RMSNorm',
    steps: [
      {
        id: 'rms_0',
        camera: { position: [0, 16, 12], lookAt: [0, 15, 0] },
        highlight: ['rmsnorm_pre', 'rmsnorm_attn', 'rmsnorm_mlp'],
        dim: 'others',
        content: [
          { type: 'h2', text: 'Root Mean Square Normalization' },
          { type: 'p', text: 'RMSNorm appears 3 times in the model: before the transformer block, before attention, and before the MLP. It keeps activation magnitudes stable.' },
          { type: 'code', text: 'def rmsnorm(x):\n    ms = sum(xi * xi for xi in x) / len(x)\n    scale = (ms + 1e-5) ** -0.5\n    return [xi * scale for xi in x]' },
          { type: 'p', text: 'It divides each element by the root-mean-square of the vector. Without normalization, values could explode or vanish as they pass through layers.' },
          { type: 'p', text: 'This is simpler than LayerNorm (used in GPT-2) \u2014 no mean subtraction, no learnable scale/bias. One of Karpathy\'s deliberate simplifications.' },
          { type: 'press_space' },
        ],
      },
    ],
  },

  {
    id: 'self_attention',
    title: 'Self Attention',
    steps: [
      {
        id: 'attn_0',
        camera: { position: [0, 13, 24], lookAt: [0, 11, 0] },
        highlight: ['rmsnorm_attn', 'attn_wq', 'attn_wk', 'attn_wv'],
        dim: 'others',
        cellHighlights: [
          { blockId: 'rmsnorm_attn', type: 'row', row: 0, color: '#ef4444' },
          { blockId: 'attn_wq', type: 'col', col: 0, color: '#3fb950' },
          { blockId: 'attn_wk', type: 'col', col: 0, color: '#3fb950' },
          { blockId: 'attn_wv', type: 'col', col: 0, color: '#3fb950' },
        ],
        content: [
          { type: 'h2', text: 'Q, K, V Projections' },
          { type: 'p', text: 'After RMSNorm, the 16-dim input vector is projected through three weight matrices to produce Query, Key, and Value vectors:' },
          { type: 'code', text: "q = linear(x, state_dict['layer0.attn_wq'])  # [16]\nk = linear(x, state_dict['layer0.attn_wk'])  # [16]\nv = linear(x, state_dict['layer0.attn_wv'])  # [16]" },
          { type: 'p', spans: [
            { text: 'Wq, Wk, Wv', color: '#3fb950' },
            { text: ' are each [16\u00d716] matrices (256 params each). These are the core learnable parameters of the attention mechanism.' },
          ]},
        ],
      },
      {
        id: 'attn_1',
        camera: { position: [0, 10, 18], lookAt: [0, 9, 0] },
        highlight: ['multihead_attn'],
        dim: 'others',
        cellHighlights: [
          { blockId: 'multihead_attn', type: 'row', row: 0, color: '#3fb950' },
          { blockId: 'multihead_attn', type: 'row', row: 1, color: '#8b5cf6' },
          { blockId: 'multihead_attn', type: 'row', row: 2, color: '#06b6d4' },
          { blockId: 'multihead_attn', type: 'row', row: 3, color: '#f59e0b' },
        ],
        content: [
          { type: 'p', text: 'The 16-dim Q, K, V vectors are split into 4 heads of 4 dimensions each. For each head independently:' },
          { type: 'code', text: 'for h in range(n_head):       # 4 heads\n    hs = h * head_dim         # 0, 4, 8, 12\n    q_h = q[hs:hs+head_dim]   # 4-dim slice\n    # Attention scores:\n    score = dot(q_h, k_h) / sqrt(head_dim)\n    weights = softmax(scores)\n    output = weighted_sum(weights, v_h)' },
          { type: 'p', text: 'Each head learns to attend to different patterns \u2014 one head might learn "vowel after consonant", another "common letter pairs."' },
        ],
      },
      {
        id: 'attn_2',
        camera: { position: [0, 9, 14], lookAt: [0, 8, 0] },
        highlight: ['multihead_attn'],
        dim: 'others',
        content: [
          { type: 'p', text: 'The KV cache stores all previous keys and values, so each new token can attend to every prior position in the sequence. This is what makes the model autoregressive:' },
          { type: 'code', text: 'keys[li].append(k)    # cache grows each step\nvalues[li].append(v)\n# Each new token attends to ALL previous tokens' },
          { type: 'p', text: 'Dividing by \u221Ahead_dim (\u221A4 = 2) prevents dot products from becoming too large, which would make softmax gradients vanishingly small.' },
          { type: 'press_space' },
        ],
      },
    ],
  },

  {
    id: 'projection',
    title: 'Projection',
    steps: [
      {
        id: 'proj_0',
        camera: { position: [0, 5, 16], lookAt: [0, 4.5, 0] },
        highlight: ['attn_wo', 'attn_residual'],
        dim: 'others',
        cellHighlights: [
          { blockId: 'attn_wo', type: 'row', row: 0, color: '#3fb950' },
        ],
        content: [
          { type: 'h2', text: 'Output Projection + Residual' },
          { type: 'p', text: 'The 4 head outputs (4 dims each) are concatenated back to 16 dims and projected through Wo:' },
          { type: 'code', text: "x = linear(x_attn, state_dict['layer0.attn_wo'])\nx = [a + b for a, b in zip(x, x_residual)]" },
          { type: 'p', spans: [
            { text: 'Wo [16\u00d716]', color: '#3fb950' },
            { text: ' mixes information across heads. The ' },
            { text: 'residual connection', color: '#6e7681' },
            { text: ' adds back the pre-attention input \u2014 this "highway" lets gradients flow through the network without vanishing.' },
          ]},
          { type: 'press_space' },
        ],
      },
    ],
  },

  {
    id: 'mlp',
    title: 'MLP',
    steps: [
      {
        id: 'mlp_0',
        camera: { position: [0, -1, 24], lookAt: [0, -3, 0] },
        highlight: ['rmsnorm_mlp', 'mlp_fc1', 'mlp_relu', 'mlp_fc2'],
        dim: 'others',
        cellHighlights: [
          { blockId: 'rmsnorm_mlp', type: 'row', row: 0, color: '#ef4444' },
          { blockId: 'mlp_fc1', type: 'row', row: 0, color: '#3fb950' },
          { blockId: 'mlp_fc2', type: 'col', col: 0, color: '#3fb950' },
        ],
        content: [
          { type: 'h2', text: 'Feed-Forward MLP Block' },
          { type: 'p', text: 'After attention, the data passes through a 2-layer MLP with a 4\u00d7 expansion:' },
          { type: 'code', text: "x = rmsnorm(x)\nx = linear(x, state_dict['layer0.mlp_fc1'])  # 16 \u2192 64\nx = [xi.relu() for xi in x]                 # ReLU\nx = linear(x, state_dict['layer0.mlp_fc2'])  # 64 \u2192 16" },
          { type: 'p', spans: [
            { text: 'fc1 [64\u00d716]', color: '#bc8cff' },
            { text: ' expands from 16 to 64 dims. ' },
            { text: 'fc2 [16\u00d764]', color: '#bc8cff' },
            { text: ' compresses back to 16. Notice these are the largest blocks \u2014 the MLP holds 2,048 of the model\'s 4,192 total parameters (49%).' },
          ]},
        ],
      },
      {
        id: 'mlp_1',
        camera: { position: [0, -6, 16], lookAt: [0, -7, 0] },
        highlight: ['mlp_residual'],
        dim: 'others',
        content: [
          { type: 'p', text: 'ReLU (Rectified Linear Unit) is the simplest nonlinear activation: max(0, x). It zeroes out negative values, introducing the non-linearity that allows the network to learn curved decision boundaries.' },
          { type: 'p', text: 'A second residual connection adds back the pre-MLP input:' },
          { type: 'code', text: 'x = [a + b for a, b in zip(x, x_residual)]' },
          { type: 'p', text: 'The MLP is often described as where the model "stores knowledge" \u2014 the attention mechanism routes information, while the MLP processes it.' },
          { type: 'press_space' },
        ],
      },
    ],
  },

  {
    id: 'transformer',
    title: 'Transformer Block',
    steps: [
      {
        id: 'block_0',
        camera: { position: [0, 4, 40], lookAt: [0, 2, 0] },
        highlight: ['rmsnorm_attn', 'attn_wq', 'attn_wk', 'attn_wv', 'multihead_attn', 'attn_wo', 'attn_residual', 'rmsnorm_mlp', 'mlp_fc1', 'mlp_relu', 'mlp_fc2', 'mlp_residual'],
        dim: 'others',
        content: [
          { type: 'h2', text: 'The Complete Transformer Block' },
          { type: 'p', text: 'One transformer block = Attention + MLP, each with its own RMSNorm and residual connection. micro-gpt uses n_layer=1 (just one block).' },
          { type: 'p', text: 'The pattern inside each block:' },
          { type: 'code', text: '# Attention sub-block\nx = x + attention(rmsnorm(x))\n# MLP sub-block\nx = x + mlp(rmsnorm(x))' },
          { type: 'p', text: 'This "pre-norm" architecture (normalize before the sub-layer, not after) is used in modern GPTs because it trains more stably.' },
          { type: 'p', text: 'Larger models stack many blocks: GPT-2 Small has 12, GPT-3 has 96. The same pattern repeats \u2014 just scaled up enormously.' },
          { type: 'press_space' },
        ],
      },
    ],
  },

  {
    id: 'output',
    title: 'Output',
    steps: [
      {
        id: 'out_0',
        camera: { position: [0, -13, 18], lookAt: [0, -14, 0] },
        highlight: ['lm_head', 'logits', 'softmax'],
        dim: 'others',
        cellHighlights: [
          { blockId: 'lm_head', type: 'row', row: 4, color: '#3fb950' },
          { blockId: 'logits', type: 'cell', row: 0, col: 4, color: '#f78166' },
          { blockId: 'softmax', type: 'cell', row: 0, col: 4, color: '#f78166' },
        ],
        content: [
          { type: 'h2', text: 'Language Model Head' },
          { type: 'p', text: 'The final 16-dim vector from the transformer block is projected to vocabulary size (27) through lm_head:' },
          { type: 'code', text: "logits = linear(x, state_dict['lm_head'])  # [27]\nprobs = softmax(logits)                    # [27]" },
          { type: 'p', spans: [
            { text: 'lm_head [27\u00d716]', color: '#f78166' },
            { text: ' produces 27 logits \u2014 one raw score for each possible next token. Softmax converts these to a probability distribution that sums to 1.' },
          ]},
          { type: 'p', text: 'The model\'s prediction for what comes after "e" might be: \'m\' \u2192 0.35, \'l\' \u2192 0.15, \'v\' \u2192 0.10, ...' },
          { type: 'press_space' },
        ],
      },
    ],
  },

  {
    id: 'training',
    title: 'Training',
    steps: [
      {
        id: 'train_0',
        camera: { position: [0, 8, 55], lookAt: [0, 5, 0] },
        highlight: [],
        dim: 'none',
        content: [
          { type: 'h2', text: 'Training Loop' },
          { type: 'p', text: 'Training runs for 1,000 steps. Each step processes one name through the full model:' },
          { type: 'code', text: 'for pos_id in range(n):\n    logits = gpt(token_id, pos_id, keys, values)\n    probs = softmax(logits)\n    loss_t = -probs[target_id].log()\nloss = (1/n) * sum(losses)' },
          { type: 'p', text: 'Cross-entropy loss: -log(P(correct)). If the model assigns 90% to the right answer, loss = 0.105. If only 1%, loss = 4.605. It heavily penalizes confident wrong predictions.' },
        ],
      },
      {
        id: 'train_1',
        camera: { position: [0, 8, 55], lookAt: [0, 5, 0] },
        highlight: [],
        dim: 'none',
        content: [
          { type: 'p', text: 'loss.backward() propagates gradients through the entire computation graph using the chain rule. Every Value object computes: "how much does the loss change if I change slightly?"' },
          { type: 'p', text: 'The Adam optimizer then updates each parameter:' },
          { type: 'code', text: 'lr = 0.01 * (1 - step/1000)  # linear decay\nm[i] = 0.85*m[i] + 0.15*grad      # momentum\nv[i] = 0.99*v[i] + 0.01*grad**2   # velocity\nparam -= lr * m_hat / (sqrt(v_hat) + eps)' },
          { type: 'p', text: 'Adam uses per-parameter momentum (consistent direction gets bigger steps) and velocity (noisy parameters get cautious steps). Learning rate decays linearly from 0.01 to ~0.' },
          { type: 'press_space' },
        ],
      },
    ],
  },

  {
    id: 'inference',
    title: 'Inference',
    steps: [
      {
        id: 'inf_0',
        camera: { position: [5, 5, 45], lookAt: [0, 2, 0] },
        highlight: [],
        dim: 'none',
        content: [
          { type: 'h2', text: 'Generating New Names' },
          { type: 'p', text: 'After training, the model generates names it has never seen:' },
          { type: 'code', text: 'token_id = BOS\nfor pos_id in range(block_size):\n    logits = gpt(token_id, pos_id, keys, values)\n    probs = softmax([l / temperature for l in logits])\n    token_id = random.choices(range(vocab_size),\n                  weights=[p.data for p in probs])[0]\n    if token_id == BOS: break  # done\n    sample.append(uchars[token_id])' },
        ],
      },
      {
        id: 'inf_1',
        camera: { position: [5, 5, 45], lookAt: [0, 2, 0] },
        highlight: ['softmax'],
        dim: 'others',
        content: [
          { type: 'p', text: 'Temperature (0.5) divides logits before softmax, making the distribution sharper \u2014 the model becomes more confident and less random.' },
          { type: 'p', text: 'temperature \u2192 0: always picks the most likely token (deterministic)' },
          { type: 'p', text: 'temperature \u2192 1: uses raw probabilities (more creative/diverse)' },
          { type: 'p', text: 'The KV cache grows one entry per generated token, so each position can attend to all previous ones. Generation stops when BOS is predicted (end of name).' },
          { type: 'p', text: 'Generated names: "mara", "jax", "kali", "ren" \u2014 plausible English names the model invented by learning character-level statistics.' },
          { type: 'press_space' },
        ],
      },
    ],
  },
];
