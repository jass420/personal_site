import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ============================================
// Load a car model by path
// ============================================

const loader = new GLTFLoader();

export function removeCar(scene) {
  const existing = scene.getObjectByName('car');
  if (existing) {
    existing.traverse((child) => {
      if (child.isMesh) {
        child.geometry.dispose();
        if (child.material.isMaterial) {
          child.material.dispose();
        } else if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        }
      }
    });
    scene.remove(existing);
  }
}

export function loadCar(scene, modelPath, onProgress) {
  return new Promise((resolve, reject) => {
    loader.load(
      modelPath,
      (gltf) => {
        const model = gltf.scene;
        model.name = 'car';

        // Scale and position the model
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2.5 / maxDim;
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

        // Recalculate final bounds
        const modelBox = new THREE.Box3().setFromObject(model);
        const modelCenter = modelBox.getCenter(new THREE.Vector3());
        const modelSize = modelBox.getSize(new THREE.Vector3());

        // Build ground only if it doesn't exist yet
        if (!scene.getObjectByName('ground')) {
          const ground = buildGround();
          scene.add(ground);
        }

        resolve({
          model,
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

  // Subtle grid
  const gridHelper = new THREE.GridHelper(40, 60, 0xd0d0e0, 0xd0d0e0);
  gridHelper.position.y = 0.005;
  gridHelper.material.opacity = 0.3;
  gridHelper.material.transparent = true;
  group.add(gridHelper);

  return group;
}
