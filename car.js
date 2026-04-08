import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const loader = new GLTFLoader();

// ============================================
// Load a car at a specific showroom position
// ============================================

export function loadCarAt(scene, modelPath, position, rotationY, name, onProgress) {
  return new Promise((resolve, reject) => {
    loader.load(
      modelPath,
      (gltf) => {
        const model = gltf.scene;
        model.name = name;

        // Scale the model
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2.5 / maxDim;
        model.scale.setScalar(scale);

        // Recalculate bounds after scaling
        box.setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());

        // Center the model on its own origin, then offset to showroom position
        model.position.x = position.x - center.x;
        model.position.z = position.z - center.z;
        model.position.y = position.y - box.min.y;

        // Apply showroom rotation around the model's placed position
        // We need to rotate around the car's center, not the world origin
        if (rotationY) {
          const pivot = new THREE.Group();
          pivot.name = name;
          pivot.position.set(position.x, 0, position.z);
          model.position.x -= position.x;
          model.position.z -= position.z;
          pivot.rotation.y = rotationY;
          pivot.add(model);
          scene.add(pivot);

          // Recalculate final bounds from the pivot
          const modelBox = new THREE.Box3().setFromObject(pivot);
          const modelCenter = modelBox.getCenter(new THREE.Vector3());
          const modelSize = modelBox.getSize(new THREE.Vector3());

          resolve({ model: pivot, modelBounds: modelBox, modelCenter, modelSize });
        } else {
          // Enable shadows
          model.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });

          scene.add(model);

          const modelBox = new THREE.Box3().setFromObject(model);
          const modelCenter = modelBox.getCenter(new THREE.Vector3());
          const modelSize = modelBox.getSize(new THREE.Vector3());

          resolve({ model, modelBounds: modelBox, modelCenter, modelSize });
        }

        // Enable shadows on all meshes (including pivoted ones)
        const root = scene.getObjectByName(name);
        if (root) {
          root.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
        }
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
// Build ground (call once)
// ============================================

export function buildGround(scene) {
  if (scene.getObjectByName('ground')) return;

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

  const gridHelper = new THREE.GridHelper(40, 60, 0xd0d0e0, 0xd0d0e0);
  gridHelper.position.y = 0.005;
  gridHelper.material.opacity = 0.3;
  gridHelper.material.transparent = true;
  group.add(gridHelper);

  scene.add(group);
}
