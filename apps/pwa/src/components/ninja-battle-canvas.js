import { LitElement, css, html } from 'lit';
import * as THREE from 'three';
import { combatEvents } from '@clan-wars/game-core';

export class NinjaBattleCanvas extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .canvas-wrapper {
      position: relative;
      border-radius: var(--radius-lg);
      overflow: hidden;
      border: 1px solid var(--color-border);
      aspect-ratio: 3 / 4;
      background: radial-gradient(circle at top, rgba(30, 154, 176, 0.25), rgba(15, 23, 42, 0.9));
    }

    /* Mobile responsive canvas */
    @media (max-width: 768px) {
      .canvas-wrapper {
        aspect-ratio: 4 / 5; /* Slightly taller on mobile for better lane visibility */
        border-radius: var(--radius-md);
      }
    }

    @media (max-width: 480px) {
      .canvas-wrapper {
        aspect-ratio: 9 / 10; /* More square aspect ratio on small phones */
      }
    }

    canvas {
      width: 100%;
      height: 100%;
      display: block;
    }

    .overlay {
      position: absolute;
      inset: 12px;
      pointer-events: none;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      font-size: var(--font-size-sm);
    }

    .lane-info {
      display: grid;
      gap: 4px;
      pointer-events: auto;
    }

    .lane {
      display: flex;
      flex-direction: column;
      align-items: stretch;
      gap: 4px;
      padding: 6px 10px;
      border-radius: var(--radius-md);
      background: rgba(15, 23, 42, 0.45);
      border: 1px solid rgba(248, 250, 252, 0.08);
      transition: background var(--transition-medium), transform var(--transition-medium);
      pointer-events: auto;
      cursor: pointer;
      /* Mobile-friendly touch targets */
      min-height: 44px;
      touch-action: manipulation;
      position: relative;
    }

    /* Enhanced mobile touch states */
    @media (hover: none) and (pointer: coarse) {
      .lane {
        min-height: 52px; /* Larger touch targets on touch devices */
        padding: 8px 12px;
      }
      
      .lane:active {
        transform: scale(0.98);
        background: rgba(30, 154, 176, 0.6);
        transition: all 0.1s ease-out;
      }
    }

    /* Touch ripple effect for lanes */
    .lane::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      border-radius: 50%;
      background: rgba(30, 154, 176, 0.3);
      transform: translate(-50%, -50%);
      transition: width 0.3s ease-out, height 0.3s ease-out;
      pointer-events: none;
      opacity: 0;
    }

    .lane:active::after {
      width: 100%;
      height: 100%;
      opacity: 1;
      transition: width 0.1s ease-out, height 0.1s ease-out, opacity 0.1s ease-out;
    }

    .lane.active {
      background: rgba(30, 154, 176, 0.45);
      transform: translateY(-2px);
    }

    .lane.selected {
      border-color: rgba(30, 154, 176, 0.8);
      box-shadow: 0 0 0 1px rgba(30, 154, 176, 0.6);
    }

    .lane.pending {
      box-shadow: 0 0 0 1px rgba(248, 250, 252, 0.25);
      background: rgba(30, 64, 175, 0.45);
    }

    .lane-header,
    .lane-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      font-size: var(--font-size-xs);
    }

    .lane-row.subtle {
      color: rgba(248, 250, 252, 0.72);
    }

    .lane-row.detail {
      gap: 12px;
      align-items: stretch;
    }

    .lane-row.alert {
      color: #fcd34d;
    }

    .front {
      display: flex;
      flex-direction: column;
      gap: 2px;
      flex: 1 1 0;
    }

    .front.player {
      align-items: flex-start;
    }

    .front.ai {
      align-items: flex-end;
    }

    .health-bar {
      position: relative;
      width: 100%;
      height: 6px;
      border-radius: 999px;
      background: rgba(148, 163, 184, 0.3);
      overflow: hidden;
    }

    .health-bar .fill {
      height: 100%;
      border-radius: 999px;
      transition: width var(--transition-medium);
    }

    .health-bar.player .fill {
      background: linear-gradient(90deg, rgba(56, 189, 248, 0.8), rgba(96, 165, 250, 0.9));
    }

    .health-bar.ai .fill {
      background: linear-gradient(90deg, rgba(248, 113, 113, 0.85), rgba(239, 68, 68, 0.95));
    }

    .health-bar .label {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.6rem;
      color: rgba(15, 23, 42, 0.68);
      mix-blend-mode: soft-light;
    }

    .status-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }

    .status-tag {
      padding: 2px 6px;
      border-radius: 999px;
      font-size: 0.6rem;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      background: rgba(148, 163, 184, 0.35);
      color: rgba(248, 250, 252, 0.85);
    }

    .status-tag.shield {
      background: rgba(250, 204, 21, 0.35);
      color: rgba(250, 204, 21, 0.95);
    }

    .status-tag.stun {
      background: rgba(161, 161, 170, 0.4);
      color: rgba(244, 244, 245, 0.85);
    }

    .status-tag.burn {
      background: rgba(248, 113, 113, 0.35);
      color: rgba(252, 165, 165, 0.95);
    }

    .status-tag.buff {
      background: rgba(74, 222, 128, 0.35);
      color: rgba(187, 247, 208, 0.95);
    }

    .status-tag.heal {
      background: rgba(34, 197, 94, 0.35);
      color: rgba(134, 239, 172, 0.95);
    }

    .status-tag.freeze {
      background: rgba(59, 130, 246, 0.35);
      color: rgba(147, 197, 253, 0.95);
    }

    .status-tag.stealth {
      background: rgba(139, 92, 246, 0.35);
      color: rgba(196, 181, 253, 0.95);
    }

    .status-tag.ethereal {
      background: rgba(168, 85, 247, 0.25);
      color: rgba(221, 214, 254, 0.9);
      border: 1px solid rgba(168, 85, 247, 0.4);
    }

    .status-tag.vulnerability {
      background: rgba(239, 68, 68, 0.25);
      color: rgba(254, 202, 202, 0.95);
    }

    .status-tag.mark {
      background: rgba(244, 63, 94, 0.25);
      color: rgba(248, 113, 113, 0.95);
      border: 1px solid rgba(244, 63, 94, 0.4);
    }

    .status-tag.aura {
      background: rgba(13, 148, 136, 0.25);
      color: rgba(94, 234, 212, 0.95);
      border: 1px solid rgba(13, 148, 136, 0.35);
    }

    .status-tag.rupture {
      background: rgba(250, 204, 21, 0.22);
      color: rgba(253, 224, 71, 0.95);
      border: 1px solid rgba(234, 179, 8, 0.4);
    }

    .status-tag.ward {
      background: rgba(59, 130, 246, 0.22);
      color: rgba(191, 219, 254, 0.95);
      border: 1px solid rgba(59, 130, 246, 0.35);
    }

    .lane-row.effects .status-tags {
      justify-content: flex-end;
    }

    .combo-chip {
      padding: 2px 8px;
      border-radius: 999px;
      background: rgba(30, 64, 175, 0.45);
      color: rgba(191, 219, 254, 0.95);
      font-size: 0.62rem;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }

    .combo-chip.warning {
      background: rgba(220, 38, 38, 0.45);
      color: rgba(248, 250, 252, 0.95);
    }

    .combo-chip.warning.urgent {
      background: rgba(220, 38, 38, 0.75);
      box-shadow: 0 0 8px rgba(220, 38, 38, 0.45);
    }

    .controls {
      display: flex;
      justify-content: flex-end;
      gap: var(--space-8);
      pointer-events: auto;
    }

    .terrain-countdown {
      position: absolute;
      top: 12px;
      left: 12px;
      right: 12px;
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid rgba(248, 250, 252, 0.1);
      border-radius: var(--radius-md);
      padding: 8px 12px;
      pointer-events: none;
      transition: all var(--transition-medium);
      font-size: var(--font-size-sm);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    /* Mobile optimized terrain countdown */
    @media (max-width: 768px) {
      .terrain-countdown {
        font-size: var(--font-size-base);
        padding: 10px 16px;
      }
    }

    @media (max-width: 480px) {
      .terrain-countdown {
        font-size: var(--font-size-lg);
        padding: 12px 16px;
        flex-direction: column;
        gap: 4px;
        text-align: center;
      }
      
      .terrain-info {
        order: 2;
      }
      
      .countdown-display {
        order: 1;
        font-size: var(--font-size-xl) !important;
      }
    }

    .terrain-countdown.urgent {
      background: rgba(220, 38, 38, 0.25);
      border-color: rgba(244, 63, 94, 0.4);
      box-shadow: 0 0 12px rgba(220, 38, 38, 0.3);
      animation: crescendo-pulse 1s ease-in-out infinite alternate;
    }

    .terrain-countdown.warning {
      background: rgba(250, 204, 21, 0.25);
      border-color: rgba(234, 179, 8, 0.4);
      box-shadow: 0 0 8px rgba(250, 204, 21, 0.25);
    }

    @keyframes crescendo-pulse {
      from {
        box-shadow: 0 0 12px rgba(220, 38, 38, 0.3);
        transform: scale(1);
      }
      to {
        box-shadow: 0 0 20px rgba(220, 38, 38, 0.6);
        transform: scale(1.02);
      }
    }

    .terrain-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .terrain-name {
      font-weight: 600;
      color: rgba(248, 250, 252, 0.95);
    }

    .terrain-effect {
      font-size: var(--font-size-xs);
      color: rgba(248, 250, 252, 0.7);
    }

    .countdown-display {
      font-weight: 700;
      font-size: var(--font-size-lg);
      color: rgba(248, 250, 252, 0.95);
    }

    .countdown-display.urgent {
      color: rgba(248, 113, 113, 0.95);
    }

    .countdown-display.warning {
      color: rgba(253, 224, 71, 0.95);
    }

    button {
      pointer-events: auto;
      background: rgba(15, 23, 42, 0.7);
      border: 1px solid rgba(248, 250, 252, 0.08);
      color: var(--color-text);
      padding: 6px 12px;
      border-radius: var(--radius-pill);
      font-size: var(--font-size-xs);
      cursor: pointer;
      transition: all var(--transition-fast);
      /* Mobile-friendly touch targets */
      min-height: 44px;
      touch-action: manipulation;
    }

    button:hover {
      background: rgba(15, 23, 42, 0.9);
      transform: translateY(-1px);
    }

    button:active {
      transform: translateY(0);
      background: rgba(30, 154, 176, 0.7);
    }

    /* Enhanced mobile button styling */
    @media (hover: none) and (pointer: coarse) {
      button {
        min-height: 48px;
        padding: 8px 16px;
        font-size: var(--font-size-sm);
      }
      
      button:active {
        transform: scale(0.95);
        background: rgba(30, 154, 176, 0.8);
        transition: all 0.1s ease-out;
      }
    }

    /* Damage Floaters */
    .damage-floaters {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      z-index: 10;
    }

    .damage-floater {
      position: absolute;
      font-weight: 700;
      font-size: 18px;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
      animation: float-up 1.5s ease-out forwards;
      pointer-events: none;
    }

    .damage-floater.damage {
      color: #ef4444;
    }

    .damage-floater.heal {
      color: #22c55e;
    }

    .damage-floater.shield {
      color: #3b82f6;
    }

    @keyframes float-up {
      0% {
        opacity: 1;
        transform: translateY(0px) scale(1);
      }
      20% {
        opacity: 1;
        transform: translateY(-20px) scale(1.2);
      }
      100% {
        opacity: 0;
        transform: translateY(-80px) scale(0.8);
      }
    }
  `;

  static properties = {
    state: { attribute: false },
    selectedLane: { type: String },
    damageFloaters: { state: true }
  };

  #scene;
  #camera;
  #renderer;
  #resizeObserver;
  #lanes = {
    mountain: new THREE.Mesh(),
    forest: new THREE.Mesh(),
    river: new THREE.Mesh()
  };
  #unitGroups = {
    mountain: { player: new THREE.Group(), ai: new THREE.Group() },
    forest: { player: new THREE.Group(), ai: new THREE.Group() },
    river: { player: new THREE.Group(), ai: new THREE.Group() }
  };
  #unitStates = new Map();
  #nextUnitStates = null;
  #laneCombos = new Map();
  #lastComboStamp = null;
  #combatEventUnsubscribe = null;

  constructor() {
    super();
    this.state = null;
    this.selectedLane = null;
    this.damageFloaters = [];
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.#resizeObserver) {
      this.#resizeObserver.disconnect();
    }
    if (this.#combatEventUnsubscribe) {
      this.#combatEventUnsubscribe();
    }
  }

  firstUpdated() {
    const canvas = this.renderRoot.querySelector('canvas');
    if (!canvas) {
      console.warn('Canvas element not found');
      return;
    }

    // Wait for layout to settle before initializing Three.js
    requestAnimationFrame(() => {
      this.#initializeThreeJS(canvas);
      this.#setupCombatEventListener();
    });
  }

  #initializeThreeJS(canvas) {
    const wrapper = canvas.parentElement;
    const rect = wrapper.getBoundingClientRect();
    const width = rect.width || 400;  // Fallback dimensions
    const height = rect.height || 500;

    console.log(`Initializing Three.js canvas: ${width}x${height}`);

    if (width === 0 || height === 0) {
      console.warn('Canvas has zero dimensions, retrying...');
      setTimeout(() => this.#initializeThreeJS(canvas), 100);
      return;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#090e1a');

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 4.2, 6.5);
    camera.lookAt(0, 0, 0);

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ 
        canvas, 
        antialias: true, 
        alpha: true,
        preserveDrawingBuffer: false
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio ?? 1, 2));
      console.log('WebGL renderer created successfully');
      console.log('Renderer info:', renderer.info);
    } catch (error) {
      console.error('Failed to create WebGL renderer:', error);
      return;
    }

    const ambient = new THREE.AmbientLight('#6ec8d8', 0.6);
    scene.add(ambient);

    const directional = new THREE.DirectionalLight('#fef3c7', 0.8);
    directional.position.set(3, 6, 5);
    scene.add(directional);

    console.log('Lights added to scene');

    // Add test cube to verify rendering is working
    const testGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const testMaterial = new THREE.MeshStandardMaterial({ color: '#ff6b6b' });
    const testCube = new THREE.Mesh(testGeometry, testMaterial);
    testCube.position.set(0, 1, 0);
    scene.add(testCube);
    console.log('Test cube added to scene');

    const lanes = [
      ['mountain', 1.6],
      ['forest', 0],
      ['river', -1.6]
    ];

    const geometry = new THREE.PlaneGeometry(2.4, 1.2, 16, 16);

    console.log('Creating lane meshes...');
    for (const [laneId, z] of lanes) {
      const color = laneId === 'mountain' ? '#d97706' : laneId === 'forest' ? '#22c55e' : '#38bdf8';
      const material = new THREE.MeshStandardMaterial({
        color,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide
      });
      material.emissive = new THREE.Color('#60a5fa');
      material.emissiveIntensity = 0;
      const mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(0, 0, z);
      mesh.userData = {
        baseOpacity: material.opacity,
        baseColor: material.color.clone(),
        baseEmissive: material.emissive.clone()
      };
      scene.add(mesh);
      this.#lanes[laneId] = mesh;
      console.log(`Created ${laneId} lane at z=${z} with color ${color}`);

      const groups = this.#unitGroups[laneId];
      groups.player.position.set(-0.6, 0.01, z - 0.4);
      groups.ai.position.set(0.6, 0.01, z - 0.4);
      scene.add(groups.player);
      scene.add(groups.ai);
    }

    const animate = (time) => {
      if (!this.isConnected || !this.#renderer) return;
      const timestamp = typeof time === 'number' ? time : this.#now();
      
      // Rotate test cube for visual confirmation
      if (testCube) {
        testCube.rotation.x += 0.01;
        testCube.rotation.y += 0.01;
      }
      
      this.#updateAnimations(timestamp);
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);

    // Setup resize observer for responsive canvas
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newWidth, height: newHeight } = entry.contentRect;
        if (newWidth > 0 && newHeight > 0) {
          camera.aspect = newWidth / newHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(newWidth, newHeight);
        }
      }
    });
    resizeObserver.observe(wrapper);

    this.#scene = scene;
    this.#camera = camera;
    this.#renderer = renderer;
    this.#resizeObserver = resizeObserver;

    console.log('Three.js initialization complete');
  }

  updated() {
    if (!this.#scene || !this.state) return;

    const now = this.#now();
    this.#syncLaneCombos(now);
    this.#nextUnitStates = new Map();

    for (const [laneId, mesh] of Object.entries(this.#lanes)) {
      const isActive = this.state?.activeTerrain === laneId;
      const targetOpacity = isActive ? 0.9 : 0.55;
      const material = mesh.material;
      if (material && typeof material === 'object' && 'opacity' in material) {
        if (material.opacity !== targetOpacity) {
          material.opacity = targetOpacity;
          material.needsUpdate = true;
        }
      }
    }

    ['mountain', 'forest', 'river'].forEach((lane) => {
      const laneState = this.state?.battlefield?.[lane];
      if (!laneState) return;
      const groups = this.#unitGroups[lane];
      this.#syncUnits(groups.player, laneState.player, 'player');
      this.#syncUnits(groups.ai, laneState.ai, 'ai');
    });

    if (this.#nextUnitStates) {
      this.#unitStates = this.#nextUnitStates;
      this.#nextUnitStates = null;
    }
  }

  #syncUnits(group, units, owner) {
    while (group.children.length) {
      const child = group.children.pop();
      if (child.geometry && child.geometry.dispose) child.geometry.dispose();
      if (child.material && child.material.dispose) child.material.dispose();
    }
    const baseGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
    const now = this.#now();
    units.forEach((unit, index) => {
      const statuses = Array.isArray(unit.status) ? unit.status : [];
      const hasShield = statuses.some((status) => status.type === 'shield');
      const isStunned = statuses.some(
        (status) => status.type === 'crowd-control' && status.crowdControl === 'stun'
      );
      const isFrozen = statuses.some(
        (status) => status.type === 'crowd-control' && status.crowdControl === 'freeze'
      );
      const burning = statuses.some((status) => status.type === 'damage-over-time');
      const healing = statuses.some((status) => status.type === 'heal-over-time');
      const stealthed = statuses.some((status) => status.type === 'stealth');
      const ethereal = statuses.some((status) => status.type === 'ethereal');
      const marked = statuses.some((status) => status.type === 'delayed-damage');
      const aura = statuses.some((status) => status.type === 'aura');
      const ruptured = statuses.some((status) => status.type === 'rupture');
      const warded = statuses.some((status) => status.type === 'shield-pulse');
      
      const baseColor = owner === 'player' ? '#38bdf8' : '#f87171';
      let color = baseColor;
      if (isStunned) {
        color = '#94a3b8';
      } else if (isFrozen) {
        color = '#3b82f6';
      } else if (burning) {
        color = '#f97316';
      } else if (marked) {
        color = '#f43f5e';
      } else if (ruptured) {
        color = '#facc15';
      } else if (healing) {
        color = '#22c55e';
      } else if (warded) {
        color = '#60a5fa';
      } else if (stealthed) {
        color = '#8b5cf6';
      } else if (ethereal) {
        color = '#a855f7';
      } else if (aura) {
        color = '#14b8a6';
      }
      const baseOpacity = stealthed ? 0.6 : ethereal ? 0.7 : burning ? 0.9 : 1;
      let emissiveColor = hasShield ? '#fde047' : '#000000';
      let emissiveIntensity = hasShield ? 0.45 : 0;
      if (aura) {
        emissiveColor = '#2dd4bf';
        emissiveIntensity = Math.max(emissiveIntensity, 0.32);
      }
      if (ruptured) {
        emissiveColor = '#facc15';
        emissiveIntensity = Math.max(emissiveIntensity, 0.36);
      }
      if (warded) {
        emissiveColor = '#60a5fa';
        emissiveIntensity = Math.max(emissiveIntensity, 0.32);
      }
      if (marked) {
        emissiveColor = '#fb7185';
        emissiveIntensity = Math.max(emissiveIntensity, 0.4);
      }
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        emissive: new THREE.Color(emissiveColor),
        emissiveIntensity,
        transparent: true,
        opacity: baseOpacity
      });
      const mesh = new THREE.Mesh(baseGeometry.clone(), material);
      const maxHealth = Math.max(unit.maxHealth ?? unit.health ?? 1, 1);
      const healthRatio = Math.max(unit.health ?? 0, 0) / maxHealth;
      mesh.scale.set(1, Math.max(0.35, healthRatio), 1);
      const baseScaleY = mesh.scale.y;
      const baseY = 0.15 + healthRatio * 0.15;
      mesh.position.set(0, baseY, index * 0.35);

      const previous = this.#unitStates.get(unit.id);
      let event = 'idle';
      let eventAt = previous?.eventAt ?? now;
      const diff = previous ? (unit.health ?? 0) - (previous.health ?? 0) : 0;
      if (!previous) {
        event = 'spawn';
        eventAt = now;
      } else if (Math.abs(diff) > 0.01) {
        event = diff < 0 ? 'damage' : 'heal';
        eventAt = now;
      } else if (previous.event && now - (previous.eventAt ?? 0) < 400) {
        event = previous.event;
        eventAt = previous.eventAt ?? now;
      }

      if (event === 'spawn') {
        mesh.position.y = baseY - 0.5;
        material.opacity = 0;
      }

      mesh.userData = {
        id: unit.id,
        owner,
        baseScaleY,
        baseY,
        baseOpacity,
        baseEmissiveIntensity: material.emissiveIntensity,
        event,
        eventAt,
        statuses
      };

      const nextState = {
        health: unit.health,
        event,
        eventAt,
        baseScaleY,
        baseY,
        baseEmissiveIntensity: material.emissiveIntensity
      };
      this.#nextUnitStates?.set(unit.id, nextState);

      group.add(mesh);
    });
    baseGeometry.dispose();
  }

  #selectLane(lane) {
    // Haptic feedback for lane selection
    this.#triggerHapticFeedback('light');
    
    this.selectedLane = lane;
    this.dispatchEvent(
      new CustomEvent('lane-selected', {
        detail: { lane },
        bubbles: true,
        composed: true
      })
    );
  }

  #triggerHapticFeedback(intensity = 'light') {
    // Check if vibration API is supported
    if (!navigator.vibrate) return;

    // Define vibration patterns for different intensities
    const patterns = {
      light: 10,      // Brief tap for lane selection
      medium: [50],   // Single vibration for important actions
      heavy: [100, 50, 100], // Pattern for combat events
      combo: [30, 20, 50, 20, 70], // Special pattern for combo execution
    };

    const pattern = patterns[intensity] || patterns.light;
    
    try {
      navigator.vibrate(pattern);
    } catch (error) {
      // Silently fail if vibration is not available or permission denied
      console.debug('Haptic feedback unavailable:', error.message);
    }
  }

  #syncLaneCombos(now) {
    const last = this.state?.comboState?.lastTriggered;
    if (!last) return;
    const stamp = `${last.comboId}:${last.timestamp}`;
    if (this.#lastComboStamp === stamp) return;
    this.#laneCombos.set(last.lane, { triggeredAt: now });
    this.#lastComboStamp = stamp;
  }

  #updateAnimations(now) {
    this.#updateLaneEffects(now);
    for (const lane of Object.keys(this.#unitGroups)) {
      const groups = this.#unitGroups[lane];
      this.#animateGroup(groups.player, now);
      this.#animateGroup(groups.ai, now);
    }
  }

  #updateLaneEffects(now) {
    for (const [laneId, mesh] of Object.entries(this.#lanes)) {
      const material = mesh.material;
      if (!material) continue;
      const effect = this.#laneCombos.get(laneId);
      const pendingEntry = (this.state?.comboState?.pending ?? []).find(
        (entry) => entry.lane === laneId
      );
      let targetIntensity = 0;
      let emissiveOverride = mesh.userData?.baseEmissive
        ? mesh.userData.baseEmissive.clone()
        : null;

      if (pendingEntry) {
        const combosMap = this.#comboMap();
        const combo = combosMap.get(pendingEntry.comboId);
        const windowMs = combo?.windowMs ?? 6000;
        const remaining = Math.max(0, (pendingEntry.expiresAt ?? now) - now);
        const urgency = Math.max(0, Math.min(1, 1 - remaining / windowMs));
        const oscillation = 0.15 + 0.1 * Math.abs(Math.sin(now / 120));
        targetIntensity = Math.max(targetIntensity, 0.18 + urgency * 0.7 + oscillation);
        emissiveOverride = '#f97316';
      } else {
        const laneState = this.state?.battlefield?.[laneId];
        if (laneState) {
          const enemyRuptured = laneState.ai.some((unit) =>
            (unit.status ?? []).some((status) => status.type === 'rupture')
          );
          const allyWard = laneState.player.some((unit) =>
            (unit.status ?? []).some((status) => status.type === 'shield-pulse')
          );
          const enemyWard = laneState.ai.some((unit) =>
            (unit.status ?? []).some((status) => status.type === 'shield-pulse')
          );

          if (enemyRuptured) {
            const rupturePulse = 0.22 + 0.18 * Math.abs(Math.sin(now / 110));
            targetIntensity = Math.max(targetIntensity, rupturePulse);
            emissiveOverride = '#facc15';
          }
          if (allyWard || enemyWard) {
            const wardPulse = 0.18 + 0.12 * Math.abs(Math.sin(now / 150));
            targetIntensity = Math.max(targetIntensity, wardPulse);
            if (!enemyRuptured) {
              emissiveOverride = '#60a5fa';
            }
          }
        }
      }

      if (effect) {
        const elapsed = now - effect.triggeredAt;
        const pulse = Math.max(0, 1 - elapsed / 1000);
        targetIntensity = Math.max(targetIntensity, 0.5 * pulse);
        if (elapsed >= 1000) {
          this.#laneCombos.delete(laneId);
        }
      }

      if (emissiveOverride) {
        if (typeof emissiveOverride === 'string') {
          material.emissive.set(emissiveOverride);
        } else {
          material.emissive.copy(emissiveOverride);
        }
      }

      material.emissiveIntensity = THREE.MathUtils.lerp(
        material.emissiveIntensity ?? 0,
        targetIntensity,
        0.3
      );
    }
  }

  #animateGroup(group, now) {
    for (const mesh of group.children) {
      if (!(mesh instanceof THREE.Mesh)) continue;
      const state = this.#unitStates.get(mesh.userData.id);
      if (!state) continue;
      const baseScaleY = mesh.userData.baseScaleY ?? state.baseScaleY ?? mesh.scale.y;
      const baseY = mesh.userData.baseY ?? state.baseY ?? mesh.position.y;
      const baseOpacity = mesh.userData.baseOpacity ?? 1;
      const baseEmissiveIntensity =
        mesh.userData.baseEmissiveIntensity ?? state.baseEmissiveIntensity ?? 0;

      let targetScaleY = baseScaleY;
      let targetY = baseY;
      let targetOpacity = baseOpacity;
      let targetEmissive = baseEmissiveIntensity;

      const elapsed = now - (state.eventAt ?? now);

      switch (state.event) {
        case 'spawn': {
          const progress = Math.min(elapsed / 400, 1);
          targetY = baseY - (1 - progress) * 0.5;
          targetOpacity = baseOpacity * progress;
          targetEmissive = baseEmissiveIntensity + progress * 0.3;
          if (progress >= 0.99) {
            state.event = 'idle';
            state.eventAt = now;
          }
          break;
        }
        case 'damage': {
          const pulse = Math.max(0, 1 - elapsed / 320);
          targetScaleY = baseScaleY * (1 - pulse * 0.25);
          targetEmissive = Math.min(1, baseEmissiveIntensity + pulse * 0.6);
          break;
        }
        case 'heal': {
          const pulse = Math.max(0, 1 - elapsed / 360);
          targetScaleY = baseScaleY * (1 + pulse * 0.22);
          targetEmissive = Math.min(1, baseEmissiveIntensity + pulse * 0.35);
          break;
        }
        default:
          break;
      }

      const statuses = mesh.userData.statuses ?? [];
      if (statuses.some((status) => status.type === 'crowd-control')) {
        const flicker = 0.2 + 0.15 * Math.abs(Math.sin(now / 120));
        targetEmissive = Math.max(targetEmissive, baseEmissiveIntensity + flicker);
      }
      if (statuses.some((status) => status.type === 'damage-over-time')) {
        const burnGlow = 0.15 + 0.15 * Math.abs(Math.sin(now / 90));
        targetEmissive = Math.max(targetEmissive, baseEmissiveIntensity + burnGlow);
      }
      if (statuses.some((status) => status.type === 'heal-over-time')) {
        const healPulse = 0.1 + 0.2 * Math.abs(Math.sin(now / 150));
        targetEmissive = Math.max(targetEmissive, baseEmissiveIntensity + healPulse);
      }
      if (statuses.some((status) => status.type === 'stealth')) {
        const stealthPhase = 0.4 + 0.2 * Math.sin(now / 100);
        targetOpacity *= stealthPhase;
      }
      if (statuses.some((status) => status.type === 'ethereal')) {
        const etherealPhase = 0.6 + 0.3 * Math.sin(now / 200);
        targetOpacity *= etherealPhase;
        const etherealGlow = 0.25 + 0.15 * Math.abs(Math.sin(now / 180));
        targetEmissive = Math.max(targetEmissive, baseEmissiveIntensity + etherealGlow);
      }
      const markStatuses = statuses.filter((status) => status.type === 'delayed-damage');
      if (markStatuses.length) {
        const soonestTrigger = markStatuses.reduce((min, status) => {
          const triggerAt = status.triggerAt ?? now;
          return Math.min(min, triggerAt);
        }, Infinity);
        const sampleDelay = markStatuses.reduce((maxDelay, status) => {
          if (status.delayMs) return Math.max(maxDelay, status.delayMs);
          if (status.expiresAt && status.appliedAt) {
            return Math.max(maxDelay, status.expiresAt - status.appliedAt);
          }
          return maxDelay;
        }, 0);
        const window = sampleDelay || 2000;
        const remaining = Math.max(0, soonestTrigger - now);
        const markProgress = Math.min(1, window ? 1 - remaining / window : 1);
        const markPulse = 0.25 + markProgress * 0.5 + 0.15 * Math.abs(Math.sin(now / 80));
        targetEmissive = Math.max(targetEmissive, baseEmissiveIntensity + markPulse);
        targetScaleY = Math.max(targetScaleY, baseScaleY * (1 + markProgress * 0.12));
      }
      const ruptureStatuses = statuses.filter((status) => status.type === 'rupture');
      if (ruptureStatuses.length) {
        const totalStacks = ruptureStatuses.reduce(
          (sum, status) => sum + Math.max(status.remainingStacks ?? status.stacks ?? 0, 0),
          0
        );
        const ruptureWave = 0.18 + 0.12 * Math.abs(Math.sin(now / 95));
        targetEmissive = Math.max(targetEmissive, baseEmissiveIntensity + ruptureWave);
        if (totalStacks > 0) {
          targetScaleY = Math.max(targetScaleY, baseScaleY * (1 + 0.025 * totalStacks));
        }
      }
      if (statuses.some((status) => status.type === 'shield-pulse')) {
        const wardGlow = 0.14 + 0.1 * Math.abs(Math.sin(now / 160));
        targetEmissive = Math.max(targetEmissive, baseEmissiveIntensity + wardGlow);
        const wardLift = Math.max(0, 0.03 * Math.sin(now / 140 + 0.5));
        targetScaleY = Math.max(targetScaleY, baseScaleY * (1 + wardLift));
      }
      if (statuses.some((status) => status.type === 'aura')) {
        const auraWave = 0.15 + 0.1 * Math.sin(now / 180);
        targetEmissive = Math.max(targetEmissive, baseEmissiveIntensity + auraWave);
        targetScaleY = Math.max(targetScaleY, baseScaleY * (1 + 0.05 * Math.sin(now / 220)));
      }

      mesh.scale.y = THREE.MathUtils.lerp(mesh.scale.y, targetScaleY, 0.25);
      mesh.position.y = THREE.MathUtils.lerp(mesh.position.y, targetY, 0.18);
      mesh.material.opacity = THREE.MathUtils.lerp(
        mesh.material.opacity,
        targetOpacity,
        0.25
      );
      mesh.material.emissiveIntensity = THREE.MathUtils.lerp(
        mesh.material.emissiveIntensity ?? 0,
        targetEmissive,
        0.2
      );
    }
  }

  #comboMap() {
    return new Map((this.state?.combos ?? []).map((combo) => [combo.id, combo]));
  }

  #laneLastCombo(lane) {
    const history = this.state?.comboState?.history ?? [];
    for (let index = history.length - 1; index >= 0; index -= 1) {
      const entry = history[index];
      if (entry.lane === lane) {
        return entry;
      }
    }
    return null;
  }

  #renderHealthBar(unit, owner) {
    const maxHealth = unit ? Math.max(unit.maxHealth ?? unit.health ?? 1, 1) : 1;
    const currentHealth = unit ? Math.max(unit.health ?? 0, 0) : 0;
    const ratio = Math.min(currentHealth / maxHealth, 1);
    const percent = `${Math.round(ratio * 100)}%`;
    const label = unit ? `${Math.round(currentHealth)}/${Math.round(maxHealth)}` : '—';
    return html`
      <div class="health-bar ${owner}">
        <div class="fill" style="width: ${percent}"></div>
        <span class="label">${label}</span>
      </div>
    `;
  }

  #renderStatusTags(unit, now) {
    const statuses = unit?.status ?? [];
    if (!statuses.length) return null;
    const tags = statuses
      .map((status) => this.#describeStatus(status, now))
      .filter((entry) => entry && entry.label);
    if (!tags.length) return null;
    return html`
      <div class="status-tags">
        ${tags.map(({ label, tone }) => html`<span class="status-tag ${tone}">${label}</span>`) }
      </div>
    `;
  }

  #describeStatus(status, now) {
    if (!status) return null;
    const label = this.#formatStatusLabel(status, now);
    if (!label) return null;
    return {
      label,
      tone: this.#statusTone(status)
    };
  }

  #formatStatusLabel(status, now) {
    if (!status) return '';
    const time = this.#statusTime(status, now);
    const withTime = (label) => (time ? `${label} ${time}` : label);
    switch (status.type) {
      case 'shield': {
        const remaining = Math.round(status.remainingValue ?? status.value ?? 0);
        const label = remaining > 0 ? `Shield ${remaining}` : 'Shield';
        return withTime(label);
      }
      case 'crowd-control': {
        const base = status.crowdControl === 'freeze' ? 'Frozen'
          : status.crowdControl === 'stun' ? 'Stunned'
          : 'Controlled';
        return withTime(base);
      }
      case 'damage-over-time':
        return withTime('Burn');
      case 'heal-over-time':
        return withTime('Regen');
      case 'buff':
        return withTime('Buff');
      case 'stealth':
        return withTime('Stealth');
      case 'ethereal':
        return withTime('Ethereal');
      case 'delayed-damage':
        return withTime('Mark');
      case 'aura':
        return withTime('Aura');
      case 'rupture': {
        const stacks = Math.max(status.remainingStacks ?? status.stacks ?? 0, 0);
        const label = stacks > 0 ? `Rupture (${stacks})` : 'Rupture';
        return withTime(label);
      }
      case 'shield-pulse': {
        const granted = Math.round(status.granted ?? 0);
        const maxStacks = Math.max(status.maxStacks ?? 3, 0);
        const capacity = Math.round(maxStacks * (status.shieldValue ?? 0));
        let label = 'Ward';
        if (capacity > 0) {
          label = `Ward ${Math.min(granted, capacity)}/${capacity}`;
        } else if (granted > 0) {
          label = `Ward +${granted}`;
        }
        return withTime(label);
      }
      default:
        return status.id ?? status.type ?? '';
    }
  }

  #statusTone(status) {
    if (!status) return '';
    switch (status.type) {
      case 'shield':
        return 'shield';
      case 'crowd-control':
        return status.crowdControl === 'freeze' ? 'freeze' : 'stun';
      case 'damage-over-time':
        return 'burn';
      case 'heal-over-time':
        return 'heal';
      case 'buff':
        return 'buff';
      case 'stealth':
        return 'stealth';
      case 'ethereal':
        return 'ethereal';
      case 'delayed-damage':
        return 'mark';
      case 'aura':
        return 'aura';
      case 'rupture':
        return 'rupture';
      case 'shield-pulse':
        return 'ward';
      default:
        return '';
    }
  }

  #setupCombatEventListener() {
    this.#combatEventUnsubscribe = combatEvents.subscribe((event) => {
      if (event && (event.type === 'damage' || event.type === 'heal')) {
        this.#createDamageFloater(event);
      }
    });
  }

  #createDamageFloater(event) {
    const { type, data } = event;
    const lane = data.lane;
    const lanePositions = {
      mountain: { x: 20, y: 20 },
      forest: { x: 20, y: 120 },
      river: { x: 20, y: 220 }
    };
    
    const basePos = lanePositions[lane] || { x: 20, y: 120 };
    const floater = {
      id: Date.now() + Math.random(),
      type: type,
      value: type === 'damage' ? data.damage : data.amount,
      x: basePos.x + Math.random() * 60 - 30, // Random offset
      y: basePos.y + Math.random() * 20 - 10,
      timestamp: Date.now()
    };

    this.damageFloaters = [...this.damageFloaters, floater];

    // Remove floater after animation completes
    setTimeout(() => {
      this.damageFloaters = this.damageFloaters.filter(f => f.id !== floater.id);
    }, 1500);
  }

  #statusTime(status, now) {
    if (!status || typeof now !== 'number') return '';
    if (status.type === 'delayed-damage' && status.triggerAt) {
      const remainingMs = status.triggerAt - now;
      const seconds = Math.ceil(remainingMs / 1000);
      return seconds > 0 ? `${seconds}s` : '0s';
    }
    const expiresAt = status.expiresAt
      ?? (status.appliedAt && status.durationMs ? status.appliedAt + status.durationMs : undefined);
    if (!expiresAt || !Number.isFinite(expiresAt)) {
      return '';
    }
    const remainingMs = expiresAt - now;
    const seconds = Math.ceil(remainingMs / 1000);
    if (!Number.isFinite(seconds)) return '';
    return seconds > 0 ? `${seconds}s` : '0s';
  }

  #now() {
    return typeof performance !== 'undefined' && performance.now
      ? performance.now()
      : Date.now();
  }

  render() {
    const combosMap = this.#comboMap();
    const now = this.#now();
    
    // Calculate terrain rotation countdown and urgency
    const rotationCountdown = Math.max(
      0,
      Math.round((this.state?.nextTerrainAt - now) / 1000)
    );
    
    let countdownClasses = ['terrain-countdown'];
    let countdownDisplayClasses = ['countdown-display'];
    
    if (rotationCountdown <= 10) {
      countdownClasses.push('urgent');
      countdownDisplayClasses.push('urgent');
    } else if (rotationCountdown <= 20) {
      countdownClasses.push('warning');
      countdownDisplayClasses.push('warning');
    }
    
    // Get current terrain info
    const currentTerrain = this.state?.activeTerrain;
    const terrainData = {
      mountain: { name: 'Mountain Path', effect: 'Direct damage +1' },
      forest: { name: 'Forest Grove', effect: 'Stealth units +1 duration' },
      river: { name: 'River Valley', effect: 'Flow effects trigger twice' }
    };
    const activeTerrainInfo = terrainData[currentTerrain] || { name: 'Unknown', effect: '' };
    
    return html`
      <div class="canvas-wrapper">
        <canvas></canvas>
        <div class="overlay">
          <div class="${countdownClasses.join(' ')}">
            <div class="terrain-info">
              <div class="terrain-name">${activeTerrainInfo.name}</div>
              <div class="terrain-effect">${activeTerrainInfo.effect}</div>
            </div>
            <div class="${countdownDisplayClasses.join(' ')}">
              ${rotationCountdown}s
            </div>
          </div>
          <div class="lane-info">
            ${['mountain', 'forest', 'river'].map((lane) => {
              const strongholds = (this.state?.strongholds ?? []).filter((s) => s.lane === lane);
              const laneState = this.state?.battlefield?.[lane] ?? { player: [], ai: [] };
              const playerStronghold = strongholds.find((s) => s.owner === 'player');
              const aiStronghold = strongholds.find((s) => s.owner === 'ai');
              const playerFront = laneState.player[0];
              const aiFront = laneState.ai[0];
              const pendingEntry = (this.state?.comboState?.pending ?? []).find(
                (entry) => entry.lane === lane
              );
              const lastCombo = this.#laneLastCombo(lane);
              const pendingExpiresAt = pendingEntry?.expiresAt ?? 0;
              const pendingSeconds =
                pendingEntry && pendingExpiresAt
                  ? Math.max(0, Math.ceil((pendingExpiresAt - now) / 1000))
                  : pendingEntry
                    ? 0
                    : null;
              const pendingChipClasses = ['combo-chip', 'warning'];
              if (pendingSeconds !== null && pendingSeconds <= 2) {
                pendingChipClasses.push('urgent');
              }
              const enemyMarks = laneState.ai.filter((unit) =>
                (unit.status ?? []).some((status) => status.type === 'delayed-damage')
              ).length;
              const allyMarks = laneState.player.filter((unit) =>
                (unit.status ?? []).some((status) => status.type === 'delayed-damage')
              ).length;
              const allyAura = laneState.player.some((unit) =>
                (unit.status ?? []).some((status) => status.type === 'aura')
              );
              const enemyAura = laneState.ai.some((unit) =>
                (unit.status ?? []).some((status) => status.type === 'aura')
              );
              const enemyRuptures = laneState.ai.filter((unit) =>
                (unit.status ?? []).some((status) => status.type === 'rupture')
              ).length;
              const allyRuptures = laneState.player.filter((unit) =>
                (unit.status ?? []).some((status) => status.type === 'rupture')
              ).length;
              const allyWards = laneState.player.filter((unit) =>
                (unit.status ?? []).some((status) => status.type === 'shield-pulse')
              ).length;
              const enemyWards = laneState.ai.filter((unit) =>
                (unit.status ?? []).some((status) => status.type === 'shield-pulse')
              ).length;
              const laneTags = [];
              if (enemyMarks) {
                laneTags.push(html`<span class="status-tag mark">AI Mark ×${enemyMarks}</span>`);
              }
              if (allyMarks) {
                laneTags.push(html`<span class="status-tag mark">Ally Mark ×${allyMarks}</span>`);
              }
              if (enemyRuptures) {
                laneTags.push(html`<span class="status-tag rupture">AI Rupture ×${enemyRuptures}</span>`);
              }
              if (allyRuptures) {
                laneTags.push(html`<span class="status-tag rupture">Ally Rupture ×${allyRuptures}</span>`);
              }
              if (allyAura) {
                laneTags.push(html`<span class="status-tag aura">Aura</span>`);
              }
              if (enemyAura) {
                laneTags.push(html`<span class="status-tag aura">AI Aura</span>`);
              }
              if (allyWards) {
                laneTags.push(html`<span class="status-tag ward">Ward ×${allyWards}</span>`);
              }
              if (enemyWards) {
                laneTags.push(html`<span class="status-tag ward">AI Ward ×${enemyWards}</span>`);
              }
              const laneClasses = [
                'lane',
                this.state?.activeTerrain === lane ? 'active' : '',
                this.selectedLane === lane ? 'selected' : '',
                pendingEntry ? 'pending' : ''
              ]
                .filter(Boolean)
                .join(' ');
              return html`
                <div class="${laneClasses}" @click=${() => this.#selectLane(lane)}>
                  <div class="lane-header">
                    <span>${lane.toUpperCase()}</span>
                    <span>P:${laneState.player.length} · AI:${laneState.ai.length}</span>
                  </div>
                  <div class="lane-row subtle">
                    <span>Strongholds</span>
                    <span>P ${playerStronghold?.health ?? '-'} · AI ${aiStronghold?.health ?? '-'}</span>
                  </div>
                  <div class="lane-row subtle">
                    <span>Frontline</span>
                    <span>
                      ${playerFront ? playerFront.name : '—'} vs ${aiFront ? aiFront.name : '—'}
                    </span>
                  </div>
                  ${playerFront || aiFront
                    ? html`<div class="lane-row detail">
                        <div class="front player">
                          ${this.#renderHealthBar(playerFront, 'player')}
                          ${this.#renderStatusTags(playerFront, now)}
                        </div>
                        <div class="front ai">
                          ${this.#renderHealthBar(aiFront, 'ai')}
                          ${this.#renderStatusTags(aiFront, now)}
                        </div>
                      </div>`
                    : null}
                  ${laneTags.length
                    ? html`<div class="lane-row subtle effects">
                        <span>Lane FX</span>
                        <div class="status-tags">
                          ${laneTags}
                        </div>
                      </div>`
                    : null}
                  ${pendingEntry
                    ? html`<div class="lane-row alert">
                        <span>Combo Window</span>
                        <span class="${pendingChipClasses.join(' ')}">
                          ${combosMap.get(pendingEntry.comboId)?.name ?? pendingEntry.comboId}
                          (${pendingSeconds ?? 0}s)
                        </span>
                      </div>`
                    : lastCombo
                      ? html`<div class="lane-row subtle">
                          <span>Last Combo</span>
                          <span class="combo-chip">
                            ${combosMap.get(lastCombo.comboId)?.name ?? lastCombo.comboId}
                          </span>
                        </div>`
                      : null}
                </div>
              `;
            })}
          </div>
          <div class="controls">
            <button @click=${() => this.dispatchEvent(new CustomEvent('exit'))}>
              Exit Match
            </button>
          </div>
        </div>
        <div class="damage-floaters">
          ${this.damageFloaters.map(floater => html`
            <div 
              class="damage-floater ${floater.type}" 
              style="left: ${floater.x}px; top: ${floater.y}px;"
            >
              ${floater.type === 'damage' ? '-' : '+'}${floater.value}
            </div>
          `)}
        </div>
      </div>
    `;
  }
}

customElements.define('ninja-battle-canvas', NinjaBattleCanvas);
