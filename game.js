
import * as THREE from
  "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

// ==========================================
// INOVAX: STREET LEGENDS
// 3D WORLD ENGINE - PROTOTYPE 01
// ==========================================

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x9ab7cf);
scene.fog = new THREE.Fog(0x9ab7cf, 180, 700);

const camera = new THREE.PerspectiveCamera(
  65,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: "high-performance"
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;

document.body.appendChild(renderer.domElement);

// Keep the game canvas behind the interface.
renderer.domElement.style.position = "fixed";
renderer.domElement.style.inset = "0";
renderer.domElement.style.zIndex = "0";

const hud = document.querySelector("#hud");
if (hud) hud.style.zIndex = "2";

const touchUI = document.querySelector("#touch");
if (touchUI) touchUI.style.zIndex = "4";

// Lighting
scene.add(
  new THREE.HemisphereLight(0xe1efff, 0x4c574d, 2)
);

const sunlight = new THREE.DirectionalLight(0xffedcf, 3);
sunlight.position.set(-70, 120, 60);
sunlight.castShadow = true;
sunlight.shadow.mapSize.set(1024, 1024);
sunlight.shadow.camera.left = -100;
sunlight.shadow.camera.right = 100;
sunlight.shadow.camera.top = 100;
sunlight.shadow.camera.bottom = -100;
scene.add(sunlight);

// Materials
function material(color, roughness = 0.8, metalness = 0) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness
  });
}

const grassMaterial = material(0x526d55);
const roadMaterial = material(0x292f37);
const markingMaterial = material(0xe8e1cb);
const pavementMaterial = material(0x85888b);
const buildingMaterials = [
  material(0x7f8b99),
  material(0x9d9c94),
  material(0x596b7d),
  material(0xb2a89b),
  material(0x59636a),
  material(0x3c5264)
];

// Ground
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(1200, 1200),
  grassMaterial
);

ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.15;
ground.receiveShadow = true;
scene.add(ground);

// Helper to create boxes.
function box(parent, size, mat, position, castShadow = false) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(...size),
    mat
  );

  mesh.position.set(...position);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = true;
  parent.add(mesh);

  return mesh;
}

// Roads in a grid.
const roadSpan = 1100;
const roadStep = 100;
const roadWidth = 20;

for (let p = -500; p <= 500; p += roadStep) {
  box(
    scene,
    [roadWidth, 0.12, roadSpan],
    roadMaterial,
    [p, -0.06, 0]
  );

  box(
    scene,
    [roadSpan, 0.12, roadWidth],
    roadMaterial,
    [0, -0.06, p]
  );

  // Road centre markings.
  for (let k = -530; k <= 530; k += 14) {
    box(
      scene,
      [0.18, 0.025, 5],
      markingMaterial,
      [p, 0.012, k]
    );

    box(
      scene,
      [5, 0.025, 0.18],
      markingMaterial,
      [k, 0.012, p]
    );
  }

  // Sidewalks.
  for (const side of [-1, 1]) {
    box(
      scene,
      [1.2, 0.2, roadSpan],
      pavementMaterial,
      [p + side * 11.2, 0.01, 0]
    );

    box(
      scene,
      [roadSpan, 0.2, 1.2],
      pavementMaterial,
      [0, 0.01, p + side * 11.2]
    );
  }
}

// Deterministic random values for city layout.
let seed = 4521;

function random() {
  seed = seed * 16807 % 2147483647;
  return (seed - 1) / 2147483646;
}

// Buildings.
for (let gx = -5; gx < 5; gx++) {
  for (let gz = -5; gz < 5; gz++) {
    const centerX = gx * roadStep + 50;
    const centerZ = gz * roadStep + 50;

    const count = 2 + Math.floor(random() * 3);

    for (let i = 0; i < count; i++) {
      const width = 12 + random() * 18;
      const depth = 12 + random() * 18;
      const height = 12 + random() * 55;

      const x = centerX + (random() - 0.5) * 60;
      const z = centerZ + (random() - 0.5) * 60;

      const building = box(
        scene,
        [width, height, depth],
        buildingMaterials[
          Math.floor(random() * buildingMaterials.length)
        ],
        [x, height / 2, z],
        true
      );

      // Simple facade windows.
      const windowMaterial = material(0x30495e, 0.35, 0.25);
      const rows = Math.min(7, Math.floor(height / 5));
      const columns = Math.min(4, Math.floor(width / 4));

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
          box(
            scene,
            [0.9, 1.1, 0.08],
            windowMaterial,
            [
              x - width / 2 + (col + 0.5) * width / columns,
              2 + row * (height / rows),
              z + depth / 2 + 0.05
            ]
          );
        }
      }
    }
  }
}

// Player car.
const car = new THREE.Group();
scene.add(car);
car.position.set(0, 0.1, 12);

const body = new THREE.Group();
car.add(body);

const paint = material(0x1688c8, 0.25, 0.65);
const glass = material(0x142d41, 0.2, 0.4);
const tyre = material(0x101214, 0.9);
const rim = material(0xb8c4ce, 0.25, 0.8);

box(body, [2.15, 0.52, 4.3], paint, [0, 0.78, 0], true);
box(body, [1.62, 0.57, 2.05], glass, [0, 1.27, -0.25], true);

const wheelPivots = [];

for (const [x, z] of [
  [-1.08, -1.38],
  [1.08, -1.38],
  [-1.08, 1.38],
  [1.08, 1.38]
]) {
  const pivot = new THREE.Group();
  pivot.position.set(x, 0.48, z);
  body.add(pivot);

  const wheel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.43, 0.43, 0.3, 16),
    tyre
  );

  wheel.rotation.z = Math.PI / 2;
  pivot.add(wheel);

  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.23, 0.23, 0.32, 12),
    rim
  );

  hub.rotation.z = Math.PI / 2;
  pivot.add(hub);

  wheelPivots.push(pivot);
}

// Basic driving physics.
const keys = Object.create(null);
const touch = {
  left: false,
  right: false,
  gas: false,
  brake: false
};

let speed = 0;
let heading = 0;
let steering = 0;

window.addEventListener("keydown", event => {
  keys[event.key.toLowerCase()] = true;

  if (
    ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "]
      .includes(event.key)
  ) {
    event.preventDefault();
  }

  if (event.key.toLowerCase() === "r") resetCar();
});

window.addEventListener("keyup", event => {
  keys[event.key.toLowerCase()] = false;
});

document.querySelectorAll("[data-control]").forEach(button => {
  const name = button.dataset.control;

  const release = event => {
    event.preventDefault();
    touch[name] = false;
    button.classList.remove("on");
  };

  button.addEventListener("pointerdown", event => {
    event.preventDefault();
    touch[name] = true;
    button.classList.add("on");

    try {
      button.setPointerCapture(event.pointerId);
    } catch {}
  });

  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("lostpointercapture", release);
});

function resetCar() {
  car.position.set(0, 0.1, 12);
  speed = 0;
  heading = 0;
  steering = 0;
  car.rotation.y = 0;
}

document.querySelector("#reset")?.addEventListener("click", resetCar);

// Camera smoothing.
const lookTarget = new THREE.Vector3();
const cameraTarget = new THREE.Vector3();
const desiredCamera = new THREE.Vector3();
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const dt = Math.min(clock.getDelta(), 0.04);

  const gas =
    keys.w || keys.arrowup || touch.gas;

  const brake =
    keys.s || keys.arrowdown || touch.brake;

  const left =
    keys.a || keys.arrowleft || touch.left;

  const right =
    keys.d || keys.arrowright || touch.right;

  const handbrake = keys[" "];

  if (gas) speed += 22 * dt;
  if (brake) speed -= (speed > 1 ? 38 : 12) * dt;

  if (!gas && !brake) {
    speed *= Math.exp(-0.7 * dt);
  }

  if (handbrake) speed *= Math.exp(-2.2 * dt);

  speed = THREE.MathUtils.clamp(speed, -12, 58);

  const steerInput =
    (left ? 1 : 0) - (right ? 1 : 0);

  steering = THREE.MathUtils.damp(
    steering,
    steerInput,
    7,
    dt
  );

  const speedFactor = Math.min(Math.abs(speed) / 8, 1);

  heading +=
    steering *
    speedFactor *
    Math.sign(speed || 1) *
    1.35 *
    dt;

  car.rotation.y = heading;

  car.position.x -= Math.sin(heading) * speed * dt;
  car.position.z -= Math.cos(heading) * speed * dt;

  wheelPivots[0].rotation.y = steering * 0.45;
  wheelPivots[1].rotation.y = steering * 0.45;

  wheelPivots.forEach(wheel => {
    wheel.children[0].rotation.x += speed * dt * 0.9;
    wheel.children[1].rotation.x += speed * dt * 0.9;
  });

  // Follow camera behind the vehicle.
  desiredCamera.set(
    car.position.x + Math.sin(heading) * 9,
    car.position.y + 5.2,
    car.position.z + Math.cos(heading) * 9
  );

  camera.position.lerp(
    desiredCamera,
    1 - Math.exp(-4 * dt)
  );

  lookTarget.set(
    car.position.x - Math.sin(heading) * 4,
    car.position.y + 1.2,
    car.position.z - Math.cos(heading) * 4
  );

  camera.lookAt(lookTarget);

  const speedDisplay = document.querySelector("#speed");
  if (speedDisplay) {
    speedDisplay.textContent = String(
      Math.round(Math.abs(speed) * 3.6)
    ).padStart(3, "0");
  }

  const gearDisplay = document.querySelector("#gear");
  if (gearDisplay) {
    gearDisplay.textContent =
      "GEAR · " +
      (speed < -0.5
        ? "R"
        : speed < 1
          ? "N"
          : Math.min(6, Math.ceil(speed / 9)));
  }

  renderer.render(scene, camera);
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
});

const loading = document.querySelector("#loading");
if (loading) loading.style.display = "none";

animate();
