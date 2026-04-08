import * as THREE from 'three';
import { openPanel } from './panels.js';
import { HOTSPOTS } from './car.js';

// ============================================
// Cockpit Interaction System
// Raycasting, hover effects, click handling
// ============================================

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let hoveredMesh = null;
let hotspotMeshes = [];
let camera = null;
let enabled = false;

// Tooltip element
let tooltip = null;

// Map from hotspot ID to panel ID
const PANEL_MAP = {
  infotainment_screen: 'roomie-video',
  steering_wheel: 'roomie-details',
};

export function initCockpitInteraction(cam, hotspots) {
  camera = cam;
  hotspotMeshes = hotspots;
  tooltip = document.getElementById('tooltip');

  window.addEventListener('mousemove', onMouseMove, false);
  window.addEventListener('click', onClick, false);
  window.addEventListener('touchend', onTouchEnd, false);
}

export function setCockpitEnabled(val) {
  enabled = val;
  if (!val) {
    resetHover();
    if (tooltip) tooltip.classList.remove('visible');
  }
}

function onMouseMove(event) {
  if (!enabled) return;

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(hotspotMeshes, false);

  if (intersects.length > 0) {
    const hit = intersects[0].object;
    if (hit !== hoveredMesh) {
      resetHover();
      hoveredMesh = hit;
      applyHover(hit);
    }
    // Update tooltip position
    if (tooltip) {
      tooltip.style.left = (event.clientX + 16) + 'px';
      tooltip.style.top = (event.clientY - 10) + 'px';
      tooltip.textContent = hit.userData.label || '';
      tooltip.classList.add('visible');
    }
    document.body.style.cursor = 'pointer';
  } else {
    if (hoveredMesh) {
      resetHover();
    }
    if (tooltip) tooltip.classList.remove('visible');
    document.body.style.cursor = 'default';
  }
}

function onClick(event) {
  if (!enabled) return;

  // Ignore clicks on UI elements
  if (event.target.closest('.content-panel, .panel-close-btn, #panel-overlay, .hud-exit-btn')) {
    return;
  }

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(hotspotMeshes, false);

  if (intersects.length > 0) {
    const hit = intersects[0].object;
    const panelId = PANEL_MAP[hit.userData.interactiveId];
    if (panelId) {
      openPanel(panelId);
    }
  }
}

function onTouchEnd(event) {
  if (!enabled) return;
  if (event.target.closest('.content-panel, .panel-close-btn, #panel-overlay, .hud-exit-btn')) {
    return;
  }

  const touch = event.changedTouches[0];
  if (!touch) return;

  mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(hotspotMeshes, false);

  if (intersects.length > 0) {
    const hit = intersects[0].object;
    const panelId = PANEL_MAP[hit.userData.interactiveId];
    if (panelId) {
      openPanel(panelId);
    }
  }
}

function applyHover(mesh) {
  mesh.material.opacity = 0.8;
  mesh.material.color.setHex(0xa78bfa);
  mesh.children.forEach(child => {
    if (child.userData.isRing) {
      child.material.opacity = 0.9;
    }
  });
}

function resetHover() {
  if (hoveredMesh) {
    hoveredMesh.material.opacity = 0.5;
    hoveredMesh.material.color.setHex(0x7c3aed);
    hoveredMesh.children.forEach(child => {
      if (child.userData.isRing) {
        child.material.opacity = 0.6;
      }
    });
    hoveredMesh = null;
  }
}
