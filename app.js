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
    name: 'Skills & Expertise',
    subtitle: 'What I Work With',
    award: '',
    desc: 'AI/ML engineering, full-stack development, and cloud infrastructure. Focused on building production-ready intelligent systems.',
    tags: ['Python', 'LangGraph', 'RAG', 'AWS', 'Next.js', 'Three.js', 'Flask', 'Docker', 'XGBoost', 'Deep Learning'],
    github: null,
    video: null,
    position: { x: 0, y: 0, z: 2 },
    rotation: 0.0,
    scale: 0.8,
    cockpit: { posX: 0, posY: 0.3, posZ: 4.0, lookY: 0.2, lookZ: 0 },
  },
  {
    model: '2016_pagani_huayra_bc/scene.gltf',
    name: 'Roomie',
    subtitle: 'AI Interior Designer',
    award: 'Sophiie Hackathon 2026 \u00b7 5th / 15',
    desc: "Upload a photo of your room and Roomie's AI agent autonomously finds matching furniture on Facebook Marketplace, compares prices, and messages sellers on your behalf.",
    tags: ['LangGraph', 'GPT-4 Vision', 'AI Agents', 'Python'],
    github: 'https://github.com/JasMatharu/roomie',
    video: 'https://www.youtube.com/embed/0mxCZzDBado',
    position: { x: 0, y: 0, z: -5 },
    rotation: -0.3,
    cockpit: { posX: -0.005, posY: 0.20, posZ: 0, lookY: 0.15, lookZ: 0.4 },
  },
  {
    model: '1991_rwb_porsche_911_964/scene.gltf',
    name: 'Auto Exam Scheduler',
    subtitle: 'University Exam Scheduling',
    award: 'Mar \u2013 Jun 2025',
    desc: 'Co-built and load-tested the backend for a university exam scheduling system handling room allocation and invigilator assignments, deployed on AWS with auto-scaling (1\u20134 instances) achieving 99.9% uptime.',
    tags: ['AWS', 'Auto-scaling', 'Load Testing'],
    github: 'https://github.com/CSSE6400/2025_P2_Auto_Exam_Scheduling',
    video: null,
    position: { x: -4, y: 0, z: -2 },
    rotation: 0.4,
  },
  {
    model: '2012_aston_martin_vantage_gte/scene.gltf',
    name: 'Detecting Melanoma',
    subtitle: 'Medical Image Classification',
    award: 'Sep \u2013 Nov 2025',
    desc: 'Implemented and fine-tuned a Siamese network to classify the ISIC 2020 Kaggle Challenge dataset and achieved 80% accuracy despite a severe 98:2 class imbalance.',
    tags: ['Deep Learning', 'Siamese Networks', 'Python'],
    github: null,
    video: null,
    position: { x: 4, y: 0, z: -1.5 },
    rotation: -0.5,
    cockpit: { posX: -0.005, posY: 0.15, posZ: -0.1, lookY: 0.10, lookZ: 0.4 },
  },
  {
    model: 'bmw_m3_coupe_e30_1986/scene.gltf',
    name: 'Research Paper Link Explorer',
    subtitle: 'Research Graph Backend',
    award: 'Sep \u2013 Nov 2025',
    desc: 'Developed a research paper graph generation backend using Flask and SQLAlchemy to help academics find complex relationships between papers through filters such as thematic similarity, citations, and co-authors.',
    tags: ['Flask', 'SQLAlchemy', 'OpenAlex', 'arXiv'],
    github: null,
    video: null,
    position: { x: -7, y: 0, z: -4 },
    rotation: 0.6,
  },
  {
    model: 'lancia_stratos_hf_-_rally_-_alitalia_livery.glb',
    name: 'Valorant Match Predictor',
    subtitle: 'Esports ML Prediction',
    award: 'UQCS Hackathon 2024 \u00b7 People\'s Choice Award',
    tags: ['Python', 'XGBoost', 'ML'],
    desc: 'Built a match outcome predictor for Valorant using a gradient boosting model (Python, XGBoost) achieving 82% accuracy.',
    github: 'https://github.com/jass420',
    video: null,
    position: { x: 7, y: 0, z: -3.5 },
    rotation: -0.4,
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

// Camera targets
const SHOWROOM_CAM = { x: 0, y: 6, z: 16 };
const SHOWROOM_TARGET = { x: 0, y: 0, z: -2 };

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
  controls.maxDistance = 24;
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

function populateOverlays() {
  const car = CARS[currentCarIndex];

  if (isLegoMan()) {
    // Populate speech bubble
    document.querySelector('.sb-title').textContent = car.name;
    document.querySelector('.sb-desc').textContent = car.desc;
    document.querySelector('.sb-tags').innerHTML = car.tags.map((t) => `<span class="ws-tag">${t}</span>`).join('');
    return;
  }

  // Populate windscreen overlay for cars
  document.querySelector('.ws-title').textContent = car.name;
  document.querySelector('.ws-subtitle').textContent = car.subtitle;
  document.querySelector('.ws-award').textContent = car.award;
  document.querySelector('.ws-desc').textContent = car.desc;

  const tagsContainer = document.querySelector('.ws-tags');
  tagsContainer.innerHTML = car.tags.map((t) => `<span class="ws-tag">${t}</span>`).join('');

  const githubLink = document.querySelector('.ws-github');
  if (car.github) {
    githubLink.href = car.github;
    githubLink.style.display = '';
  } else {
    githubLink.style.display = 'none';
  }

  const dashVideo = document.getElementById('dash-video');
  const iframe = dashVideo.querySelector('iframe');
  if (car.video) {
    iframe.src = car.video;
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

      if (cockpitLight) gsap.to(cockpitLight, { intensity: 5.0, duration: 0.5 });
      if (cockpitFill) gsap.to(cockpitFill, { intensity: 3.0, duration: 0.5 });
      if (dashLight) gsap.to(dashLight, { intensity: 2.0, duration: 0.5 });
    },
  });

  // Step 1: Approach from side + rotate car to face forward
  timeline.to(camera.position, {
    x: modelCenter.x - modelSize.x * 0.6,
    y: modelCenter.y + modelSize.y * 0.3,
    z: modelCenter.z + modelSize.z * 0.1,
    duration: 1.0,
    ease: 'power2.inOut',
  });

  timeline.to(carModel.rotation, {
    y: 0,
    duration: 1.0,
    ease: 'power2.inOut',
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
    duration: 1.2,
    ease: 'power3.inOut',
  });

  timeline.to(controls.target, {
    x: () => cockpitLookTarget.x,
    y: () => cockpitLookTarget.y,
    z: () => cockpitLookTarget.z,
    duration: 1.2,
    ease: 'power3.inOut',
  }, '-=1.2');
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
  if (cockpitLight) gsap.to(cockpitLight, { intensity: 0, duration: 0.5 });
  if (cockpitFill) gsap.to(cockpitFill, { intensity: 0, duration: 0.5 });
  if (dashLight) gsap.to(dashLight, { intensity: 0, duration: 0.5 });

  const carModel = carDataArray[currentCarIndex].model;
  const originalRotation = CARS[currentCarIndex].rotation;

  const timeline = gsap.timeline({
    onComplete: () => {
      recomputeBounds(currentCarIndex);
      state = 'EXTERIOR';
      scrollCooldown = false;
      controls.enabled = true;
      document.getElementById('hero-overlay').classList.remove('hidden');
    },
  });

  timeline.to(camera.position, {
    x: SHOWROOM_CAM.x, y: SHOWROOM_CAM.y, z: SHOWROOM_CAM.z,
    duration: 1.5,
    ease: 'power2.inOut',
  });

  timeline.to(controls.target, {
    x: SHOWROOM_TARGET.x, y: SHOWROOM_TARGET.y, z: SHOWROOM_TARGET.z,
    duration: 1.5,
    ease: 'power2.inOut',
  }, '-=1.5');

  // Rotate car back to showroom angle
  timeline.to(carModel.rotation, {
    y: originalRotation,
    duration: 1.5,
    ease: 'power2.inOut',
  }, 0);
}

function transitionToNextCar() {
  if (state !== 'COCKPIT') return;
  state = 'TRANSITIONING';
  scrollCooldown = true;

  // Hide current cockpit overlays
  document.getElementById('cockpit-hud').classList.remove('visible');
  hideOverlays();
  setCockpitEnabled(false);

  const iframe = document.querySelector('#dash-video iframe');
  if (iframe) iframe.src = '';

  // Dim cockpit lights
  const cockpitLight = scene.getObjectByName('cockpit_light');
  const cockpitFill = scene.getObjectByName('cockpit_fill');
  const dashLight = scene.getObjectByName('dash_light');
  if (cockpitLight) gsap.to(cockpitLight, { intensity: 0, duration: 0.5 });
  if (cockpitFill) gsap.to(cockpitFill, { intensity: 0, duration: 0.5 });
  if (dashLight) gsap.to(dashLight, { intensity: 0, duration: 0.5 });

  // Rotate current car back to showroom angle
  const prevCarModel = carDataArray[currentCarIndex].model;
  const prevOriginalRotation = CARS[currentCarIndex].rotation;

  currentCarIndex++;

  // After last car, return to showroom
  if (currentCarIndex >= CARS.length) {
    const timeline = gsap.timeline({
      onComplete: () => {
        recomputeBounds(currentCarIndex - 1);
        state = 'EXTERIOR';
        scrollCooldown = false;
        controls.enabled = true;
        document.getElementById('hero-overlay').classList.remove('hidden');
      },
    });

    timeline.to(camera.position, {
      x: SHOWROOM_CAM.x, y: SHOWROOM_CAM.y, z: SHOWROOM_CAM.z,
      duration: 1.5,
      ease: 'power2.inOut',
    });

    timeline.to(controls.target, {
      x: SHOWROOM_TARGET.x, y: SHOWROOM_TARGET.y, z: SHOWROOM_TARGET.z,
      duration: 1.5,
      ease: 'power2.inOut',
    }, '-=1.5');

    timeline.to(prevCarModel.rotation, {
      y: prevOriginalRotation,
      duration: 1.5,
      ease: 'power2.inOut',
    }, 0);

    return;
  }

  // Rotate next car to face forward, then recompute bounds and enter cockpit
  const nextCarModel = carDataArray[currentCarIndex].model;

  const timeline = gsap.timeline();

  // Phase 1: rotate both cars + move camera out slightly
  timeline.to(prevCarModel.rotation, {
    y: prevOriginalRotation,
    duration: 1.0,
    ease: 'power2.inOut',
    onComplete: () => recomputeBounds(currentCarIndex - 1),
  }, 0);

  timeline.to(nextCarModel.rotation, {
    y: 0,
    duration: 1.0,
    ease: 'power2.inOut',
    onComplete: () => {
      recomputeBounds(currentCarIndex);
      setCockpitPosition(currentCarIndex);

      const mc = carDataArray[currentCarIndex].modelCenter;
      if (cockpitLight) cockpitLight.position.set(mc.x, mc.y + 0.5, mc.z + 0.3);
      if (cockpitFill) cockpitFill.position.set(mc.x, mc.y + 0.3, mc.z - 0.2);
      if (dashLight) dashLight.position.set(mc.x, mc.y + 0.1, mc.z + 0.5);
    },
  }, 0);

  // Phase 2: Slide into next car's cockpit
  timeline.to(camera.position, {
    x: () => cockpitBasePosition.x,
    y: () => cockpitBasePosition.y,
    z: () => cockpitBasePosition.z,
    duration: 1.5,
    ease: 'power3.inOut',
    onComplete: () => {
      state = 'COCKPIT';
      scrollCooldown = false;
      setCockpitEnabled(true);

      document.getElementById('cockpit-hud').classList.add('visible');

      populateOverlays();
      showOverlay();

      if (cockpitLight) gsap.to(cockpitLight, { intensity: 5.0, duration: 0.5 });
      if (cockpitFill) gsap.to(cockpitFill, { intensity: 3.0, duration: 0.5 });
      if (dashLight) gsap.to(dashLight, { intensity: 2.0, duration: 0.5 });
    },
  });

  timeline.to(controls.target, {
    x: () => cockpitLookTarget.x,
    y: () => cockpitLookTarget.y,
    z: () => cockpitLookTarget.z,
    duration: 1.5,
    ease: 'power3.inOut',
  }, '-=1.5');
}

function transitionToPrevCar() {
  if (state !== 'COCKPIT') return;
  state = 'TRANSITIONING';
  scrollCooldown = true;

  // Hide current cockpit overlays
  document.getElementById('cockpit-hud').classList.remove('visible');
  hideOverlays();
  setCockpitEnabled(false);

  const iframe = document.querySelector('#dash-video iframe');
  if (iframe) iframe.src = '';

  // Dim cockpit lights
  const cockpitLight = scene.getObjectByName('cockpit_light');
  const cockpitFill = scene.getObjectByName('cockpit_fill');
  const dashLight = scene.getObjectByName('dash_light');
  if (cockpitLight) gsap.to(cockpitLight, { intensity: 0, duration: 0.5 });
  if (cockpitFill) gsap.to(cockpitFill, { intensity: 0, duration: 0.5 });
  if (dashLight) gsap.to(dashLight, { intensity: 0, duration: 0.5 });

  // Rotate current car back to showroom angle
  const prevCarModel = carDataArray[currentCarIndex].model;
  const prevOriginalRotation = CARS[currentCarIndex].rotation;

  currentCarIndex--;

  // Before first car, return to showroom
  if (currentCarIndex < 0) {
    currentCarIndex = 0;
    const timeline = gsap.timeline({
      onComplete: () => {
        recomputeBounds(currentCarIndex);
        state = 'EXTERIOR';
        scrollCooldown = false;
        controls.enabled = true;
        document.getElementById('hero-overlay').classList.remove('hidden');
      },
    });

    timeline.to(camera.position, {
      x: SHOWROOM_CAM.x, y: SHOWROOM_CAM.y, z: SHOWROOM_CAM.z,
      duration: 1.5,
      ease: 'power2.inOut',
    });

    timeline.to(controls.target, {
      x: SHOWROOM_TARGET.x, y: SHOWROOM_TARGET.y, z: SHOWROOM_TARGET.z,
      duration: 1.5,
      ease: 'power2.inOut',
    }, '-=1.5');

    // prevCarModel is car 0 in this case — rotate it back
    timeline.to(prevCarModel.rotation, {
      y: prevOriginalRotation,
      duration: 1.5,
      ease: 'power2.inOut',
    }, 0);

    return;
  }

  // Rotate previous (target) car to face forward, then enter its cockpit
  const nextCarModel = carDataArray[currentCarIndex].model;

  const timeline = gsap.timeline();

  // Phase 1: rotate both cars
  timeline.to(prevCarModel.rotation, {
    y: prevOriginalRotation,
    duration: 1.0,
    ease: 'power2.inOut',
    onComplete: () => recomputeBounds(currentCarIndex + 1),
  }, 0);

  timeline.to(nextCarModel.rotation, {
    y: 0,
    duration: 1.0,
    ease: 'power2.inOut',
    onComplete: () => {
      recomputeBounds(currentCarIndex);
      setCockpitPosition(currentCarIndex);

      const mc = carDataArray[currentCarIndex].modelCenter;
      if (cockpitLight) cockpitLight.position.set(mc.x, mc.y + 0.5, mc.z + 0.3);
      if (cockpitFill) cockpitFill.position.set(mc.x, mc.y + 0.3, mc.z - 0.2);
      if (dashLight) dashLight.position.set(mc.x, mc.y + 0.1, mc.z + 0.5);
    },
  }, 0);

  // Phase 2: Slide into previous car's cockpit
  timeline.to(camera.position, {
    x: () => cockpitBasePosition.x,
    y: () => cockpitBasePosition.y,
    z: () => cockpitBasePosition.z,
    duration: 1.5,
    ease: 'power3.inOut',
    onComplete: () => {
      state = 'COCKPIT';
      scrollCooldown = false;
      setCockpitEnabled(true);

      document.getElementById('cockpit-hud').classList.add('visible');

      populateOverlays();
      showOverlay();

      if (cockpitLight) gsap.to(cockpitLight, { intensity: 5.0, duration: 0.5 });
      if (cockpitFill) gsap.to(cockpitFill, { intensity: 3.0, duration: 0.5 });
      if (dashLight) gsap.to(dashLight, { intensity: 2.0, duration: 0.5 });
    },
  });

  timeline.to(controls.target, {
    x: () => cockpitLookTarget.x,
    y: () => cockpitLookTarget.y,
    z: () => cockpitLookTarget.z,
    duration: 1.5,
    ease: 'power3.inOut',
  }, '-=1.5');
}

// ============================================
// RENDER LOOP
// ============================================

function animate() {
  requestAnimationFrame(animate);

  if (state === 'EXTERIOR' && controls.enabled) {
    controls.update();
  }

  if (state === 'COCKPIT') {
    camera.lookAt(cockpitLookTarget);
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
