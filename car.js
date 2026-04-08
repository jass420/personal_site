import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ============================================
// Interactive hotspot definitions
// Positioned relative to the car model's interior
// ============================================

// Screen position (infotainment) — exported for overlay projection
export const SCREEN_POSITION = new THREE.Vector3(0, 0.95, 0.5);

const HOTSPOTS = [
  {
    id: 'infotainment_screen',
    label: 'Roomie — AI Interior Designer',
    position: new THREE.Vector3(0, 0.95, 0.5),
    size: 0.18,
  },
  {
    id: 'steering_wheel',
    label: 'About Roomie',
    position: new THREE.Vector3(-0.35, 0.85, 0.25),
    size: 0.15,
  },
];

// ============================================
// Create glowing interactive hotspot spheres
// ============================================

function createHotspots(parent) {
  const hotspotMeshes = [];

  for (const def of HOTSPOTS) {
    const geo = new THREE.SphereGeometry(def.size, 24, 24);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x7c3aed,
      transparent: true,
      opacity: 0.0,
      depthTest: false,
      depthWrite: false,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = def.id;
    mesh.userData.interactiveId = def.id;
    mesh.userData.label = def.label;
    mesh.userData.baseOpacity = 0.0;
    mesh.position.copy(def.position);
    mesh.renderOrder = 999;

    // Outer glow ring
    const ringGeo = new THREE.RingGeometry(def.size * 1.1, def.size * 1.3, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xa78bfa,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
      depthTest: false,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.userData.isRing = true;
    ring.renderOrder = 999;
    mesh.add(ring);

    parent.add(mesh);
    hotspotMeshes.push(mesh);
  }

  return hotspotMeshes;
}

// ============================================
// Show/hide hotspots (for cockpit state)
// ============================================

export function showHotspots(hotspots, visible) {
  for (const mesh of hotspots) {
    mesh.material.opacity = visible ? 0.6 : 0.0;

    mesh.children.forEach(child => {
      if (child.userData.isRing) {
        child.material.opacity = visible ? 0.7 : 0.0;
      }
    });
  }
}

// ============================================
// Pulse animation for hotspots (called in render loop)
// ============================================

export function animateHotspots(hotspots, time) {
  for (let i = 0; i < hotspots.length; i++) {
    const mesh = hotspots[i];
    if (mesh.material.opacity > 0.01) {
      const pulse = 0.45 + Math.sin(time * 2.5 + i * 1.5) * 0.15;
      mesh.material.opacity = pulse;

      // Slow rotation + pulse on rings
      mesh.children.forEach(child => {
        if (child.userData.isRing) {
          child.rotation.z = time * 0.8 + i;
          child.material.opacity = pulse * 1.3;
        }
      });
    }
  }
}

// ============================================
// Load the Pagani Huayra BC model
// ============================================

export function loadCar(scene, onProgress) {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();

    loader.load(
      '2016_pagani_huayra_bc/scene.gltf',
      (gltf) => {
        const model = gltf.scene;
        model.name = 'car';

        // Scale and position the model
        // Sketchfab models often need scaling
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2.5 / maxDim; // normalize to ~2.5 units
        model.scale.setScalar(scale);

        // Recalculate bounds after scaling
        box.setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());

        // Center horizontally, sit on ground
        model.position.x -= center.x;
        model.position.z -= center.z;
        model.position.y -= box.min.y;

        // Enable shadows
        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        scene.add(model);

        // Add interactive hotspots inside the cockpit
        // Hotspots are positioned relative to the car after scaling
        const hotspotParent = new THREE.Group();
        hotspotParent.name = 'hotspots';

        // Adjust hotspot positions based on actual model bounds
        const modelBox = new THREE.Box3().setFromObject(model);
        const modelCenter = modelBox.getCenter(new THREE.Vector3());
        const modelSize = modelBox.getSize(new THREE.Vector3());

        // Position hotspots relative to model
        hotspotParent.position.copy(modelCenter);
        hotspotParent.position.y = modelBox.min.y;

        const hotspotMeshes = createHotspots(hotspotParent);
        scene.add(hotspotParent);

        // Initially hide hotspots
        showHotspots(hotspotMeshes, false);

        // Build ground
        const ground = buildGround();
        scene.add(ground);

        resolve({
          model,
          hotspots: hotspotMeshes,
          hotspotParent,
          modelBounds: modelBox,
          modelCenter,
          modelSize,
        });
      },
      (progress) => {
        if (onProgress && progress.total > 0) {
          onProgress(progress.loaded / progress.total);
        }
      },
      (error) => {
        console.error('Error loading car model:', error);
        reject(error);
      }
    );
  });
}

// ============================================
// GROUND
// ============================================

function buildGround() {
  const group = new THREE.Group();
  group.name = 'ground';

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 80),
    new THREE.MeshStandardMaterial({
      color: 0xe8e8f0,
      roughness: 0.4,
      metalness: 0.3,
    })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0;
  ground.receiveShadow = true;
  group.add(ground);

  // Subtle purple grid
  const gridHelper = new THREE.GridHelper(40, 60, 0xd0d0e0, 0xd0d0e0);
  gridHelper.position.y = 0.005;
  gridHelper.material.opacity = 0.3;
  gridHelper.material.transparent = true;
  group.add(gridHelper);

  return group;
}

export { HOTSPOTS };
