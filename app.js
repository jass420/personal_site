import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { loadCar, showHotspots, animateHotspots, SCREEN_POSITION } from './car.js';
import { initPanels, openPanel, closePanel, getActivePanel } from './panels.js';
import { initCockpitInteraction, setCockpitEnabled } from './cockpit.js';

// ============================================
// STATE
// ============================================

let state = 'LOADING'; // LOADING | EXTERIOR | TRANSITIONING | COCKPIT
let scene, camera, renderer, controls;
let carData = null; // { model, hotspots, hotspotParent, modelBounds, modelCenter, modelSize }
let clock;

// Camera targets for cockpit look-around
let cockpitBasePosition = new THREE.Vector3();
let cockpitLookTarget = new THREE.Vector3();
let mouseOffset = { x: 0, y: 0 };
let cockpitLookEnabled = false;
let isDragging = false;

// ============================================
// INIT
// ============================================

async function init() {
  clock = new THREE.Clock();

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

  // Load the car model
  try {
    carData = await loadCar(scene, onLoadProgress);
    onModelLoaded();
  } catch (err) {
    console.error('Failed to load car:', err);
    document.querySelector('.loader-subtitle').textContent = 'Failed to load 3D model';
  }

  // Init panels
  initPanels({
    onPanelChange: (opened) => {
      // Dim/brighten scene when panel opens/closes
    },
  });

  // Init cockpit interactions
  initCockpitInteraction(camera, carData ? carData.hotspots : []);

  // Events
  window.addEventListener('resize', onResize);
  window.addEventListener('mousemove', onGlobalMouseMove);
  window.addEventListener('mousedown', () => { isDragging = true; });
  window.addEventListener('mouseup', () => { isDragging = false; });

  // Hero button
  document.getElementById('enter-btn').addEventListener('click', enterCar);

  // HUD exit button
  document.getElementById('exit-btn').addEventListener('click', exitCar);

  // Mobile fallback buttons
  document.querySelectorAll('.mobile-nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const panelId = btn.dataset.panel;
      if (panelId) {
        // Import openPanel dynamically since mobile might not load Three.js
        import('./panels.js').then(({ openPanel }) => openPanel(panelId));
      }
    });
  });

  // Cockpit screen click → open Roomie video panel
  const screenEl = document.getElementById('cockpit-screen');
  if (screenEl) {
    screenEl.addEventListener('click', () => {
      openPanel('roomie-video');
    });
  }

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

  // Purple accent from below (reflected light effect)
  const accentLight = new THREE.PointLight(0x7c3aed, 0.8, 10);
  accentLight.position.set(0, 0.1, 0);
  scene.add(accentLight);

  // Cockpit interior lights (start dim, brighten on enter)
  const cockpitLight = new THREE.PointLight(0xffffff, 0.0, 5);
  cockpitLight.position.set(0, 1.2, 0.3);
  cockpitLight.name = 'cockpit_light';
  scene.add(cockpitLight);

  // Extra cockpit fill from above-front
  const cockpitFill = new THREE.PointLight(0xffffff, 0.0, 4);
  cockpitFill.position.set(0, 1.0, -0.2);
  cockpitFill.name = 'cockpit_fill';
  scene.add(cockpitFill);

  // Dashboard accent light (purple glow on dash)
  const dashLight = new THREE.PointLight(0x7c3aed, 0.0, 3);
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
  // Finalize loading bar
  onLoadProgress(1);

  // Check for mobile
  const isMobile = window.innerWidth < 768;
  if (isMobile) {
    document.getElementById('mobile-fallback').classList.add('visible');
    document.getElementById('loading-screen').classList.add('fade-out');
    setTimeout(() => {
      document.getElementById('loading-screen').style.display = 'none';
    }, 800);
    // Init panels for mobile too
    initPanels({});
    state = 'EXTERIOR';
    return;
  }

  // Fade out loading screen
  setTimeout(() => {
    document.getElementById('loading-screen').classList.add('fade-out');
    setTimeout(() => {
      document.getElementById('loading-screen').style.display = 'none';
    }, 800);
    // Show hero
    document.getElementById('hero-overlay').classList.remove('hidden');
    state = 'EXTERIOR';
  }, 600);
}

// ============================================
// ENTER / EXIT CAR
// ============================================

function enterCar() {
  if (state !== 'EXTERIOR') return;
  state = 'TRANSITIONING';

  // Hide hero
  document.getElementById('hero-overlay').classList.add('hidden');

  // Disable orbit controls
  controls.enabled = false;
  controls.autoRotate = false;

  // Calculate cockpit camera position based on model
  const modelCenter = carData.modelCenter;
  const modelSize = carData.modelSize;

  // Cockpit camera: driver seat position (left side, inside)
  cockpitBasePosition.set(
    modelCenter.x - modelSize.x * 0.15,
    modelCenter.y + modelSize.y * 0.15,
    modelCenter.z
  );
  cockpitLookTarget.set(
    modelCenter.x,
    modelCenter.y + modelSize.y * 0.1,
    modelCenter.z + modelSize.z * 0.4
  );

  // GSAP animation: camera moves to cockpit
  const timeline = gsap.timeline({
    onComplete: () => {
      state = 'COCKPIT';
      cockpitLookEnabled = true;
      setCockpitEnabled(true);
      showHotspots(carData.hotspots, true);

      // Show HUD
      document.getElementById('cockpit-hud').classList.add('visible');

      // Load the video on the cockpit screen
      const cockpitVideo = document.getElementById('cockpit-video');
      if (cockpitVideo && !cockpitVideo.src) {
        cockpitVideo.src = 'https://www.youtube.com/embed/0mxCZzDBado';
      }

      // Brighten all cockpit lights
      const cockpitLight = scene.getObjectByName('cockpit_light');
      const cockpitFill = scene.getObjectByName('cockpit_fill');
      const dashLight = scene.getObjectByName('dash_light');
      if (cockpitLight) gsap.to(cockpitLight, { intensity: 5.0, duration: 0.5 });
      if (cockpitFill) gsap.to(cockpitFill, { intensity: 3.0, duration: 0.5 });
      if (dashLight) gsap.to(dashLight, { intensity: 2.0, duration: 0.5 });
    },
  });

  // Step 1: Move toward the car (approach from side)
  const approachPos = {
    x: modelCenter.x - modelSize.x * 0.6,
    y: modelCenter.y + modelSize.y * 0.3,
    z: modelCenter.z + modelSize.z * 0.1,
  };

  timeline.to(camera.position, {
    ...approachPos,
    duration: 1.0,
    ease: 'power2.inOut',
  });

  // Step 2: Slide into the cockpit
  timeline.to(camera.position, {
    x: cockpitBasePosition.x,
    y: cockpitBasePosition.y,
    z: cockpitBasePosition.z,
    duration: 1.2,
    ease: 'power3.inOut',
  });

  // Simultaneously rotate to face dashboard
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

  // Close any open panel
  closePanel();

  // Hide HUD and hotspots
  document.getElementById('cockpit-hud').classList.remove('visible');
  setCockpitEnabled(false);
  showHotspots(carData.hotspots, false);
  cockpitLookEnabled = false;

  // Hide screen overlay
  const screenOverlay = document.getElementById('cockpit-screen');
  if (screenOverlay) screenOverlay.style.display = 'none';

  // Dim all cockpit lights
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

      // Show hero
      document.getElementById('hero-overlay').classList.remove('hidden');
    },
  });

  // Pull camera back out
  timeline.to(camera.position, {
    x: 5,
    y: 2.5,
    z: 6,
    duration: 1.5,
    ease: 'power2.inOut',
  });

  timeline.to(controls.target, {
    x: 0,
    y: 0.6,
    z: 0,
    duration: 1.5,
    ease: 'power2.inOut',
  }, '-=1.5');
}

// ============================================
// COCKPIT LOOK-AROUND
// ============================================

function onGlobalMouseMove(event) {
  if (!cockpitLookEnabled || state !== 'COCKPIT' || getActivePanel()) return;
  if (!isDragging) return;

  // Normalize mouse to -1..1
  mouseOffset.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouseOffset.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function updateCockpitLook() {
  if (!cockpitLookEnabled || state !== 'COCKPIT') return;

  // Subtle camera offset based on mouse position
  const lookX = cockpitLookTarget.x + mouseOffset.x * 0.5;
  const lookY = cockpitLookTarget.y + mouseOffset.y * 0.2;

  camera.lookAt(lookX, lookY, cockpitLookTarget.z);
}

// ============================================
// RENDER LOOP
// ============================================

function animate() {
  requestAnimationFrame(animate);

  const elapsed = clock.getElapsedTime();

  // Update controls in exterior mode
  if (state === 'EXTERIOR' && controls.enabled) {
    controls.update();
  }

  // Cockpit look-around
  if (state === 'COCKPIT') {
    updateCockpitLook();
  }

  // Animate hotspots
  if (carData && carData.hotspots) {
    animateHotspots(carData.hotspots, elapsed);
  }

  // Position the video screen overlay in cockpit mode
  const screenEl = document.getElementById('cockpit-screen');
  if (screenEl) {
    if (state === 'COCKPIT' && !getActivePanel()) {
      const screenWorld = SCREEN_POSITION.clone();
      screenWorld.project(camera);
      const x = (screenWorld.x * 0.5 + 0.5) * window.innerWidth;
      const y = (-screenWorld.y * 0.5 + 0.5) * window.innerHeight;
      screenEl.style.left = x + 'px';
      screenEl.style.top = y + 'px';
      screenEl.style.display = 'block';
    } else {
      screenEl.style.display = 'none';
    }
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
