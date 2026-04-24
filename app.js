import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { loadCarAt, buildGround } from './car.js';
import { initPanels, closePanel } from './panels.js';
import { initCockpitInteraction, setCockpitEnabled } from './cockpit.js';

// ============================================
// CAR DATA
// ============================================

const CARS = [
  {
    model: 'lego_man/scene.gltf',
    category: 'skills',
    name: 'Skills & Expertise',
    subtitle: 'What I Work With',
    award: '',
    desc: 'AI/ML engineering, full-stack development, and cloud infrastructure. Focused on building production-ready intelligent systems.',
    tags: ['Python', 'LangGraph', 'RAG', 'AWS', 'Next.js', 'Three.js', 'Flask', 'Docker', 'XGBoost', 'Deep Learning'],
    github: null,
    video: null,
    position: { x: 0, y: 0, z: 8 },
    rotation: 0.0,
    scale: 0.8,
    cockpit: { posX: 0, posY: 0.3, posZ: 9.0, lookY: 0.2, lookZ: 0 },
  },
  {
    model: '2016_pagani_huayra_bc/scene.gltf',
    category: 'project',
    name: 'Roomie',
    subtitle: 'AI Interior Designer',
    award: 'Sophiie Hackathon 2026 \u00b7 5th / 15',
    desc: "Upload a photo of your room and Roomie's AI agent autonomously finds matching furniture on Facebook Marketplace, compares prices, and messages sellers on your behalf.",
    tags: ['LangGraph', 'GPT-4 Vision', 'AI Agents', 'Python'],
    github: 'https://github.com/JasMatharu/roomie',
    video: 'https://www.youtube.com/embed/0mxCZzDBado',
    videoPos: { left: '51%', top: '84%' },
    position: { x: -3, y: 0, z: 5 },
    rotation: -0.3,
    cockpit: { posX: -0.005, posY: 0.20, posZ: 0, lookY: 0.15, lookZ: 0.4 },
  },
  {
    model: '2020_aston_martin_vantage_59_amr.glb',
    category: 'project',
    projects: [
      {
        name: 'Auto Exam Scheduler',
        subtitle: 'University Exam Scheduling',
        award: 'Mar \u2013 Jun 2025',
        desc: 'Co-built and load-tested the backend for a university exam scheduling system handling room allocation and invigilator assignments, deployed on AWS with auto-scaling (1\u20134 instances) achieving 99.9% uptime.',
        tags: ['AWS', 'Auto-scaling', 'Load Testing'],
        github: 'https://github.com/CSSE6400/2025_P2_Auto_Exam_Scheduling',
      },
      {
        name: 'Detecting Melanoma',
        subtitle: 'Medical Image Classification',
        award: 'Sep \u2013 Nov 2025',
        desc: 'Implemented and fine-tuned a Siamese network to classify the ISIC 2020 Kaggle Challenge dataset and achieved 80% accuracy despite a severe 98:2 class imbalance.',
        tags: ['Deep Learning', 'Siamese Networks', 'Python'],
        github: null,
      },
    ],
    video: 'https://www.youtube.com/embed/lLBdEXCamtU',
    videoPos: { left: '51%', top: '56%' },
    position: { x: 3, y: 0, z: 5 },
    rotation: -0.5,
    cockpit: { posX: -0.01, posY: 0.35, posZ: -0.18, lookY: 0.10, lookZ: 0.4 },
  },
  {
    model: '2010_lamborghini_murcielago_lp670-4_superveloce/scene.gltf',
    category: 'project',
    name: 'Valorant Match Predictor',
    subtitle: 'Esports ML Prediction',
    award: 'UQCS Hackathon 2024 \u00b7 People\'s Choice Award',
    desc: 'Built a match outcome predictor for Valorant using a gradient boosting model (Python, XGBoost) achieving 82% accuracy.',
    tags: ['Python', 'XGBoost', 'ML'],
    github: 'https://github.com/jass420',
    video: 'https://www.youtube.com/embed/p7RATnINbfk',
    videoPos: { left: '52%', top: '90%' },
    position: { x: 8, y: 0, z: 3 },
    rotation: 0.5,
    cockpit: { posX: -0.05, posY: 0.25, posZ: -0.06, lookY: 0.10, lookZ: 0.4 },

  },
  {
    model: '2012_aston_martin_vantage_gte/scene.gltf',
    category: 'work',
    projects: [
      {
        name: 'Gradianza AI',
        subtitle: 'AI Receptionist Platform',
        award: 'Nov 2025 \u2013 Present',
        desc: 'Architecting an AI-powered receptionist handling bookings for hotels and restaurants. Currently deployed and scaled to handle hundreds of calls per day. Built custom agents and a RAG pipeline with full privacy.',
        tags: ['AI Agents', 'RAG', 'LangGraph', 'Voice AI'],
        github: null,
      },
      {
        name: 'The Diet Science',
        subtitle: 'AI-Powered Nutritionist',
        award: 'Feb 2026 \u2013 Present',
        desc: 'Architecting an AI-powered nutritionist using RAG with Pinecone and OpenAI to retrieve personalised nutrition information via a LangGraph agent; currently in trial with 15 users.',
        tags: ['RAG', 'Pinecone', 'OpenAI', 'LangGraph', 'Python'],
        github: null,
      },
    ],
    video: null,
    position: { x: 4, y: 0, z: -6 },
    rotation: 0.3,
    cockpit: { posX: -0.01, posY: 0.35, posZ: -0.18, lookY: 0.10, lookZ: 0.4 },

  },
  {
    model: '1991_rwb_porsche_911_964/scene.gltf',
    category: 'work',
    projects: [
      {
        name: 'Heuris Tech',
        subtitle: 'Co-founder & AI Engineer \u00b7 UQ ilab accelerator',
        award: 'Mar 2025 \u2013 Present',
        desc: 'Contributed to building a LangGraph-based sales automation agent at useoven.com, reducing manual outreach tasks by 90%.',
        tags: ['LangGraph', 'Sales AI', 'Automation'],
        github: null,
      },
      {
        name: 'Webcom',
        subtitle: 'App Developer',
        award: 'Dec 2024 \u2013 Feb 2025',
        desc: 'Developed and deployed an internal Flutter app for real estate listings; improved app performance by 30%.',
        tags: ['Flutter', 'Dart', 'Mobile'],
        github: null,
      },
      {
        name: 'Academic Tutor',
        subtitle: 'University of Queensland',
        award: 'Feb 2025 \u2013 Jun 2025',
        desc: 'Facilitated tutorials and practicals for second-year CS students in Theory of Computing (COMP2048).',
        tags: ['Teaching', 'Theory of Computing'],
        github: null,
      },
    ],
    video: null,
    position: { x: -4, y: 0, z: -6 },
    rotation: 0.4,
  },
];

let currentCarIndex = 0;

// ============================================
// STATE
// ============================================

let state = 'LOADING'; // LOADING | EXTERIOR | TRANSITIONING | COCKPIT
let scene, camera, renderer, controls;
let carDataArray = [];
let scrollCooldown = false;
let tutorialOpen = false;

// Camera targets
const SHOWROOM_CAM = { x: 0, y: 6, z: 16 };
const SHOWROOM_TARGET = { x: 0, y: 0, z: -1 };

let cockpitBasePosition = new THREE.Vector3();
let cockpitLookTarget = new THREE.Vector3();

// Raycaster for clicking cars
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// ============================================
// INIT
// ============================================

async function init() {
  const container = document.getElementById('canvas-container');
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f0f5);
  scene.fog = new THREE.FogExp2(0xf0f0f5, 0.02);

  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.05,
    100
  );
  camera.position.set(SHOWROOM_CAM.x, SHOWROOM_CAM.y, SHOWROOM_CAM.z);
  camera.lookAt(SHOWROOM_TARGET.x, SHOWROOM_TARGET.y, SHOWROOM_TARGET.z);

  setupLighting();

  // OrbitControls — limited panning, no auto-rotate
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.autoRotate = false;
  controls.maxPolarAngle = Math.PI / 2.1;
  controls.minPolarAngle = 0.2;
  controls.maxDistance = 28;
  controls.minDistance = 8;
  controls.target.set(SHOWROOM_TARGET.x, SHOWROOM_TARGET.y, SHOWROOM_TARGET.z);
  controls.enablePan = false;
  controls.enableZoom = false;

  // Build ground
  buildGround(scene);

  // Load all 3 cars in parallel
  try {
    const loadPromises = CARS.map((car, i) =>
      loadCarAt(
        scene,
        car.model,
        new THREE.Vector3(car.position.x, car.position.y, car.position.z),
        car.rotation,
        `car_${i}`,
        i === 0 ? onLoadProgress : null,
        car.scale
      )
    );
    carDataArray = await Promise.all(loadPromises);
    onModelLoaded();
  } catch (err) {
    console.error('Failed to load cars:', err);
    document.querySelector('.loader-subtitle').textContent = 'Failed to load 3D models';
  }

  initPanels({});
  initCockpitInteraction();

  window.addEventListener('resize', onResize);

  // Click on a car to enter it
  renderer.domElement.addEventListener('click', onCanvasClick);

  // HUD exit button
  document.getElementById('exit-btn').addEventListener('click', exitCar);

  // Scroll to navigate through cars sequentially
  container.addEventListener('wheel', (e) => {
    if (tutorialOpen) {
      e.preventDefault();
      return;
    }
    if (scrollCooldown) return;

    if (e.deltaY > 50) {
      // Scroll down — forward
      if (state === 'EXTERIOR') {
        currentCarIndex = 0;
        enterCar();
      } else if (state === 'COCKPIT') {
        transitionToNextCar();
      }
    } else if (e.deltaY < -50) {
      // Scroll up — backward
      if (state === 'COCKPIT') {
        transitionToPrevCar();
      }
    }
  });

  // Mobile fallback buttons
  document.querySelectorAll('.mobile-nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const panelId = btn.dataset.panel;
      if (panelId) {
        import('./panels.js').then(({ openPanel }) => openPanel(panelId));
      }
    });
  });

  animate();
}

// ============================================
// LIGHTING
// ============================================

function setupLighting() {
  const ambient = new THREE.AmbientLight(0xffffff, 1.8);
  scene.add(ambient);

  const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
  keyLight.position.set(5, 8, 5);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = 1024;
  keyLight.shadow.mapSize.height = 1024;
  keyLight.shadow.camera.near = 0.5;
  keyLight.shadow.camera.far = 25;
  keyLight.shadow.camera.left = -10;
  keyLight.shadow.camera.right = 10;
  keyLight.shadow.camera.top = 10;
  keyLight.shadow.camera.bottom = -10;
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xc8c8ff, 1.0);
  fillLight.position.set(-3, 2, -3);
  scene.add(fillLight);

  const accentLight = new THREE.PointLight(0x7c3aed, 0.4, 10);
  accentLight.position.set(0, 0.1, 0);
  scene.add(accentLight);

  // Cockpit interior lights (start dim)
  const cockpitLight = new THREE.PointLight(0xffffff, 0.0, 5);
  cockpitLight.position.set(0, 1.2, 0.3);
  cockpitLight.name = 'cockpit_light';
  scene.add(cockpitLight);

  const cockpitFill = new THREE.PointLight(0xffffff, 0.0, 4);
  cockpitFill.position.set(0, 1.0, -0.2);
  cockpitFill.name = 'cockpit_fill';
  scene.add(cockpitFill);

  const dashLight = new THREE.PointLight(0xfff5e6, 0.0, 3);
  dashLight.position.set(0, 0.8, 0.5);
  dashLight.name = 'dash_light';
  scene.add(dashLight);
}

// ============================================
// LOADING
// ============================================

function onLoadProgress(fraction) {
  const pct = Math.round(fraction * 100);
  const bar = document.getElementById('loader-bar');
  const percent = document.getElementById('loader-percent');
  if (bar) bar.style.width = pct + '%';
  if (percent) percent.textContent = pct + '%';
}

function onModelLoaded() {
  onLoadProgress(1);

  const isMobile = window.innerWidth < 768;
  if (isMobile) {
    document.getElementById('mobile-fallback').classList.add('visible');
    document.getElementById('loading-screen').classList.add('fade-out');
    setTimeout(() => {
      document.getElementById('loading-screen').style.display = 'none';
    }, 800);
    state = 'EXTERIOR';
    return;
  }

  setTimeout(() => {
    document.getElementById('loading-screen').classList.add('fade-out');
    setTimeout(() => {
      document.getElementById('loading-screen').style.display = 'none';
    }, 800);
    document.getElementById('hero-overlay').classList.remove('hidden');
    createCarLabels();
    initTutorial();
    state = 'EXTERIOR';
  }, 600);
}

// ============================================
// CLICK TO ENTER CAR
// ============================================

function onCanvasClick(event) {
  if (state !== 'EXTERIOR') return;

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);

  for (const hit of intersects) {
    // Walk up to find which car_N group was clicked
    let obj = hit.object;
    while (obj) {
      if (obj.name && obj.name.startsWith('car_')) {
        const index = parseInt(obj.name.split('_')[1], 10);
        if (!isNaN(index) && index < CARS.length) {
          currentCarIndex = index;
          enterCar();
          return;
        }
      }
      obj = obj.parent;
    }
  }
}

// ============================================
// POPULATE OVERLAYS
// ============================================

function isLegoMan() {
  return CARS[currentCarIndex].model.includes('lego_man');
}

const WS_ORIGINAL_HTML = `
    <h2 class="ws-title"></h2>
    <p class="ws-subtitle"></p>
    <p class="ws-award"></p>
    <p class="ws-desc"></p>
    <div class="ws-tags"></div>
    <a href="#" target="_blank" rel="noopener" class="ws-github">View on GitHub &rarr;</a>`;

function populateOverlays() {
  const car = CARS[currentCarIndex];
  const wsInfo = document.getElementById('windscreen-info');

  if (isLegoMan()) {
    // Populate speech bubble
    document.querySelector('.sb-title').textContent = car.name;
    document.querySelector('.sb-desc').textContent = car.desc;
    document.querySelector('.sb-tags').innerHTML = car.tags.map((t) => `<span class="ws-tag">${t}</span>`).join('');
    return;
  }

  if (car.projects) {
    // Multi-project: side-by-side cards
    let html = '<div class="ws-projects-row">';
    car.projects.forEach((p) => {
      html += `<div class="ws-project-card">`;
      html += `<h2 class="ws-title">${p.name}</h2>`;
      html += `<p class="ws-subtitle">${p.subtitle}</p>`;
      if (p.award) html += `<p class="ws-award">${p.award}</p>`;
      html += `<p class="ws-desc">${p.desc}</p>`;
      html += `<div class="ws-tags">${p.tags.map(t => `<span class="ws-tag">${t}</span>`).join('')}</div>`;
      if (p.github) html += `<a href="${p.github}" target="_blank" rel="noopener" class="ws-github">View on GitHub &rarr;</a>`;
      html += `</div>`;
    });
    html += '</div>';
    wsInfo.innerHTML = html;
  } else {
    // Single project: restore original structure and populate
    wsInfo.innerHTML = WS_ORIGINAL_HTML;
    document.querySelector('.ws-title').textContent = car.name;
    document.querySelector('.ws-subtitle').textContent = car.subtitle;
    document.querySelector('.ws-award').textContent = car.award;
    document.querySelector('.ws-desc').textContent = car.desc;
    document.querySelector('.ws-tags').innerHTML = car.tags.map((t) => `<span class="ws-tag">${t}</span>`).join('');

    const githubLink = document.querySelector('.ws-github');
    if (car.github) {
      githubLink.href = car.github;
      githubLink.style.display = '';
    } else {
      githubLink.style.display = 'none';
    }
  }

  const dashVideo = document.getElementById('dash-video');
  const iframe = dashVideo.querySelector('iframe');
  if (car.video) {
    iframe.src = car.video;
    if (car.videoPos) {
      dashVideo.style.left = car.videoPos.left;
      dashVideo.style.top = car.videoPos.top;
    } else {
      dashVideo.style.left = '52%';
      dashVideo.style.top = '90%';
    }
    dashVideo.classList.add('visible');
  } else {
    iframe.src = '';
    dashVideo.classList.remove('visible');
  }
}

function showOverlay() {
  if (isLegoMan()) {
    document.getElementById('speech-bubble').classList.add('visible');
  } else {
    document.getElementById('windscreen-info').classList.add('visible');
  }
}

function hideOverlays() {
  document.getElementById('windscreen-info').classList.remove('visible');
  document.getElementById('speech-bubble').classList.remove('visible');
  document.getElementById('dash-video').classList.remove('visible');
}

// ============================================
// ENTER / EXIT CAR
// ============================================

function recomputeBounds(index) {
  const data = carDataArray[index];
  const box = new THREE.Box3().setFromObject(data.model);
  data.modelCenter = box.getCenter(new THREE.Vector3());
  data.modelSize = box.getSize(new THREE.Vector3());
}

function setCockpitPosition(index) {
  const mc = carDataArray[index].modelCenter;
  const ms = carDataArray[index].modelSize;
  const c = CARS[index].cockpit;

  // Use per-car overrides if available, otherwise defaults
  const posX = c?.posX ?? -0.005;
  const posY = c?.posY ?? 0.20;
  const posZ = c?.posZ ?? 0;
  const lookY = c?.lookY ?? 0.15;
  const lookZ = c?.lookZ ?? 0.4;

  cockpitBasePosition.set(
    mc.x - ms.x * posX,
    mc.y + ms.y * posY,
    mc.z + ms.z * posZ
  );
  cockpitLookTarget.set(
    mc.x,
    mc.y + ms.y * lookY,
    mc.z + ms.z * lookZ
  );
}

function enterCar() {
  if (state !== 'EXTERIOR') return;
  state = 'TRANSITIONING';
  scrollCooldown = true;

  document.getElementById('hero-overlay').classList.add('hidden');
  document.getElementById('car-labels').classList.add('hidden');

  controls.enabled = false;

  const data = carDataArray[currentCarIndex];
  const carModel = data.model;

  // Use initial bounds for approach animation
  const modelCenter = data.modelCenter;
  const modelSize = data.modelSize;

  const cockpitLight = scene.getObjectByName('cockpit_light');
  const cockpitFill = scene.getObjectByName('cockpit_fill');
  const dashLight = scene.getObjectByName('dash_light');

  const timeline = gsap.timeline({
    onComplete: () => {
      state = 'COCKPIT';
      scrollCooldown = false;
      setCockpitEnabled(true);

      document.getElementById('cockpit-hud').classList.add('visible');

      populateOverlays();
      showOverlay();

      if (cockpitLight) gsap.to(cockpitLight, { intensity: 5.0, duration: 0.3 });
      if (cockpitFill) gsap.to(cockpitFill, { intensity: 3.0, duration: 0.3 });
      if (dashLight) gsap.to(dashLight, { intensity: 2.0, duration: 0.3 });
    },
  });

  // Step 1: Approach from side + rotate car to face forward
  timeline.to(camera.position, {
    x: modelCenter.x - modelSize.x * 0.6,
    y: modelCenter.y + modelSize.y * 0.3,
    z: modelCenter.z + modelSize.z * 0.1,
    duration: 0.6,
    ease: 'power2.out',
  });

  timeline.to(carModel.rotation, {
    y: 0,
    duration: 0.6,
    ease: 'power2.out',
    onComplete: () => {
      // Recompute bounds now that car faces forward
      recomputeBounds(currentCarIndex);
      setCockpitPosition(currentCarIndex);

      const mc = carDataArray[currentCarIndex].modelCenter;
      if (cockpitLight) cockpitLight.position.set(mc.x, mc.y + 0.5, mc.z + 0.3);
      if (cockpitFill) cockpitFill.position.set(mc.x, mc.y + 0.3, mc.z - 0.2);
      if (dashLight) dashLight.position.set(mc.x, mc.y + 0.1, mc.z + 0.5);
    },
  }, 0); // Start at the same time as camera approach

  // Step 2: Slide into cockpit (uses dynamically set cockpitBasePosition)
  timeline.to(camera.position, {
    x: () => cockpitBasePosition.x,
    y: () => cockpitBasePosition.y,
    z: () => cockpitBasePosition.z,
    duration: 0.7,
    ease: 'power3.inOut',
  });

  timeline.to(controls.target, {
    x: () => cockpitLookTarget.x,
    y: () => cockpitLookTarget.y,
    z: () => cockpitLookTarget.z,
    duration: 0.7,
    ease: 'power3.inOut',
  }, '-=0.7');
}

function exitCar() {
  if (state !== 'COCKPIT') return;
  state = 'TRANSITIONING';
  scrollCooldown = true;

  closePanel();

  document.getElementById('cockpit-hud').classList.remove('visible');
  hideOverlays();
  setCockpitEnabled(false);

  const iframe = document.querySelector('#dash-video iframe');
  if (iframe) iframe.src = '';

  const cockpitLight = scene.getObjectByName('cockpit_light');
  const cockpitFill = scene.getObjectByName('cockpit_fill');
  const dashLight = scene.getObjectByName('dash_light');
  if (cockpitLight) gsap.to(cockpitLight, { intensity: 0, duration: 0.3 });
  if (cockpitFill) gsap.to(cockpitFill, { intensity: 0, duration: 0.3 });
  if (dashLight) gsap.to(dashLight, { intensity: 0, duration: 0.3 });

  const carModel = carDataArray[currentCarIndex].model;
  const originalRotation = CARS[currentCarIndex].rotation;

  const timeline = gsap.timeline({
    onComplete: () => {
      recomputeBounds(currentCarIndex);
      state = 'EXTERIOR';
      scrollCooldown = false;
      controls.enabled = true;
      document.getElementById('hero-overlay').classList.remove('hidden');
      document.getElementById('car-labels').classList.remove('hidden');
    },
  });

  timeline.to(camera.position, {
    x: SHOWROOM_CAM.x, y: SHOWROOM_CAM.y, z: SHOWROOM_CAM.z,
    duration: 0.8,
    ease: 'power3.out',
  });

  timeline.to(controls.target, {
    x: SHOWROOM_TARGET.x, y: SHOWROOM_TARGET.y, z: SHOWROOM_TARGET.z,
    duration: 0.8,
    ease: 'power3.out',
  }, '-=0.8');

  // Rotate car back to showroom angle
  timeline.to(carModel.rotation, {
    y: originalRotation,
    duration: 0.8,
    ease: 'power3.out',
  }, 0);
}

function exitCarThenEnter(nextIndex) {
  if (state !== 'COCKPIT') return;
  state = 'TRANSITIONING';
  scrollCooldown = true;

  closePanel();

  document.getElementById('cockpit-hud').classList.remove('visible');
  hideOverlays();
  setCockpitEnabled(false);

  const iframe = document.querySelector('#dash-video iframe');
  if (iframe) iframe.src = '';

  const cockpitLight = scene.getObjectByName('cockpit_light');
  const cockpitFill = scene.getObjectByName('cockpit_fill');
  const dashLight = scene.getObjectByName('dash_light');
  if (cockpitLight) gsap.to(cockpitLight, { intensity: 0, duration: 0.3 });
  if (cockpitFill) gsap.to(cockpitFill, { intensity: 0, duration: 0.3 });
  if (dashLight) gsap.to(dashLight, { intensity: 0, duration: 0.3 });

  const carModel = carDataArray[currentCarIndex].model;
  const carCenter = carDataArray[currentCarIndex].modelCenter;
  const originalRotation = CARS[currentCarIndex].rotation;

  const timeline = gsap.timeline({
    onComplete: () => {
      recomputeBounds(currentCarIndex);
      state = 'EXTERIOR';
      controls.enabled = true;
      // Now enter the next car
      currentCarIndex = nextIndex;
      enterCar();
    },
  });

  timeline.to(camera.position, {
    x: SHOWROOM_CAM.x, y: SHOWROOM_CAM.y, z: SHOWROOM_CAM.z,
    duration: 0.7,
    ease: 'power3.out',
  });

  timeline.to(controls.target, {
    x: carCenter.x, y: carCenter.y, z: carCenter.z,
    duration: 0.7,
    ease: 'power3.out',
  }, '-=0.7');

  timeline.to(carModel.rotation, {
    y: originalRotation,
    duration: 0.7,
    ease: 'power3.out',
  }, 0);
}

function transitionToNextCar() {
  if (state !== 'COCKPIT') return;
  const nextIndex = currentCarIndex + 1;
  if (nextIndex >= CARS.length) {
    exitCar();
    return;
  }
  exitCarThenEnter(nextIndex);
}

function transitionToPrevCar() {
  if (state !== 'COCKPIT') return;
  const prevIndex = currentCarIndex - 1;
  if (prevIndex < 0) {
    exitCar();
    return;
  }
  exitCarThenEnter(prevIndex);
}

// ============================================
// FLOATING CAR LABELS
// ============================================

function initTutorial() {
  const overlay = document.getElementById('tutorial-overlay');
  const dismissBtn = document.getElementById('tutorial-dismiss');
  const helpBtn = document.getElementById('help-btn');

  const showTutorial = () => {
    overlay.classList.remove('hidden');
    tutorialOpen = true;
  };

  const hideTutorial = () => {
    overlay.classList.add('hidden');
    tutorialOpen = false;
  };

  if (!localStorage.getItem('tutorialDismissed')) {
    showTutorial();
  }

  dismissBtn.addEventListener('click', () => {
    hideTutorial();
    localStorage.setItem('tutorialDismissed', 'true');
  });

  helpBtn.addEventListener('click', showTutorial);

  // Click backdrop outside card dismisses (without setting localStorage flag)
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) hideTutorial();
  });
}

// Section header world positions (computed after models load)
function createCarLabels() {
  const container = document.getElementById('car-labels');

  // Create fixed section headers
  const projectsHeader = document.createElement('div');
  projectsHeader.className = 'section-header section-header--projects';
  projectsHeader.textContent = 'Projects';
  container.appendChild(projectsHeader);

  const workHeader = document.createElement('div');
  workHeader.className = 'section-header section-header--work';
  workHeader.textContent = 'Work Experience';
  container.appendChild(workHeader);

  // Create car labels
  CARS.forEach((car, i) => {
    const card = document.createElement('div');
    card.className = 'car-label';
    card.dataset.index = i;

    if (car.projects) {
      card.innerHTML = car.projects.map(p =>
        `<span class="cl-name">${p.name}</span>`
      ).join('<span class="cl-divider">&middot;</span>');
    } else {
      card.innerHTML = `<span class="cl-name">${car.name}</span>`;
      if (car.subtitle) card.innerHTML += `<br><span class="cl-sub">${car.subtitle}</span>`;
    }

    card.addEventListener('click', () => {
      if (state !== 'EXTERIOR') return;
      currentCarIndex = i;
      enterCar();
    });

    container.appendChild(card);
  });
}

function updateCarLabels() {
  // Update car labels
  const labels = document.querySelectorAll('.car-label');
  labels.forEach((label, i) => {
    const data = carDataArray[i];
    if (!data) { label.style.display = 'none'; return; }

    const pos = data.modelCenter.clone();
    pos.y += data.modelSize.y * 0.6;

    pos.project(camera);

    const x = (pos.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-pos.y * 0.5 + 0.5) * window.innerHeight;

    if (pos.z > 1) { label.style.display = 'none'; return; }

    label.style.display = '';
    label.style.transform = `translate(-50%, -100%) translate(${x}px, ${y}px)`;
  });
}

// ============================================
// RENDER LOOP
// ============================================

function animate() {
  requestAnimationFrame(animate);

  if (state === 'EXTERIOR' && controls.enabled) {
    controls.update();
    updateCarLabels();
  }

  if (state === 'COCKPIT') {
    camera.lookAt(cockpitLookTarget);
  }

  if (state === 'TRANSITIONING') {
    camera.lookAt(controls.target);
  }

  renderer.render(scene, camera);
}

// ============================================
// RESIZE
// ============================================

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// ============================================
// START
// ============================================

init();
