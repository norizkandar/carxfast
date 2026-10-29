
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87bde8);
scene.fog = new THREE.Fog(0x87bde8, 100, 650);

const camera = new THREE.PerspectiveCamera(
  65, window.innerWidth / window.innerHeight, 0.1, 1500
);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: "high-performance"
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
document.body.appendChild(renderer.domElement);

const hemi = new THREE.HemisphereLight(0xbadfff, 0x343b42, 2);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xffedcf, 3.2);
sun.position.set(-100, 150, 70);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -100;
sun.shadow.camera.right = 100;
sun.shadow.camera.top = 100;
sun.shadow.camera.bottom = -100;
scene.add(sun);

const mat = (color, roughness = 0.7, metalness = 0) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness });

const groundMat = mat(0x34463d);
const roadMat = mat(0x242a32, 0.88);
const lineMat = mat(0xf5f1d7);
const buildingMats = [
  mat(0x596775), mat(0x777f8a), mat(0x454e5c),
  mat(0x8c9399), mat(0x3b5363), mat(0x665e5b)
];

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(1400, 1400), groundMat
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.12;
ground.receiveShadow = true;
scene.add(ground);

// City roads
function road(x, z, width, depth) {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(width, depth), roadMat
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, -0.07, z);
  mesh.receiveShadow = true;
  scene.add(mesh);
}

for (let i = -5; i <= 5; i++) {
  road(i * 100, 0, 20, 1200);
  road(0, i * 100, 1200, 20);

  for (let j = -5; j <= 5; j++) {
    if (i === 0 || j === 0) continue;

    const x = i * 100;
    const z = j * 100;

    // Dashed road markings
    for (let k = -4; k <= 4; k++) {
      const dash1 = new THREE.Mesh(
        new THREE.PlaneGeometry(0.25, 5), lineMat
      );
      dash1.rotation.x = -Math.PI / 2;
      dash1.position.set(x, 0.005, z + k * 11);
      scene.add(dash1);

      const dash2 = new THREE.Mesh(
        new THREE.PlaneGeometry(5, 0.25), lineMat
      );
      dash2.rotation.x = -Math.PI / 2;
      dash2.position.set(x + k * 11, 0.006, z);
      scene.add(dash2);
    }
  }
}

// Procedural city buildings
const buildingGroup = new THREE.Group();
scene.add(buildingGroup);

let seed = 7261;
function rand() {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
}

for (let x = -500; x <= 500; x += 25) {
  for (let z = -500; z <= 500; z += 25) {
    // Keep the main roads open
    if (Math.abs(x % 100) < 19 || Math.abs(z % 100) < 19) continue;
    if (rand() < 0.14) continue;

    const w = 12 + rand() * 8;
    const d = 12 + rand() * 8;
    const h = 12 + rand() * 80;

    const building = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      buildingMats[Math.floor(rand() * buildingMats.length)]
    );

    building.position.set(x + (rand() - 0.5) * 4, h / 2 - 0.05, z + (rand() - 0.5) * 4);
    building.castShadow = h < 45;
    building.receiveShadow = true;
    buildingGroup.add(building);

    // Simplified glass window bands
    if (h > 28) {
      const windowMat = new THREE.MeshStandardMaterial({
        color: 0x8bdcff,
        emissive: 0x153449,
        emissiveIntensity: 0.35,
        roughness: 0.25,
        metalness: 0.25
      });

      for (let y = 8; y < h - 3; y += 7) {
        const windows = new THREE.Mesh(
          new THREE.BoxGeometry(w * 0.78, 1.2, 0.08),
          windowMat
        );
        windows.position.set(
          building.position.x,
          y,
          building.position.z + d / 2 + 0.045
        );
        buildingGroup.add(windows);
      }
    }
  }
}

// Basic car model while the detailed model loads
const car = new THREE.Group();
scene.add(car);

const carPaint = new THREE.MeshStandardMaterial({
  color: 0xc51f35, metalness: 0.72, roughness: 0.23
});
const glassMat = mat(0x142c3c, 0.18, 0.4);
const tyreMat = mat(0x111317, 0.9);
const rimMat = mat(0xb9c6ce, 0.25, 0.85);

const body = new THREE.Mesh(
  new THREE.BoxGeometry(2.05, 0.55, 4.35), carPaint
);
body.position.y = 0.8;
body.castShadow = true;
car.add(body);

const cabin = new THREE.Mesh(
  new THREE.BoxGeometry(1.55, 0.65, 2.05), glassMat
);
cabin.position.set(0, 1.34, -0.15);
cabin.castShadow = true;
car.add(cabin);

const wheels = [];
for (const x of [-1.02, 1.02]) {
  for (const z of [-1.4, 1.4]) {
    const wheel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.39, 0.39, 0.24, 20),
      tyreMat
    );
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, 0.43, z);
    wheel.castShadow = true;
    car.add(wheel);
    wheels.push(wheel);

    const rim = new THREE.Mesh(
      new THREE.CylinderGeometry(0.21, 0.21, 0.255, 16),
      rimMat
    );
    rim.rotation.z = Math.PI / 2;
    rim.position.copy(wheel.position);
    car.add(rim);
  }
}

const headlightMat = new THREE.MeshStandardMaterial({
  color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 2
});
for (const x of [-0.68, 0.68]) {
  const lamp = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.13, 0.08), headlightMat
  );
  lamp.position.set(x, 0.9, 2.19);
  car.add(lamp);
}

car.position.set(0, 0, 12);

// Try loading a detailed external car model
let detailedCarLoaded = false;
const loader = new GLTFLoader();

loader.load(
  "https://threejs.org/examples/models/gltf/ferrari.glb",
  (gltf) => {
    const model = gltf.scene;
    model.scale.setScalar(0.8);
    model.rotation.y = Math.PI;
    model.position.y = 0.05;

    model.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });

    car.add(model);
    body.visible = false;
    cabin.visible = false;
    wheels.forEach((wheel) => wheel.visible = false);
    detailedCarLoaded = true;
  },
  undefined,
  () => console.info("Using the built-in car model.")
);

// Driving
const keys = {};
let speed = 0;
let steering = 0;
let cameraMode = 0; // 0 = third-person, 1 = cockpit
let night = false;

window.addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = true;

  if (e.repeat) return;

  if (e.key.toLowerCase() === "c") {
    cameraMode = (cameraMode + 1) % 2;
  }

  if (e.key.toLowerCase() === "n") {
    setNight(!night);
  }

  if (e.key.toLowerCase() === "r") {
    car.position.set(0, 0, 12);
    car.rotation.set(0, 0, 0);
    speed = 0;
  }
});

window.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
});

// Mobile buttons work with data-action="forward/back/left/right"
document.querySelectorAll(".ctrl").forEach((button) => {
  const action = button.dataset.action;

  if (!action) return;

  const keyMap = {
    forward: "w",
    back: "s",
    left: "a",
    right: "d"
  };

  const key = keyMap[action];
  if (!key) return;

  button.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    keys[key] = true;
  });

  const release = () => keys[key] = false;
  button.addEventListener("pointerup", release);
  button.addEventListener("pointerleave", release);
  button.addEventListener("pointercancel", release);
});

function setNight(value) {
  night = value;

  const sky = night ? 0x07101f : 0x87bde8;
  const fog = night ? 0x101a2a : 0x87bde8;

  scene.background.setHex(sky);
  scene.fog.color.setHex(fog);
  sun.intensity = night ? 0.18 : 3.2;
  hemi.intensity = night ? 0.35 : 2;
  hemi.color.setHex(night ? 0x334f8a : 0xbadfff);
  sun.color.setHex(night ? 0x769cff : 0xffedcf);

  buildingMats.forEach((m) => {
    m.emissive.setHex(night ? 0x101b35 : 0x000000);
    m.emissiveIntensity = night ? 0.35 : 0;
  });

  if (night) {
    scene.background.setHex(0x07101f);
  }
}

const speedEl = document.querySelector("#speed");
const loadingEl = document.querySelector("#loading");
const resetBtn = document.querySelector("#reset");

if (resetBtn) {
  resetBtn.addEventListener("click", () => {
    car.position.set(0, 0, 12);
    car.rotation.set(0, 0, 0);
    speed = 0;
  });
}

// Hide loading screen once the scene is ready
if (loadingEl) loadingEl.style.display = "none";

const clock = new THREE.Clock();
const cameraTarget = new THREE.Vector3();

function animate() {
  requestAnimationFrame(animate);

  const dt = Math.min(clock.getDelta(), 0.04);

  const forward = keys.w || keys.arrowup;
  const backward = keys.s || keys.arrowdown;
  const left = keys.a || keys.arrowleft;
  const right = keys.d || keys.arrowright;

  if (forward) speed += 24 * dt;
  else if (backward) speed -= 30 * dt;
  else speed *= Math.pow(0.985, dt * 60);

  speed = THREE.MathUtils.clamp(speed, -12, 75);

  const steerInput = (left ? 1 : 0) - (right ? 1 : 0);
  steering = THREE.MathUtils.lerp(steering, steerInput, dt * 4);

  if (Math.abs(speed) > 0.5) {
    car.rotation.y += steering * dt * Math.min(Math.abs(speed) / 12, 2.2) * Math.sign(speed);
    const direction = new THREE.Vector3(
      Math.sin(car.rotation.y), 0, Math.cos(car.rotation.y)
    );

    car.position.addScaledVector(direction, speed * dt);
  }

  wheels.forEach((wheel) => {
    wheel.rotation.x += speed * dt * 0.8;
  });

  if (cameraMode === 0) {
    const offset = new THREE.Vector3(0, 5.2, -11);
    offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), car.rotation.y);

    cameraTarget.copy(car.position).add(offset);
    camera.position.lerp(cameraTarget, 1 - Math.pow(0.001, dt));
    const look = car.position.clone();
    look.y += 1.1;
    camera.lookAt(look);
  } else {
    const cockpitOffset = new THREE.Vector3(0, 1.65, 0.2);
    cockpitOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), car.rotation.y);
    camera.position.copy(car.position).add(cockpitOffset);

    const direction = new THREE.Vector3(
      Math.sin(car.rotation.y), 0.03, Math.cos(car.rotation.y)
    );
    camera.lookAt(camera.position.clone().add(direction));
  }

  if (speedEl) speedEl.textContent = String(Math.round(Math.abs(speed) * 2.3));

  renderer.render(scene, camera);
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
