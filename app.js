import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { loadCar, removeCar } from './car.js';
import { initPanels, closePanel } from './panels.js';
import { initCockpitInteraction, setCockpitEnabled } from './cockpit.js';

// ============================================
// CAR DATA
// ============================================

const CARS = [
  {
    model: '2016_pagani_huayra_bc/scene.gltf',
    name: 'Roomie',
    subtitle: 'AI Interior Designer',
    award: 'Sophiie Hackathon 2026 \u00b7 5th / 15',
    desc: "Upload a photo of your room and Roomie's AI agent autonomously finds matching furniture on Facebook Marketplace, compares prices, and messages sellers on your behalf.",
    tags: ['LangGraph', 'GPT-4 Vision', 'AI Agents', 'Python'],
    github: 'https://github.com/JasMatharu/roomie',
    video: 'https://www.youtube.com/embed/0mxCZzDBado',
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
  },
];

let currentCarIndex = 0;

// ============================================
// STATE
// ============================================

let state = 'LOADING'; // LOADING | EXTERIOR | TRANSITIONING | COCKPIT
let scene, camera, renderer, controls;
let carData = null;

// Camera targets for cockpit
let cockpitBasePosition = new THREE.Vector3();
let cockpitLookTarget = new THREE.Vector3();

// ============================================
// INIT
// ============================================

async function init() {
  // Renderer
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

  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f0f5);
  scene.fog = new THREE.FogExp2(0xf0f0f5, 0.03);

  // Camera
  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.05,
    100
  );
  camera.position.set(5, 2.5, 6);
  camera.lookAt(0, 0.8, 0);

  // Lighting
  setupLighting();

  // OrbitControls for exterior
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.8;
  controls.maxPolarAngle = Math.PI / 2.1;
  controls.minPolarAngle = 0.3;
  controls.maxDistance = 12;
  controls.minDistance = 3;
  controls.target.set(0, 0.6, 0);
  controls.enablePan = false;

  // Load the first car
  try {
    carData = await loadCar(scene, CARS[0].model, onLoadProgress);
    onModelLoaded();
  } catch (err) {
    console.error('Failed to load car:', err);
    document.querySelector('.loader-subtitle').textContent = 'Failed to load 3D model';
  }

  // Init panels
  initPanels({});

  // Init cockpit interactions
  initCockpitInteraction();

  // Events
  window.addEventListener('resize', onResize);

  // Hero button
  document.getElementById('enter-btn').addEventListener('click', enterCar);

  // HUD exit button
  document.getElementById('exit-btn').addEventListener('click', exitCar);

  // Scroll down to exit cockpit
  document.getElementById('canvas-container').addEventListener('wheel', (e) => {
    if (state === 'COCKPIT' && e.deltaY > 50) {
      exitCar();
    }
  });

  // Car navigation arrows
  document.getElementById('prev-car').addEventListener('click', () => switchCar(-1));
  document.getElementById('next-car').addEventListener('click', () => switchCar(1));

  // Mobile fallback buttons
  document.querySelectorAll('.mobile-nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const panelId = btn.dataset.panel;
      if (panelId) {
        import('./panels.js').then(({ openPanel }) => openPanel(panelId));
      }
    });
  });

  // Start render loop
  animate();
}

// ============================================
// LIGHTING
// ============================================

function setupLighting() {
  // Ambient — strong so interior is never pitch black
  const ambient = new THREE.AmbientLight(0xffffff, 1.8);
  scene.add(ambient);

  // Key light
  const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
  keyLight.position.set(5, 8, 5);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = 1024;
  keyLight.shadow.mapSize.height = 1024;
  keyLight.shadow.camera.near = 0.5;
  keyLight.shadow.camera.far = 20;
  keyLight.shadow.camera.left = -5;
  keyLight.shadow.camera.right = 5;
  keyLight.shadow.camera.top = 5;
  keyLight.shadow.camera.bottom = -5;
  scene.add(keyLight);

  // Fill light
  const fillLight = new THREE.DirectionalLight(0xc8c8ff, 1.0);
  fillLight.position.set(-3, 2, -3);
  scene.add(fillLight);

  // Subtle purple accent from below
  const accentLight = new THREE.PointLight(0x7c3aed, 0.4, 10);
  accentLight.position.set(0, 0.1, 0);
  scene.add(accentLight);

  // Cockpit interior lights (start dim, brighten on enter)
  const cockpitLight = new THREE.PointLight(0xffffff, 0.0, 5);
  cockpitLight.position.set(0, 1.2, 0.3);
  cockpitLight.name = 'cockpit_light';
  scene.add(cockpitLight);

  const cockpitFill = new THREE.PointLight(0xffffff, 0.0, 4);
  cockpitFill.position.set(0, 1.0, -0.2);
  cockpitFill.name = 'cockpit_fill';
  scene.add(cockpitFill);

  // Warm white dashboard glow
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
    showCarNav(true);
    state = 'EXTERIOR';
    updateDots();
  }, 600);
}

// ============================================
// CAR SWITCHING
// ============================================

let switching = false;

async function switchCar(direction) {
  if (state !== 'EXTERIOR' || switching) return;
  switching = true;

  const newIndex = (currentCarIndex + direction + CARS.length) % CARS.length;

  // Fade out the car
  const existingCar = scene.getObjectByName('car');
  if (existingCar) {
    await new Promise((resolve) => {
      gsap.to(existingCar.position, {
        y: existingCar.position.y - 0.3,
        duration: 0.3,
        ease: 'power2.in',
      });
      gsap.to({}, {
        duration: 0.3,
        onUpdate: function () {
          existingCar.traverse((child) => {
            if (child.isMesh && child.material) {
              const mats = Array.isArray(child.material) ? child.material : [child.material];
              mats.forEach((m) => {
                m.transparent = true;
                m.opacity = 1 - this.progress();
              });
            }
          });
        },
        onComplete: resolve,
      });
    });

    removeCar(scene);
  }

  currentCarIndex = newIndex;
  updateDots();

  // Load new car
  try {
    carData = await loadCar(scene, CARS[currentCarIndex].model, null);

    // Fade in new car
    const newCar = scene.getObjectByName('car');
    if (newCar) {
      newCar.traverse((child) => {
        if (child.isMesh && child.material) {
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          mats.forEach((m) => {
            m.transparent = true;
            m.opacity = 0;
          });
        }
      });
      gsap.to({}, {
        duration: 0.4,
        onUpdate: function () {
          newCar.traverse((child) => {
            if (child.isMesh && child.material) {
              const mats = Array.isArray(child.material) ? child.material : [child.material];
              mats.forEach((m) => {
                m.opacity = this.progress();
              });
            }
          });
        },
        onComplete: () => {
          newCar.traverse((child) => {
            if (child.isMesh && child.material) {
              const mats = Array.isArray(child.material) ? child.material : [child.material];
              mats.forEach((m) => {
                m.transparent = false;
                m.opacity = 1;
              });
            }
          });
        },
      });
    }
  } catch (err) {
    console.error('Failed to load car:', err);
  }

  switching = false;
}

function updateDots() {
  const dots = document.querySelectorAll('.car-dot');
  dots.forEach((dot, i) => {
    dot.classList.toggle('active', i === currentCarIndex);
  });
}

function showCarNav(visible) {
  const method = visible ? 'add' : 'remove';
  document.getElementById('prev-car').classList[method]('visible');
  document.getElementById('next-car').classList[method]('visible');
  document.getElementById('car-dots').classList[method]('visible');
}

// ============================================
// POPULATE OVERLAYS
// ============================================

function populateOverlays() {
  const car = CARS[currentCarIndex];

  document.querySelector('.ws-title').textContent = car.name;
  document.querySelector('.ws-subtitle').textContent = car.subtitle;
  document.querySelector('.ws-award').textContent = car.award;
  document.querySelector('.ws-desc').textContent = car.desc;

  // Tags
  const tagsContainer = document.querySelector('.ws-tags');
  tagsContainer.innerHTML = car.tags.map((t) => `<span class="ws-tag">${t}</span>`).join('');

  // GitHub link
  const githubLink = document.querySelector('.ws-github');
  if (car.github) {
    githubLink.href = car.github;
    githubLink.style.display = '';
  } else {
    githubLink.style.display = 'none';
  }

  // Video
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

// ============================================
// ENTER / EXIT CAR
// ============================================

function enterCar() {
  if (state !== 'EXTERIOR') return;
  state = 'TRANSITIONING';

  document.getElementById('hero-overlay').classList.add('hidden');
  showCarNav(false);

  controls.enabled = false;
  controls.autoRotate = false;

  const modelCenter = carData.modelCenter;
  const modelSize = carData.modelSize;

  // Cockpit camera: driver seat position
  cockpitBasePosition.set(
    modelCenter.x - modelSize.x * 0.005,
    modelCenter.y + modelSize.y * 0.20,
    modelCenter.z
  );
  cockpitLookTarget.set(
    modelCenter.x,
    modelCenter.y + modelSize.y * 0.15,
    modelCenter.z + modelSize.z * 0.4
  );

  const timeline = gsap.timeline({
    onComplete: () => {
      state = 'COCKPIT';
      setCockpitEnabled(true);

      // Show HUD
      document.getElementById('cockpit-hud').classList.add('visible');

      // Populate and show overlays
      populateOverlays();
      document.getElementById('windscreen-info').classList.add('visible');

      // Brighten cockpit lights
      const cockpitLight = scene.getObjectByName('cockpit_light');
      const cockpitFill = scene.getObjectByName('cockpit_fill');
      const dashLight = scene.getObjectByName('dash_light');
      if (cockpitLight) gsap.to(cockpitLight, { intensity: 5.0, duration: 0.5 });
      if (cockpitFill) gsap.to(cockpitFill, { intensity: 3.0, duration: 0.5 });
      if (dashLight) gsap.to(dashLight, { intensity: 2.0, duration: 0.5 });
    },
  });

  // Step 1: Approach from side
  timeline.to(camera.position, {
    x: modelCenter.x - modelSize.x * 0.6,
    y: modelCenter.y + modelSize.y * 0.3,
    z: modelCenter.z + modelSize.z * 0.1,
    duration: 1.0,
    ease: 'power2.inOut',
  });

  // Step 2: Slide into cockpit
  timeline.to(camera.position, {
    x: cockpitBasePosition.x,
    y: cockpitBasePosition.y,
    z: cockpitBasePosition.z,
    duration: 1.2,
    ease: 'power3.inOut',
  });

  // Simultaneously face dashboard
  timeline.to(controls.target, {
    x: cockpitLookTarget.x,
    y: cockpitLookTarget.y,
    z: cockpitLookTarget.z,
    duration: 1.2,
    ease: 'power3.inOut',
  }, '-=1.2');
}

function exitCar() {
  if (state !== 'COCKPIT') return;
  state = 'TRANSITIONING';

  closePanel();

  // Hide HUD and overlays
  document.getElementById('cockpit-hud').classList.remove('visible');
  document.getElementById('windscreen-info').classList.remove('visible');
  document.getElementById('dash-video').classList.remove('visible');
  setCockpitEnabled(false);

  // Clear video src to stop playback
  const iframe = document.querySelector('#dash-video iframe');
  if (iframe) iframe.src = '';

  // Dim cockpit lights
  const cockpitLight = scene.getObjectByName('cockpit_light');
  const cockpitFill = scene.getObjectByName('cockpit_fill');
  const dashLight = scene.getObjectByName('dash_light');
  if (cockpitLight) gsap.to(cockpitLight, { intensity: 0, duration: 0.5 });
  if (cockpitFill) gsap.to(cockpitFill, { intensity: 0, duration: 0.5 });
  if (dashLight) gsap.to(dashLight, { intensity: 0, duration: 0.5 });

  const timeline = gsap.timeline({
    onComplete: () => {
      state = 'EXTERIOR';
      controls.enabled = true;
      controls.autoRotate = true;
      document.getElementById('hero-overlay').classList.remove('hidden');
      showCarNav(true);
    },
  });

  timeline.to(camera.position, {
    x: 5, y: 2.5, z: 6,
    duration: 1.5,
    ease: 'power2.inOut',
  });

  timeline.to(controls.target, {
    x: 0, y: 0.6, z: 0,
    duration: 1.5,
    ease: 'power2.inOut',
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

  // Keep camera pointed at dashboard in cockpit
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
