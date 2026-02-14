import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import * as THREE from "three";

// ══════════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════════
const C = {
  bg: "#121620",
  panel: "#151a2b",
  panelBorder: "#1e2640",
  text: "#d4d8e8",
  textMuted: "#7a829e",
  textDim: "#3e4560",
  accent: "#ef4444",
  amber: "#eab308",
  green: "#22c55e",
  blue: "#3b82f6",
  purple: "#8b5cf6",
  cyan: "#06b6d4",
  pink: "#ec4899",
  indigo: "#6366f1",
  teal: "#14b8a6",
};

const CELL = 0.22;
const GAP = 0.04;
const BLOCK_GAP = 2.8;

// Seeded random for consistent "weights"
function seededRandom(seed) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

// ══════════════════════════════════════════════════
// WALKTHROUGH STEPS
// ══════════════════════════════════════════════════
const steps = [
  {
    id: "intro", phase: "overview", title: "Introduction",
    subtitle: "A Complete GPT in 200 Lines",
    body: `Welcome to a 3D walkthrough of Andrej Karpathy's minimal GPT implementation — a complete language model written in pure Python with zero dependencies.\n\nThe 3D model on the right shows the actual architecture with real tensor dimensions. Each colored cell represents a single learnable parameter or activation value.\n\n**Blue cells** = positive values\n**Orange cells** = negative values\n**Brightness** = magnitude\n\nUse your mouse to **orbit** (left-drag), **pan** (right-drag), and **zoom** (scroll). Navigate steps with arrow keys or the buttons below.`,
    camera: { x: 0, y: 18, z: 30 }, target: { x: 0, y: 8, z: 0 },
    highlight: [],
  },
  {
    id: "input", phase: "data", title: "Step 1: Input Tokens",
    subtitle: "The Sequence [BOS, E, m, m, a, BOS]",
    body: `The model processes one name at a time, character by character. The name "Emma" becomes a sequence of token IDs:\n\n**[BOS, E, m, m, a, BOS]** → **[26, 4, 12, 12, 0, 26]**\n\nThe input token row at the top of the model shows 6 cells — one for each token in our sequence. Each cell's value is the integer token ID.\n\nBOS (token 26) marks both the beginning and end of a name. The model learns that after BOS, a name-starting character is likely, and generating BOS means "stop."`,
    camera: { x: 0, y: 3, z: 12 }, target: { x: 0, y: 1.5, z: 0 },
    highlight: ["input"],
  },
  {
    id: "tok_emb", phase: "embedding", title: "Step 2: Token Embedding",
    subtitle: "wte — 27×16 Lookup Table",
    body: `The token embedding matrix **wte** has shape **[27 × 16]** — one row of 16 numbers for each of the 27 possible tokens.\n\nWhen we look up token "E" (id=4), we retrieve **row 4** from this matrix, getting a 16-dimensional vector that represents the meaning of "E" in a learned embedding space.\n\nThese embeddings are randomly initialized and refined during training. The model learns to place similar characters (vowels, consonants, common pairs) near each other in this 16-dimensional space.\n\nThe tall blue-orange grid you see is the full 27×16 weight matrix. The highlighted row shows the embedding being looked up for the current token.`,
    camera: { x: -4, y: 5, z: 10 }, target: { x: -2.5, y: 3, z: 0 },
    highlight: ["wte"],
  },
  {
    id: "pos_emb", phase: "embedding", title: "Step 3: Position Embedding",
    subtitle: "wpe — 16×16 Lookup Table",
    body: `Position embedding **wpe** has shape **[16 × 16]** — one row for each of the 16 possible positions in a sequence.\n\nFor position 0, we retrieve row 0; for position 3, we retrieve row 3. This vector is **added** to the token embedding element-wise.\n\nWithout position embeddings, the model would have no idea about word order — "Emma" and "amEm" would look identical. Position embeddings give the model a sense of **where** each token sits in the sequence.\n\nThe sum **tok_emb + pos_emb** produces the initial representation vector that enters the transformer block.`,
    camera: { x: 3, y: 5, z: 10 }, target: { x: 2, y: 3, z: 0 },
    highlight: ["wpe"],
  },
  {
    id: "rmsnorm", phase: "architecture", title: "Step 4: RMSNorm",
    subtitle: "Normalizing the Input",
    body: `Before entering the transformer block, the combined embedding is normalized using **RMSNorm** (Root Mean Square Normalization).\n\n**scale = 1 / √(mean(x²) + ε)**\n**output = x × scale**\n\nThis keeps the vector magnitudes stable regardless of the raw embedding values. Without normalization, values could explode or vanish as they pass through layers.\n\nRMSNorm is simpler than LayerNorm (used in original GPT-2) — it doesn't subtract the mean, only scales by the RMS. This is one of Karpathy's simplifications.`,
    camera: { x: 0, y: 6, z: 10 }, target: { x: 0, y: 4.5, z: 0 },
    highlight: ["norm1"],
  },
  {
    id: "qkv", phase: "attention", title: "Step 5: Q, K, V Projections",
    subtitle: "Three 16×16 Matrix Multiplications",
    body: `The normalized input is multiplied by three separate weight matrices to produce **Query**, **Key**, and **Value** vectors:\n\n• **Q = x × Wq** [16×16] — "What am I looking for?"\n• **K = x × Wk** [16×16] — "What do I contain?"\n• **V = x × Wv** [16×16] — "What info do I provide?"\n\nEach weight matrix is a **16×16 grid** of learnable parameters (the blue-orange blocks you see). Multiplying a 16-dim input by a 16×16 matrix produces a 16-dim output.\n\nThese three vectors are the raw material for the attention mechanism. The same transformation happens independently at every position in the sequence.`,
    camera: { x: -2, y: 9, z: 12 }, target: { x: -1, y: 7.5, z: 0 },
    highlight: ["wq", "wk", "wv"],
  },
  {
    id: "attention", phase: "attention", title: "Step 6: Multi-Head Attention",
    subtitle: "4 Heads × 4 Dimensions Each",
    body: `The 16-dim Q, K, V vectors are split into **4 heads** of **4 dimensions each**.\n\nFor each head independently:\n1. Compute attention scores: **score = Q·Kᵀ / √4**\n2. Apply **softmax** → weights that sum to 1\n3. Weighted sum of Values: **output = Σ(weight × V)**\n\nEach head learns to attend to different patterns:\n• Head 1 might learn "vowel after consonant"\n• Head 2 might learn "common letter pairs"\n• Head 3 might learn "name length patterns"\n• Head 4 might learn "ending patterns"\n\nThe 4 head outputs (4 dims each) are **concatenated** back to 16 dims and projected through **Wo** [16×16]. A **residual connection** adds the original input back.\n\nThe KV cache stores all previous keys and values so each new token can attend to the full sequence history.`,
    camera: { x: 0, y: 10, z: 14 }, target: { x: 0, y: 8, z: 0 },
    highlight: ["wq", "wk", "wv", "wo"],
  },
  {
    id: "mlp", phase: "mlp", title: "Step 7: Feed-Forward MLP",
    subtitle: "Expand → ReLU → Compress",
    body: `After attention, the data passes through a two-layer MLP:\n\n1. **RMSNorm** — normalize the input\n2. **Linear(16 → 64)** via **mlp_fc1** [64×16] — expand 4×\n3. **ReLU** — zero out negatives: max(0, x)\n4. **Linear(64 → 16)** via **mlp_fc2** [16×64] — compress back\n5. **+ Residual** — add original input\n\nThe **mlp_fc1** matrix is the large **64×16** block — notice how much bigger it is than the 16×16 attention matrices! This is where most of the model's parameters live.\n\nThe expansion to 64 dims gives the network more "room to think." ReLU introduces non-linearity — without it, stacking linear layers would just be another linear layer. The residual connection ensures information can flow through even if the MLP hasn't learned useful patterns yet.`,
    camera: { x: 2, y: 14, z: 14 }, target: { x: 1, y: 12, z: 0 },
    highlight: ["mlp_fc1", "mlp_fc2"],
  },
  {
    id: "lm_head", phase: "output", title: "Step 8: Output Head",
    subtitle: "lm_head — 27×16 → Logits → Softmax",
    body: `The final output of the transformer block is projected to vocabulary size using **lm_head** [27×16].\n\nThis produces **27 logits** — one raw score for each possible next token (26 letters + BOS). Higher logits = higher predicted probability.\n\n**Softmax** converts logits to a proper probability distribution:\n**P(token_i) = exp(logit_i) / Σ exp(logit_j)**\n\nThe model's prediction for what comes after "E" might look like:\n• 'm' → 0.35 (most likely)\n• 'l' → 0.15\n• 'v' → 0.10\n• 'a' → 0.08\n• ... other tokens share the rest\n\nDuring training, we compare this distribution to the actual next token and compute the **cross-entropy loss**: **−log(P(correct))**.`,
    camera: { x: 0, y: 18, z: 14 }, target: { x: 0, y: 16, z: 0 },
    highlight: ["lm_head"],
  },
  {
    id: "training", phase: "training", title: "Step 9: Training Loop",
    subtitle: "Forward → Loss → Backward → Adam",
    body: `Training repeats 1000 times. Each step:\n\n**1. Forward pass** — Feed one name through the model, computing predictions at every position.\n\n**2. Loss** — Average cross-entropy loss over all positions:\n**loss = −(1/n) Σ log(P(correct_next))**\n\n**3. Backward pass** — \`loss.backward()\` propagates gradients through the entire computation graph using the chain rule.\n\n**4. Adam update** — Each parameter gets a smart update:\n• **m** = momentum (smoothed gradient direction)\n• **v** = velocity (gradient magnitude variance)\n• **param −= lr × m̂ / (√v̂ + ε)**\n\nLearning rate decays linearly from 0.01 → 0 over 1000 steps. Every Value.grad is reset to 0 after each update.`,
    camera: { x: 0, y: 18, z: 30 }, target: { x: 0, y: 8, z: 0 },
    highlight: ["all"],
  },
  {
    id: "inference", phase: "inference", title: "Step 10: Inference",
    subtitle: "Generating New Names",
    body: `After training, the model generates names:\n\n1. Start with **BOS** token\n2. Forward through GPT → probability distribution\n3. **Temperature** divides logits by 0.5 (sharpens distribution)\n4. **Sample** from distribution using \`random.choices\`\n5. If sampled BOS → stop\n6. Else → feed token back as input, repeat\n\n**Temperature** controls creativity:\n• **0.1** = very conservative, picks top prediction\n• **0.5** = balanced (used here)\n• **1.0** = full diversity, more "creative"\n\nOutput examples: "Mara", "Jax", "Kali", "Ren" — plausible English names the model invented by learning the statistical patterns of character sequences from the training data.\n\n**"This file is the complete algorithm. Everything else is just efficiency."** — @karpathy`,
    camera: { x: 5, y: 14, z: 25 }, target: { x: 0, y: 8, z: 0 },
    highlight: [],
  },
];

const phaseColors = {
  overview: C.accent, data: C.amber, embedding: C.cyan,
  architecture: C.teal, attention: C.purple, mlp: C.pink,
  output: C.accent, training: C.green, inference: C.blue,
};
const phaseLabels = {
  overview: "OVERVIEW", data: "DATA", embedding: "EMBEDDING",
  architecture: "NORM", attention: "ATTENTION", mlp: "MLP",
  output: "OUTPUT", training: "TRAINING", inference: "INFERENCE",
};

// ══════════════════════════════════════════════════
// THREE.JS 3D VISUALIZATION
// ══════════════════════════════════════════════════
function ThreeScene({ step, stepIndex }) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const blocksRef = useRef({});
  const labelsRef = useRef([]);
  const animRef = useRef(null);
  const mouseRef = useRef({ down: false, button: 0, x: 0, y: 0 });
  const orbitRef = useRef({ theta: 0.3, phi: 0.9, dist: 30, tx: 0, ty: 8, tz: 0 });
  const targetOrbitRef = useRef({ theta: 0.3, phi: 0.9, dist: 30, tx: 0, ty: 8, tz: 0 });
  const particlesRef = useRef(null);
  const clockRef = useRef(new THREE.Clock());
  const tooltipRef = useRef(null);
  const hoveredRef = useRef(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseVec = useRef(new THREE.Vector2());

  // Create a tensor block as instanced mesh for performance
  const createTensorBlock = useCallback((rows, cols, x, y, z, name, color, scene) => {
    const rand = seededRandom(name.split('').reduce((a, c) => a + c.charCodeAt(0), 0));
    const count = rows * cols;
    const geo = new THREE.BoxGeometry(CELL - 0.02, CELL - 0.02, CELL * 0.6);
    const mat = new THREE.MeshPhongMaterial({ flatShading: true });
    const mesh = new THREE.InstancedMesh(geo, mat, count);
    mesh.userData = { name, rows, cols, baseX: x, baseY: y, baseZ: z };

    const dummy = new THREE.Object3D();
    const colorObj = new THREE.Color();

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        const val = (rand() - 0.5) * 2;

        dummy.position.set(
          x + c * (CELL + GAP),
          y - r * (CELL + GAP),
          z
        );
        dummy.updateMatrix();
        mesh.setMatrixAt(idx, dummy.matrix);

        const absVal = Math.abs(val);
        const hue = val > 0 ? 0.6 : 0.08;
        const sat = 0.7 + absVal * 0.3;
        const light = 0.15 + absVal * 0.45;
        colorObj.setHSL(hue, sat, light);
        mesh.setColorAt(idx, colorObj);
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.instanceColor.needsUpdate = true;
    mesh.castShadow = true;

    scene.add(mesh);
    return mesh;
  }, []);

  // Create label sprite
  const createLabel = useCallback((text, x, y, z, fontSize, color) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = 512;
    canvas.height = 64;
    ctx.font = `bold ${fontSize || 28}px monospace`;
    ctx.fillStyle = color || "#8892b0";
    ctx.textAlign = "left";
    ctx.fillText(text, 4, 44);

    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    const spriteMat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.position.set(x, y, z);
    sprite.scale.set(4, 0.5, 1);
    sprite.userData = { label: true };
    return sprite;
  }, []);

  // Build the whole scene
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setClearColor(new THREE.Color(C.bg));
    renderer.shadowMap.enabled = true;
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(new THREE.Color(C.bg), 0.008);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(40, mount.clientWidth / mount.clientHeight, 0.1, 200);
    camera.position.set(0, 18, 30);
    camera.lookAt(0, 8, 0);
    cameraRef.current = camera;

    // Lights
    const ambient = new THREE.AmbientLight(0x404060, 0.6);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight.position.set(10, 20, 15);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0x6366f1, 0.4, 50);
    pointLight.position.set(-5, 15, 10);
    scene.add(pointLight);

    // Subtle grid floor
    const gridHelper = new THREE.GridHelper(60, 60, 0x1e2640, 0x1a2035);
    gridHelper.position.y = -1;
    scene.add(gridHelper);

    // ═════ BUILD THE MODEL ═════
    const blocks = {};
    let yPos = 0;
    const S = CELL + GAP;
    const labels = [];

    // ─── Input tokens (6×1) ───
    blocks.input = createTensorBlock(1, 6, -0.6, yPos, 0, "input_tokens", C.amber, scene);
    labels.push(createLabel("Input Tokens [6]", -0.6, yPos + 0.6, 0.5, 22, "#eab308"));
    labels.push(createLabel("BOS  E   m   m   a  BOS", -0.5, yPos - 0.5, 0.5, 20, "#666"));
    yPos += BLOCK_GAP * 0.7;

    // ─── Token Embedding (27×16) ───
    const wteX = -4;
    blocks.wte = createTensorBlock(27, 16, wteX, yPos, 0, "wte_27x16", C.cyan, scene);
    labels.push(createLabel("wte [27×16]", wteX, yPos + 0.6, 0.5, 24, "#06b6d4"));
    labels.push(createLabel("Token Embedding", wteX, yPos + 1.2, 0.5, 20, "#555"));

    // ─── Position Embedding (16×16) ───
    const wpeX = 2;
    blocks.wpe = createTensorBlock(16, 16, wpeX, yPos, 0, "wpe_16x16", C.cyan, scene);
    labels.push(createLabel("wpe [16×16]", wpeX, yPos + 0.6, 0.5, 24, "#06b6d4"));
    labels.push(createLabel("Position Embedding", wpeX, yPos + 1.2, 0.5, 20, "#555"));
    yPos += 27 * S + BLOCK_GAP * 0.5;

    // ─── RMSNorm result (1×16) ───
    blocks.norm1 = createTensorBlock(1, 16, -1, yPos, 0, "rmsnorm1", C.teal, scene);
    labels.push(createLabel("RMSNorm → x [1×16]", -1, yPos + 0.5, 0.5, 22, "#14b8a6"));
    yPos += BLOCK_GAP * 0.6;

    // ═══ TRANSFORMER BLOCK ═══
    const blockStartY = yPos;

    // Add a wireframe box around the transformer block
    const tbGeo = new THREE.BoxGeometry(18, 16, 2);
    const tbEdges = new THREE.EdgesGeometry(tbGeo);
    const tbLine = new THREE.LineSegments(tbEdges, new THREE.LineBasicMaterial({ color: 0x2a3055, transparent: true, opacity: 0.5 }));
    tbLine.position.set(0.5, yPos + 5.5, 0);
    scene.add(tbLine);
    labels.push(createLabel("╔═ Transformer Block (×1) ═╗", -7, yPos + 14, 0.5, 22, "#6366f1"));

    // ─── Q, K, V weights (16×16 each) ───
    const qkvY = yPos;
    const qX = -7, kX = -2.5, vX = 2;
    blocks.wq = createTensorBlock(16, 16, qX, qkvY, 0, "attn_wq_16x16", C.purple, scene);
    blocks.wk = createTensorBlock(16, 16, kX, qkvY, 0, "attn_wk_16x16", C.purple, scene);
    blocks.wv = createTensorBlock(16, 16, vX, qkvY, 0, "attn_wv_16x16", C.purple, scene);
    labels.push(createLabel("Wq [16×16]", qX, qkvY + 0.5, 0.5, 22, "#8b5cf6"));
    labels.push(createLabel("Wk [16×16]", kX, qkvY + 0.5, 0.5, 22, "#8b5cf6"));
    labels.push(createLabel("Wv [16×16]", vX, qkvY + 0.5, 0.5, 22, "#8b5cf6"));

    // ─── Attention output Wo (16×16) ───
    const woY = qkvY + 16 * S + BLOCK_GAP * 0.4;
    blocks.wo = createTensorBlock(16, 16, -2.5, woY, 0, "attn_wo_16x16", C.indigo, scene);
    labels.push(createLabel("Wo [16×16]  (+ residual)", -2.5, woY + 0.5, 0.5, 22, "#6366f1"));
    yPos = woY + 16 * S + BLOCK_GAP * 0.4;

    // ─── MLP fc1 (64×16) — the big one ───
    blocks.mlp_fc1 = createTensorBlock(64, 16, -2.5, yPos, 0, "mlp_fc1_64x16", C.pink, scene);
    labels.push(createLabel("mlp_fc1 [64×16]  → ReLU", -2.5, yPos + 0.5, 0.5, 22, "#ec4899"));

    // ─── MLP fc2 (16×64) ───
    const fc2X = 4;
    blocks.mlp_fc2 = createTensorBlock(16, 64, fc2X, yPos, 0, "mlp_fc2_16x64", C.pink, scene);
    labels.push(createLabel("mlp_fc2 [16×64]  (+ residual)", fc2X, yPos + 0.5, 0.5, 22, "#ec4899"));
    yPos += 64 * S + BLOCK_GAP * 0.5;

    // ─── LM Head (27×16) ───
    blocks.lm_head = createTensorBlock(27, 16, -2.5, yPos, 0, "lm_head_27x16", C.accent, scene);
    labels.push(createLabel("lm_head [27×16]", -2.5, yPos + 0.5, 0.5, 24, "#ef4444"));
    labels.push(createLabel("→ 27 logits → softmax → P(next token)", -2.5, yPos + 1.1, 0.5, 20, "#888"));

    // ─── Output probabilities bar ───
    const outY = yPos + 27 * S + BLOCK_GAP * 0.3;
    const barGeo = new THREE.BoxGeometry(0.15, 0.02, 0.12);
    const tokenLabels = "abcdefghijklmnopqrstuvwxyz⟐".split("");
    const rand = seededRandom(999);
    for (let i = 0; i < 27; i++) {
      const prob = rand();
      const h = prob * 1.5 + 0.1;
      const barMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, h, 0.12),
        new THREE.MeshPhongMaterial({ color: new THREE.Color().setHSL(prob > 0.5 ? 0.35 : 0.6, 0.8, 0.3 + prob * 0.4) })
      );
      barMesh.position.set(-2.5 + i * 0.22, outY - h / 2, 0);
      scene.add(barMesh);
    }
    labels.push(createLabel("Output Probabilities", -2.5, outY + 0.4, 0.5, 22, "#ef4444"));

    // Add all labels
    labels.forEach(l => scene.add(l));
    labelsRef.current = labels;
    blocksRef.current = blocks;

    // ─── Data flow particles ───
    const particleCount = 200;
    const pGeo = new THREE.BufferGeometry();
    const pPositions = new Float32Array(particleCount * 3);
    const pColors = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      pPositions[i * 3] = (Math.random() - 0.5) * 12;
      pPositions[i * 3 + 1] = Math.random() * 40;
      pPositions[i * 3 + 2] = (Math.random() - 0.5) * 3;
      const c = new THREE.Color().setHSL(0.6 + Math.random() * 0.2, 0.8, 0.5);
      pColors[i * 3] = c.r; pColors[i * 3 + 1] = c.g; pColors[i * 3 + 2] = c.b;
    }
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPositions, 3));
    pGeo.setAttribute("color", new THREE.BufferAttribute(pColors, 3));
    const pMat = new THREE.PointsMaterial({ size: 0.08, vertexColors: true, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);
    particlesRef.current = particles;

    // ─── Connection lines between blocks ───
    const lineMat = new THREE.LineBasicMaterial({ color: 0x2a3060, transparent: true, opacity: 0.3 });
    const addConnector = (x1, y1, x2, y2) => {
      const pts = [new THREE.Vector3(x1, y1, 0.3), new THREE.Vector3(x1, (y1+y2)/2, 0.3), new THREE.Vector3(x2, (y1+y2)/2, 0.3), new THREE.Vector3(x2, y2, 0.3)];
      const curve = new THREE.CatmullRomCurve3(pts);
      const cGeo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(20));
      scene.add(new THREE.Line(cGeo, lineMat));
    };

    // resize
    const onResize = () => {
      const w = mount.clientWidth, h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    // Animation loop
    const animate = () => {
      animRef.current = requestAnimationFrame(animate);
      const dt = clockRef.current.getDelta();
      const t = clockRef.current.getElapsedTime();

      // Smooth camera orbit
      const o = orbitRef.current;
      const to = targetOrbitRef.current;
      o.theta += (to.theta - o.theta) * 0.04;
      o.phi += (to.phi - o.phi) * 0.04;
      o.dist += (to.dist - o.dist) * 0.04;
      o.tx += (to.tx - o.tx) * 0.04;
      o.ty += (to.ty - o.ty) * 0.04;
      o.tz += (to.tz - o.tz) * 0.04;

      camera.position.x = o.tx + o.dist * Math.sin(o.phi) * Math.sin(o.theta);
      camera.position.y = o.ty + o.dist * Math.cos(o.phi);
      camera.position.z = o.tz + o.dist * Math.sin(o.phi) * Math.cos(o.theta);
      camera.lookAt(o.tx, o.ty, o.tz);

      // Animate particles downward (data flow)
      if (particlesRef.current) {
        const pos = particlesRef.current.geometry.attributes.position.array;
        for (let i = 0; i < pos.length; i += 3) {
          pos[i + 1] -= dt * 2.5;
          if (pos[i + 1] < -2) pos[i + 1] = 42;
        }
        particlesRef.current.geometry.attributes.position.needsUpdate = true;
      }

      // Pulse highlighted blocks
      Object.entries(blocksRef.current).forEach(([key, mesh]) => {
        if (!mesh) return;
        const isHighlighted = step.highlight.includes(key) || step.highlight.includes("all");
        const scale = isHighlighted ? 1.0 + Math.sin(t * 2.5) * 0.03 : 1.0;
        mesh.scale.set(scale, scale, scale);
        mesh.material.opacity = isHighlighted ? 1 : 0.35;
        mesh.material.transparent = !isHighlighted;
      });

      // Labels face camera
      labels.forEach(s => {
        if (s.userData.label) s.lookAt(camera.position);
      });

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(animRef.current);
      mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  // Update camera target on step change
  useEffect(() => {
    if (!step.camera) return;
    const sc = step.camera;
    const st = step.target;

    const dx = sc.x - st.x;
    const dy = sc.y - st.y;
    const dz = sc.z - st.z;
    const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);

    targetOrbitRef.current = {
      theta: Math.atan2(dx, dz),
      phi: Math.acos(Math.max(-1, Math.min(1, dy / dist))),
      dist,
      tx: st.x,
      ty: st.y,
      tz: st.z,
    };
  }, [step]);

  // Mouse controls
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const onDown = (e) => {
      mouseRef.current = { down: true, button: e.button, x: e.clientX, y: e.clientY };
      e.preventDefault();
    };
    const onUp = () => { mouseRef.current.down = false; };
    const onMove = (e) => {
      if (!mouseRef.current.down) return;
      const dx = e.clientX - mouseRef.current.x;
      const dy = e.clientY - mouseRef.current.y;
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;

      const o = targetOrbitRef.current;
      if (mouseRef.current.button === 0) {
        // Left drag = orbit
        o.theta -= dx * 0.005;
        o.phi = Math.max(0.1, Math.min(Math.PI - 0.1, o.phi - dy * 0.005));
      } else if (mouseRef.current.button === 2) {
        // Right drag = pan
        const cam = cameraRef.current;
        const right = new THREE.Vector3();
        const up = new THREE.Vector3();
        cam.getWorldDirection(new THREE.Vector3());
        right.crossVectors(cam.up, new THREE.Vector3().subVectors(cam.position, new THREE.Vector3(o.tx, o.ty, o.tz))).normalize();
        up.copy(cam.up);
        o.tx -= right.x * dx * 0.02 + up.x * dy * -0.02;
        o.ty -= right.y * dx * 0.02 + up.y * dy * -0.02;
        o.tz -= right.z * dx * 0.02 + up.z * dy * -0.02;
      }
    };
    const onWheel = (e) => {
      e.preventDefault();
      targetOrbitRef.current.dist *= 1 + e.deltaY * 0.001;
      targetOrbitRef.current.dist = Math.max(5, Math.min(60, targetOrbitRef.current.dist));
    };
    const onCtx = (e) => e.preventDefault();

    mount.addEventListener("mousedown", onDown);
    mount.addEventListener("mouseup", onUp);
    mount.addEventListener("mouseleave", onUp);
    mount.addEventListener("mousemove", onMove);
    mount.addEventListener("wheel", onWheel, { passive: false });
    mount.addEventListener("contextmenu", onCtx);

    return () => {
      mount.removeEventListener("mousedown", onDown);
      mount.removeEventListener("mouseup", onUp);
      mount.removeEventListener("mouseleave", onUp);
      mount.removeEventListener("mousemove", onMove);
      mount.removeEventListener("wheel", onWheel);
      mount.removeEventListener("contextmenu", onCtx);
    };
  }, []);

  return (
    <div ref={mountRef} style={{ width: "100%", height: "100%", cursor: "grab" }} />
  );
}

// ══════════════════════════════════════════════════
// RICH TEXT RENDERER
// ══════════════════════════════════════════════════
function RichText({ text }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\n)/g);
  return (
    <span>{parts.map((p, i) => {
      if (p === "\n") return <br key={i} />;
      if (p.startsWith("**") && p.endsWith("**"))
        return <strong key={i} style={{ color: "#e2e8f0", fontWeight: 600 }}>{p.slice(2, -2)}</strong>;
      if (p.startsWith("`") && p.endsWith("`"))
        return <code key={i} style={{
          background: "rgba(99,102,241,0.18)", color: "#a5b4fc",
          padding: "1px 6px", borderRadius: 4, fontSize: "0.88em",
          fontFamily: "monospace",
        }}>{p.slice(1, -1)}</code>;
      return <span key={i}>{p}</span>;
    })}</span>
  );
}

// ══════════════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════════════
export default function App() {
  const [idx, setIdx] = useState(0);
  const sidebarRef = useRef(null);
  const s = steps[idx];
  const color = phaseColors[s.phase];

  const goNext = () => setIdx(i => Math.min(i + 1, steps.length - 1));
  const goPrev = () => setIdx(i => Math.max(i - 1, 0));

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); goNext(); }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); goPrev(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => { if (sidebarRef.current) sidebarRef.current.scrollTop = 0; }, [idx]);

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", background: C.bg, overflow: "hidden", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {/* ══════ LEFT PANEL ══════ */}
      <div style={{
        width: 400, minWidth: 360, height: "100%",
        background: C.panel, borderRight: `1px solid ${C.panelBorder}`,
        display: "flex", flexDirection: "column", overflow: "hidden",
        zIndex: 10, boxShadow: "4px 0 20px rgba(0,0,0,0.3)",
      }}>
        {/* Header */}
        <div style={{ padding: "14px 20px 10px", borderBottom: `1px solid ${C.panelBorder}`, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: color, boxShadow: `0 0 8px ${color}60`,
            }} />
            <span style={{
              fontFamily: "monospace", fontSize: 11, color: C.textMuted,
              letterSpacing: 2, textTransform: "uppercase",
            }}>
              Karpathy's Minimal GPT · Interactive 3D Walkthrough
            </span>
          </div>

          {/* Progress dots */}
          <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
            {steps.map((st, i) => (
              <button key={st.id} onClick={() => setIdx(i)} title={st.title}
                style={{
                  width: i === idx ? 22 : 8, height: 8, borderRadius: 4,
                  border: "none", cursor: "pointer", transition: "all 0.3s",
                  background: i === idx ? phaseColors[st.phase] : (i < idx ? phaseColors[st.phase] + "70" : C.textDim + "40"),
                  boxShadow: i === idx ? `0 0 6px ${phaseColors[st.phase]}60` : "none",
                }} />
            ))}
          </div>
        </div>

        {/* Scrollable content */}
        <div ref={sidebarRef} style={{ flex: 1, overflowY: "auto", padding: "20px 20px 80px" }}>
          {/* Phase tag */}
          <div style={{
            display: "inline-block", padding: "2px 10px", borderRadius: 4,
            background: color + "18", color, fontFamily: "monospace",
            fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 10,
            border: `1px solid ${color}30`,
          }}>
            {phaseLabels[s.phase]}
          </div>

          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: C.text, lineHeight: 1.3 }}>
            {s.title}
          </h2>
          <div style={{ fontSize: 13, color, fontFamily: "monospace", margin: "4px 0 16px" }}>
            {s.subtitle}
          </div>

          <div style={{ fontSize: 14, lineHeight: 1.8, color: C.textMuted, whiteSpace: "pre-wrap" }}>
            <RichText text={s.body} />
          </div>

          {/* Tensor info cards for relevant steps */}
          {s.highlight.length > 0 && s.highlight[0] !== "all" && (
            <div style={{ marginTop: 20, padding: 14, background: color + "10", borderRadius: 8, border: `1px solid ${color}20` }}>
              <div style={{ fontFamily: "monospace", fontSize: 11, color, fontWeight: 700, marginBottom: 6 }}>
                HIGHLIGHTED TENSORS
              </div>
              {s.highlight.map(h => (
                <div key={h} style={{
                  display: "inline-block", padding: "3px 10px", borderRadius: 4,
                  background: color + "20", color, fontFamily: "monospace", fontSize: 12,
                  margin: "2px 4px 2px 0",
                }}>
                  {h}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div style={{
          padding: "12px 20px", borderTop: `1px solid ${C.panelBorder}`,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexShrink: 0, background: C.panel,
        }}>
          <button onClick={goPrev} disabled={idx === 0}
            style={{
              padding: "7px 16px", border: `1px solid ${idx === 0 ? C.textDim + "30" : color + "50"}`,
              borderRadius: 6, background: "transparent",
              color: idx === 0 ? C.textDim : color,
              cursor: idx === 0 ? "default" : "pointer",
              fontFamily: "monospace", fontSize: 12, transition: "all 0.2s",
            }}>
            ← Prev
          </button>
          <span style={{ fontFamily: "monospace", fontSize: 11, color: C.textDim }}>
            {idx + 1} / {steps.length}
          </span>
          <button onClick={goNext} disabled={idx === steps.length - 1}
            style={{
              padding: "7px 16px", border: "none", borderRadius: 6,
              background: idx === steps.length - 1 ? C.textDim + "30" : color,
              color: idx === steps.length - 1 ? C.textDim : "#fff",
              cursor: idx === steps.length - 1 ? "default" : "pointer",
              fontFamily: "monospace", fontSize: 12, fontWeight: 600, transition: "all 0.2s",
              boxShadow: idx < steps.length - 1 ? `0 2px 10px ${color}40` : "none",
            }}>
            Next →
          </button>
        </div>
      </div>

      {/* ══════ RIGHT: 3D SCENE ══════ */}
      <div style={{ flex: 1, height: "100%", position: "relative", overflow: "hidden" }}>
        {/* Overlay info */}
        <div style={{
          position: "absolute", top: 14, left: 20, zIndex: 10,
          display: "flex", flexDirection: "column", gap: 4,
        }}>
          <div style={{
            padding: "6px 14px", borderRadius: 6,
            background: "rgba(21,26,43,0.85)", backdropFilter: "blur(8px)",
            border: `1px solid ${C.panelBorder}`,
            fontFamily: "monospace", fontSize: 11, color: C.textMuted,
          }}>
            <span style={{ color }}>●</span> {s.title} — {s.subtitle}
          </div>
        </div>

        {/* Controls hint */}
        <div style={{
          position: "absolute", bottom: 14, left: 20, zIndex: 10,
          padding: "6px 14px", borderRadius: 6,
          background: "rgba(21,26,43,0.85)", backdropFilter: "blur(8px)",
          border: `1px solid ${C.panelBorder}`,
          fontFamily: "monospace", fontSize: 10, color: C.textDim,
          display: "flex", gap: 16,
        }}>
          <span>🖱 Left-drag: orbit</span>
          <span>🖱 Right-drag: pan</span>
          <span>⚙ Scroll: zoom</span>
          <span>⌨ ← → keys: navigate</span>
        </div>

        {/* Legend */}
        <div style={{
          position: "absolute", top: 14, right: 20, zIndex: 10,
          padding: "8px 14px", borderRadius: 6,
          background: "rgba(21,26,43,0.85)", backdropFilter: "blur(8px)",
          border: `1px solid ${C.panelBorder}`,
          fontFamily: "monospace", fontSize: 10, color: C.textDim,
          display: "flex", flexDirection: "column", gap: 3,
        }}>
          <div><span style={{ color: "#5b8def" }}>■</span> Positive value</div>
          <div><span style={{ color: "#d4863b" }}>■</span> Negative value</div>
          <div><span style={{ color: "#888" }}>□</span> Brightness = magnitude</div>
        </div>

        <ThreeScene step={s} stepIndex={idx} />
      </div>
    </div>
  );
}
