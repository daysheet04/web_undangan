import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const BASE = "/assets/images/templates/verdant-vow";
const CINEMATIC = `${BASE}/cinematic`;
const LAYER = `${BASE}/layers`;
export const VERDANT_CINEMATIC_DURATION = 50000;

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const smooth = (value) => {
  const x = clamp(value);
  return x * x * (3 - 2 * x);
};
const phase = (progress, start, full, leave, end) => Math.min(
  smooth((progress - start) / (full - start)),
  1 - smooth((progress - leave) / (end - leave)),
);

const CAMERA_KEYS = [
  { t: 0, pos: [0, 2.3, 29], look: [0, 2.5, 15] },
  { t: .14, pos: [0, 2.15, 18], look: [0, 2.45, 4] },
  { t: .18, pos: [0, 2.15, 13.8], look: [0, 2.8, -8.5] },
  { t: .28, pos: [0, 2.15, 13.8], look: [0, 2.8, -8.5] },
  { t: .36, pos: [1.95, 2.3, 3.4], look: [1.05, 3.1, -9.2] },
  { t: .50, pos: [1.95, 2.3, 3.4], look: [1.05, 3.1, -9.2] },
  { t: .56, pos: [-1.95, 2.3, 3.2], look: [-1.05, 3.1, -9.2] },
  { t: .68, pos: [-1.95, 2.3, 3.2], look: [-1.05, 3.1, -9.2] },
  { t: .74, pos: [0, 2.75, 5.5], look: [0, 3.05, -9.4] },
  { t: .90, pos: [0, 2.75, 5.5], look: [0, 3.05, -9.4] },
  { t: 1, pos: [0, 3.15, -2.8], look: [0, 3.35, -10.2] },
];

// Portrait screens get an authored route of their own. The pauses line up with
// the copy phases, while the lateral moves deliberately change the focal face.
const MOBILE_CAMERA_KEYS = [
  { t: 0, pos: [0, 1.82, 28.5], look: [0, 2.62, 12.5], roll: 0 },
  { t: .055, pos: [-1.08, 2.08, 24.2], look: [.42, 2.7, 6.5], roll: -.012 },
  { t: .105, pos: [.92, 2.58, 19.8], look: [-.28, 3.05, 1.2], roll: .011 },
  { t: .15, pos: [-.58, 2.28, 14.4], look: [.18, 3.24, -7.8], roll: -.008 },
  { t: .19, pos: [0, 2.82, 10.9], look: [0, 3.48, -9.35], roll: 0 },
  { t: .29, pos: [0, 2.82, 10.9], look: [0, 3.48, -9.35], roll: 0 },
  { t: .33, pos: [.68, 3.22, 8.15], look: [.34, 3.64, -9.42], roll: .008 },
  { t: .38, pos: [1.92, 2.62, 4.75], look: [.92, 3.86, -9.5], roll: .014 },
  { t: .49, pos: [1.92, 2.62, 4.75], look: [.92, 3.86, -9.5], roll: 0 },
  { t: .535, pos: [-.12, 3.08, 5.65], look: [0, 3.7, -9.48], roll: -.006 },
  { t: .585, pos: [-1.92, 2.68, 4.65], look: [-.92, 3.84, -9.5], roll: -.014 },
  { t: .69, pos: [-1.92, 2.68, 4.65], look: [-.92, 3.84, -9.5], roll: 0 },
  { t: .735, pos: [-.55, 3.38, 7.05], look: [-.18, 3.56, -9.46], roll: .006 },
  { t: .78, pos: [0, 3.72, 9.55], look: [0, 3.28, -9.45], roll: 0 },
  { t: .91, pos: [0, 3.72, 9.55], look: [0, 3.28, -9.45], roll: 0 },
  { t: .955, pos: [.38, 3.32, 5.75], look: [-.16, 3.58, -9.66], roll: .006 },
  { t: 1, pos: [0, 3.55, 2.75], look: [0, 3.66, -9.78], roll: 0 },
];

const makeRng = (seed = 1) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

function sampleCamera(progress, reducedMotion, mobile) {
  const cameraKeys = mobile ? MOBILE_CAMERA_KEYS : CAMERA_KEYS;
  let left = cameraKeys[0];
  let right = cameraKeys[cameraKeys.length - 1];
  for (let index = 1; index < cameraKeys.length; index += 1) {
    if (progress <= cameraKeys[index].t) {
      left = cameraKeys[index - 1];
      right = cameraKeys[index];
      break;
    }
  }
  const amount = smooth((progress - left.t) / Math.max(.0001, right.t - left.t));
  const position = new THREE.Vector3(...left.pos).lerp(new THREE.Vector3(...right.pos), amount);
  const target = new THREE.Vector3(...left.look).lerp(new THREE.Vector3(...right.look), amount);
  const roll = THREE.MathUtils.lerp(left.roll || 0, right.roll || 0, amount);
  if (reducedMotion) {
    position.lerp(new THREE.Vector3(0, 2.5, 10.5), .86);
    target.lerp(new THREE.Vector3(0, 3, -9), .86);
  }
  return { position, target, roll };
}

function makeStoneTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const context = canvas.getContext("2d");
  const rng = makeRng(41);
  context.fillStyle = "#d8cbae";
  context.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 64) {
    const offset = (Math.floor(y / 64) % 2) * 64;
    for (let x = -offset; x < 512; x += 128) {
      const tone = 205 + Math.floor(rng() * 22);
      context.fillStyle = `rgb(${tone + 9},${tone + 2},${tone - 14})`;
      context.fillRect(x + 3, y + 3, 122, 58);
      context.strokeStyle = "rgba(112,101,78,.22)";
      context.strokeRect(x + 3, y + 3, 122, 58);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 8);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function addShadow(scene, x, z, width, depth, opacity = .18) {
  const geometry = new THREE.CircleGeometry(1, 32);
  geometry.scale(width, depth, 1);
  const material = new THREE.MeshBasicMaterial({ color: 0x183526, transparent: true, opacity, depthWrite: false });
  const shadow = new THREE.Mesh(geometry, material);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(x, .025, z);
  scene.add(shadow);
  return shadow;
}

function makeFloralCluster(scale = 1, seed = 1) {
  const group = new THREE.Group();
  const rng = makeRng(seed);
  const flowerCount = 10;
  const petalGeometry = new THREE.SphereGeometry(.18, 9, 6);
  const centerGeometry = new THREE.IcosahedronGeometry(.075, 1);
  const leafGeometry = new THREE.SphereGeometry(.2, 9, 6);
  const stemGeometry = new THREE.CylinderGeometry(.018, .026, .85, 6);
  const petalMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .78, vertexColors: true, emissive: 0xfff5df, emissiveIntensity: .24 });
  const centerMaterial = new THREE.MeshStandardMaterial({ color: 0xc6a75e, roughness: .72, vertexColors: true });
  const leafMaterial = new THREE.MeshStandardMaterial({ color: 0x58775a, roughness: .88 });
  const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x4b704f, roughness: .92 });
  const petals = new THREE.InstancedMesh(petalGeometry, petalMaterial, flowerCount * 5);
  const centers = new THREE.InstancedMesh(centerGeometry, centerMaterial, flowerCount);
  const leaves = new THREE.InstancedMesh(leafGeometry, leafMaterial, 22);
  const stems = new THREE.InstancedMesh(stemGeometry, stemMaterial, 13);
  const matrix = new THREE.Matrix4();
  const flowerColors = [0xfff9e8, 0xf1e2bf, 0xf5d8cf];
  for (let flower = 0; flower < flowerCount; flower += 1) {
    const center = new THREE.Vector3((rng() - .5) * 1.45, .18 + rng() * .84, .2 + rng() * .22);
    const size = .68 + rng() * .62;
    const tint = new THREE.Color(flowerColors[flower % flowerColors.length]);
    matrix.compose(center, new THREE.Quaternion(), new THREE.Vector3(size, size, size));
    centers.setMatrixAt(flower, matrix);
    centers.setColorAt(flower, flower % 3 === 1 ? new THREE.Color(0xc29c52) : new THREE.Color(0xd2b064));
    for (let petal = 0; petal < 5; petal += 1) {
      const angle = petal / 5 * Math.PI * 2 + rng() * .13;
      const position = center.clone().add(new THREE.Vector3(Math.cos(angle) * .15 * size, Math.sin(angle) * .15 * size, .02 + rng() * .025));
      const quaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler((rng() - .5) * .35, (rng() - .5) * .35, angle));
      matrix.compose(position, quaternion, new THREE.Vector3(1.16 * size, .53 * size, .28 * size));
      const index = flower * 5 + petal;
      petals.setMatrixAt(index, matrix);
      petals.setColorAt(index, tint);
    }
  }
  for (let index = 0; index < 22; index += 1) {
    const position = new THREE.Vector3((rng() - .5) * 1.9, rng() * .78 - .05, -.18 + (rng() - .5) * .66);
    const quaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler((rng() - .5) * 1.4, rng() * Math.PI, (rng() - .5) * 1.8));
    matrix.compose(position, quaternion, new THREE.Vector3(.62 + rng() * .52, .13 + rng() * .13, .95 + rng() * .7));
    leaves.setMatrixAt(index, matrix);
  }
  for (let index = 0; index < 13; index += 1) {
    const x = (rng() - .5) * 1.35;
    const z = (rng() - .5) * .55;
    const height = .45 + rng() * .62;
    matrix.compose(new THREE.Vector3(x, height * .5, z), new THREE.Quaternion().setFromEuler(new THREE.Euler((rng() - .5) * .24, 0, (rng() - .5) * .35)), new THREE.Vector3(1, height, 1));
    stems.setMatrixAt(index, matrix);
  }
  petals.instanceMatrix.needsUpdate = true;
  centers.instanceMatrix.needsUpdate = true;
  leaves.instanceMatrix.needsUpdate = true;
  stems.instanceMatrix.needsUpdate = true;
  petals.instanceColor.needsUpdate = true;
  centers.instanceColor.needsUpdate = true;
  petals.castShadow = centers.castShadow = leaves.castShadow = stems.castShadow = true;
  group.add(stems, leaves, petals, centers);
  group.scale.setScalar(scale);
  group.userData.phase = rng() * Math.PI * 2;
  return group;
}

function addArch(scene, z, scale, altar = false) {
  const group = new THREE.Group();
  const stone = new THREE.MeshStandardMaterial({ color: altar ? 0xe4d7bb : 0xd7c7a5, roughness: .5, metalness: .04 });
  const gold = new THREE.MeshStandardMaterial({ color: 0xb88b45, roughness: .35, metalness: .45 });
  const pillarGeometry = new THREE.CylinderGeometry(.28, .36, 4.5, 18);
  for (const x of [-4.15, 4.15]) {
    const pillar = new THREE.Mesh(pillarGeometry, stone);
    pillar.position.set(x, 2.25, 0);
    pillar.castShadow = true;
    pillar.receiveShadow = true;
    group.add(pillar);
  }
  const arch = new THREE.Mesh(new THREE.TorusGeometry(4.15, .19, 12, 64, Math.PI), gold);
  arch.position.y = 4.45;
  arch.castShadow = true;
  group.add(arch);
  group.position.z = z;
  group.scale.setScalar(scale);
  scene.add(group);
  return group;
}

function addAisleFlorals(scene) {
  const potMaterial = new THREE.MeshStandardMaterial({ color: 0xbda276, roughness: .62 });
  const potGeometry = new THREE.CylinderGeometry(.28, .38, .9, 16);
  const anchors = [];
  for (const z of [19, 14, 9, 4, -1, -6]) {
    for (const side of [-1, 1]) {
      const pot = new THREE.Mesh(potGeometry, potMaterial);
      pot.position.set(side * 3.55, .45, z);
      pot.castShadow = true;
      pot.receiveShadow = true;
      scene.add(pot);
      anchors.push({ x: side * 3.55, y: 1.38, z, side });
    }
  }
  return anchors;
}

function addFallingLeaves(scene, compact) {
  const rng = makeRng(212);
  const geometry = new THREE.CircleGeometry(.072, 6);
  geometry.scale(.62, 1.45, 1);
  const materials = [0x718161, 0x839064, 0x9b8d54].map((color) => new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: .58,
    side: THREE.DoubleSide,
    depthWrite: false,
  }));
  return Array.from({ length: compact ? 9 : 17 }, (_, index) => {
    const side = rng() < .5 ? -1 : 1;
    const leaf = new THREE.Mesh(geometry, materials[index % materials.length]);
    const baseX = side * (2.4 + rng() * 6.8);
    leaf.position.set(baseX, 2.4 + rng() * 5, -11 + rng() * 37);
    leaf.scale.setScalar(.62 + rng() * .95);
    leaf.renderOrder = index % 4 === 0 ? 7 : 2;
    leaf.userData = {
      baseX,
      speed: .12 + rng() * .2,
      drift: .26 + rng() * .48,
      sway: .16 + rng() * .42,
      phase: rng() * Math.PI * 2,
      index,
    };
    scene.add(leaf);
    return leaf;
  });
}

function addSwayingVines(scene) {
  const vines = [];
  // Keep these tiny animated details self-lit; shadowed standard materials made
  // their narrow stems read as black scratches against the bright panorama.
  const stemMaterial = new THREE.MeshBasicMaterial({ color: 0x708267 });
  const leafMaterial = new THREE.MeshBasicMaterial({ color: 0x87977a });
  for (const side of [-1, 1]) {
    const vine = new THREE.Group();
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(.018, .024, 1.28, 6), stemMaterial);
    stem.position.y = -.55;
    stem.rotation.z = side * .08;
    vine.add(stem);
    for (let index = 0; index < 5; index += 1) {
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(.12, 8, 5), leafMaterial);
      leaf.scale.set(.42, .12, .9);
      leaf.position.set(side * (.08 + (index % 2) * .08), -.12 - index * .23, .03);
      leaf.rotation.set(.15, index * .7, side * (.6 + index * .08));
      vine.add(leaf);
    }
    vine.position.set(side * 3.35, 7.05, -9.25);
    vine.userData = { phase: side > 0 ? 1.7 : .2, baseRotationZ: side * .045 };
    scene.add(vine);
    vines.push(vine);
  }
  return vines;
}

function addImagePlane(scene, texture, { x, y, z, width, height, rotationY = 0, alphaTest = .03, renderOrder = 4 }) {
  const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, alphaTest, side: THREE.DoubleSide, depthWrite: true, toneMapped: true });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
  plane.position.set(x, y, z);
  plane.rotation.y = rotationY;
  plane.renderOrder = renderOrder;
  scene.add(plane);
  return plane;
}

function addRealisticGuestRows(scene, textures) {
  const rows = [16, 11, 6, 1];
  const guests = [];
  rows.forEach((z, rowIndex) => {
    for (const side of [-1, 1]) {
      for (const lane of [0, 1]) {
        // Each pair reads man–woman from left to right. Both guests use dedicated
        // head-direction assets so their chairs and bodies never need mirroring.
        const isLeftSeat = side < 0 ? lane === 1 : lane === 0;
        const alternate = (rowIndex + (side > 0 ? 1 : 0)) % 2;
        const variant = isLeftSeat
          ? (alternate ? 3 : 1)
          : (alternate ? 2 : 0);
        const guestAsset = side < 0 ? textures.lookRight[variant] : textures.lookLeft[variant];
        const height = 2.58 + ((rowIndex + lane) % 2) * .08;
        const x = side * (4.05 + lane * 1.45);
        const seatZ = z - lane * .55;
        const guest = addImagePlane(scene, guestAsset.texture, {
          x,
          y: height * .5 + .015,
          z: seatZ,
          width: height * guestAsset.aspect,
          height,
          rotationY: side * -.035,
          alphaTest: .14,
          renderOrder: 5,
        });
        guests.push(guest);
        addShadow(scene, x, seatZ + .08, .72, .43, .12);
      }
    }
  });
  return guests;
}

function addFloralPhoto(parent, texture, { x, y, z, width, height, rotationY = 0, rotationZ = 0, mirror = false }) {
  const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, alphaTest: .035, depthWrite: false, side: THREE.DoubleSide, toneMapped: true, color: 0xfff5df });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
  plane.position.set(x, y, z);
  plane.rotation.set(0, rotationY, rotationZ);
  if (mirror) plane.scale.x = -1;
  plane.renderOrder = 7;
  parent.add(plane);
  return plane;
}

async function buildWorld(scene, renderer, onAssetProgress) {
  const loader = new THREE.TextureLoader();
  const sources = [
    `${CINEMATIC}/distant-garden-panorama-v2.webp`,
    `${CINEMATIC}/short-grass-texture-v1.webp`,
    `${LAYER}/couple-cinematic.webp`,
    `${CINEMATIC}/guests-seated-left-inward-v2.webp`,
    `${CINEMATIC}/guests-standing-right-inward-v2.webp`,
    `${CINEMATIC}/seated-guest-sage-chair-v1.webp`,
    `${CINEMATIC}/seated-guest-navy-chair-look-right-v2.webp`,
    `${CINEMATIC}/seated-guest-rose-chair-v1.webp`,
    `${CINEMATIC}/seated-guest-taupe-chair-look-right-v2.webp`,
    `${CINEMATIC}/seated-guest-sage-chair-look-left-inward-v3.webp`,
    `${CINEMATIC}/seated-guest-navy-chair-look-left-inward-v3.webp`,
    `${CINEMATIC}/seated-guest-rose-chair-look-left-inward-v3.webp`,
    `${CINEMATIC}/seated-guest-taupe-chair-look-left-inward-v3.webp`,
    `${CINEMATIC}/altar-floral-garland-v3.webp`,
    `${CINEMATIC}/altar-pedestal-left-v1.webp`,
    `${CINEMATIC}/altar-pedestal-right-v1.webp`,
    `${CINEMATIC}/aisle-bouquet-v1.webp`,
  ];
  let loaded = 0;
  const textures = await Promise.all(sources.map((source) => loader.loadAsync(source).then((texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    loaded += 1;
    onAssetProgress(loaded, sources.length);
    return texture;
  })));
  const [
    landscape,
    grassTexture,
    couple,
    seatedGuests,
    standingGuests,
    guestSageRight,
    guestNavyRight,
    guestRoseRight,
    guestTaupeRight,
    guestSageLeftInward,
    guestNavyLeftInward,
    guestRoseLeftInward,
    guestTaupeLeftInward,
    altarGarland,
    pedestalLeft,
    pedestalRight,
    aisleBouquet,
  ] = textures;

  const compact = renderer.domElement.clientWidth <= 800;

  scene.background = new THREE.Color(0xe7d8b8);
  scene.fog = new THREE.FogExp2(0xb9c7b1, .012);
  scene.add(new THREE.HemisphereLight(0xfff3d6, 0x35503b, 1.28));
  const sunlight = new THREE.DirectionalLight(0xffddb0, 2.5);
  sunlight.position.set(-10, 16, 12);
  sunlight.castShadow = true;
  sunlight.shadow.mapSize.set(renderer.domElement.clientWidth < 700 ? 512 : 1024, renderer.domElement.clientWidth < 700 ? 512 : 1024);
  sunlight.shadow.camera.left = sunlight.shadow.camera.bottom = -22;
  sunlight.shadow.camera.right = sunlight.shadow.camera.top = 22;
  sunlight.shadow.camera.near = 1;
  sunlight.shadow.camera.far = 70;
  sunlight.shadow.bias = -.0007;
  scene.add(sunlight);

  const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(88, 49.5), new THREE.MeshBasicMaterial({ map: landscape, fog: true }));
  backdrop.position.set(0, 9.2, -20);
  scene.add(backdrop);

  grassTexture.anisotropy = Math.min(6, renderer.capabilities.getMaxAnisotropy());
  grassTexture.wrapS = grassTexture.wrapT = THREE.RepeatWrapping;
  grassTexture.repeat.set(compact ? 5 : 7, compact ? 12 : 16);
  grassTexture.minFilter = THREE.LinearMipmapLinearFilter;
  grassTexture.magFilter = THREE.LinearFilter;
  grassTexture.needsUpdate = true;
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(58, 70), new THREE.MeshStandardMaterial({
    map: grassTexture,
    bumpMap: grassTexture,
    bumpScale: .018,
    color: 0xdbe1d5,
    roughness: .98,
  }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, -.08, 7);
  ground.receiveShadow = true;
  scene.add(ground);

  const path = new THREE.Mesh(new THREE.PlaneGeometry(6.5, 54), new THREE.MeshStandardMaterial({ map: makeStoneTexture(), color: 0xf2e6c9, roughness: .76 }));
  path.rotation.x = -Math.PI / 2;
  path.position.set(0, 0, 7);
  path.receiveShadow = true;
  scene.add(path);

  const borderMaterial = new THREE.MeshStandardMaterial({ color: 0xc8b88d, roughness: .72 });
  for (const x of [-3.35, 3.35]) {
    const border = new THREE.Mesh(new THREE.BoxGeometry(.16, .12, 54), borderMaterial);
    border.position.set(x, .02, 7);
    border.receiveShadow = true;
    scene.add(border);
  }

  addRealisticGuestRows(scene, {
    lookRight: [
      { texture: guestSageRight, aspect: 983 / 1380 },
      { texture: guestNavyRight, aspect: 960 / 1639 },
      { texture: guestRoseRight, aspect: 1007 / 1448 },
      { texture: guestTaupeRight, aspect: 956 / 1646 },
    ],
    lookLeft: [
      { texture: guestSageLeftInward, aspect: 1060 / 1484 },
      { texture: guestNavyLeftInward, aspect: 959 / 1639 },
      { texture: guestRoseLeftInward, aspect: 1046 / 1504 },
      { texture: guestTaupeLeftInward, aspect: 956 / 1646 },
    ],
  });
  const floralGroups = addSwayingVines(scene);
  const altarArch = addArch(scene, -9.7, .95, true);
  const archFloral = addImagePlane(scene, altarGarland, {
    x: 0,
    y: 5.52,
    z: -9.5,
    width: 9.45,
    height: 6.3,
    alphaTest: .08,
    renderOrder: 5,
  });
  const floralAnchors = addAisleFlorals(scene);
  floralAnchors.forEach((anchor) => addFloralPhoto(scene, aisleBouquet, {
    ...anchor,
    z: anchor.z + .16,
    width: 1.92,
    height: 1.28,
    rotationY: anchor.side * -.18,
    rotationZ: anchor.side * .08,
    mirror: anchor.side > 0,
  }));

  const platformMaterial = new THREE.MeshStandardMaterial({ color: 0xe4d7b9, roughness: .55 });
  for (let level = 0; level < 3; level += 1) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(10.8 - level * .75, .28, 2.2), platformMaterial);
    step.position.set(0, .14 + level * .28, -8.7 - level * .72);
    step.castShadow = true;
    step.receiveShadow = true;
    scene.add(step);
  }

  const pedestalHeight = compact ? 3.05 : 3.35;
  const pedestalZ = -8.82;
  const leftPedestal = addImagePlane(scene, pedestalLeft, {
    x: -3.05,
    y: pedestalHeight * .5,
    z: pedestalZ,
    width: pedestalHeight * (1024 / 1536),
    height: pedestalHeight,
    rotationY: .05,
    alphaTest: .06,
    renderOrder: 6,
  });
  const rightPedestal = addImagePlane(scene, pedestalRight, {
    x: 3.05,
    y: pedestalHeight * .5,
    z: pedestalZ,
    width: pedestalHeight * (1024 / 1536),
    height: pedestalHeight,
    rotationY: -.05,
    alphaTest: .06,
    renderOrder: 6,
  });
  addShadow(scene, -3.05, pedestalZ + .12, .72, .42, .2);
  addShadow(scene, 3.05, pedestalZ + .12, .72, .42, .2);

  const couplePlane = addImagePlane(scene, couple, {
    x: 0,
    y: compact ? 3.35 : 3.72,
    z: -9.45,
    width: compact ? 3.83 : 4.22,
    height: compact ? 6.8 : 7.5,
    alphaTest: .035,
    renderOrder: 5,
  });
  addShadow(scene, 0, -9.05, 2.05, .74, .26);

  const seatedHeight = 2.72;
  const standingHeight = 3.18;
  const seated = addImagePlane(scene, seatedGuests, {
    x: -5,
    y: seatedHeight * .5 + .015,
    z: -3.65,
    width: seatedHeight * (1374 / 1145),
    height: seatedHeight,
    rotationY: .05,
    alphaTest: .08,
  });
  const standing = addImagePlane(scene, standingGuests, {
    x: 5,
    y: standingHeight * .5 + .015,
    z: -3.65,
    width: standingHeight * (1312 / 1199),
    height: standingHeight,
    rotationY: -.05,
    alphaTest: .08,
  });
  addShadow(scene, -5, -3.52, 1.58, .48, .15);
  addShadow(scene, 5, -3.52, 1.62, .46, .15);

  const fallingLeaves = addFallingLeaves(scene, compact);
  return { floralGroups, fallingLeaves, seated, standing, couplePlane, archFloral, leftPedestal, rightPedestal };
}

function disposeWorld(scene, renderer) {
  scene.traverse((object) => {
    object.geometry?.dispose?.();
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.filter(Boolean).forEach((material) => {
      material.map?.dispose?.();
      material.dispose?.();
    });
  });
  renderer.dispose();
  renderer.forceContextLoss?.();
}

export default function VerdantCinematicJourney({ invitation: i, bride, groom, brideFull, groomFull, dateLabel, runId = 0, active = true, onReady, onComplete }) {
  const mountRef = useRef(null);
  const overlayRef = useRef(null);
  const controllerRef = useRef(null);
  const callbackRef = useRef(onComplete);
  const readyCallbackRef = useRef(onReady);
  const activeRef = useRef(active);
  const [ready, setReady] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState("Menyiapkan taman…");
  const [paused, setPaused] = useState(false);
  const [failed, setFailed] = useState(false);
  callbackRef.current = onComplete;
  readyCallbackRef.current = onReady;
  activeRef.current = active;

  useEffect(() => {
    const mount = mountRef.current;
    const overlay = overlayRef.current;
    if (!mount || !overlay) return undefined;
    let disposed = false;
    let animationFrame = 0;
    let renderer;
    let scene;
    let resizeObserver;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = window.matchMedia("(max-width: 800px)").matches;
    const lowPower = mobile || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) || (navigator.deviceMemory && navigator.deviceMemory <= 4);
    const state = { timeline: 0, ambient: 0, last: performance.now(), paused: false, hidden: document.hidden, completed: false };
    setReady(false);
    setFailed(false);
    setPaused(false);
    setLoadingLabel("Menyiapkan taman…");

    const finish = (reason = "complete") => {
      if (state.completed) return;
      state.completed = true;
      state.timeline = VERDANT_CINEMATIC_DURATION;
      overlay.style.setProperty("--vv3-progress", "1");
      callbackRef.current?.(reason);
    };
    controllerRef.current = {
      toggle() {
        if (state.completed) return;
        state.paused = !state.paused;
        state.last = performance.now();
        setPaused(state.paused);
      },
      skip() { finish("skip"); },
    };

    const handleVisibility = () => {
      state.hidden = document.hidden;
      state.last = performance.now();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    const updateOverlay = (progress) => {
      overlay.style.setProperty("--vv3-progress", progress.toFixed(4));
      overlay.style.setProperty("--vv3-names", phase(progress, .145, .175, .275, .31).toFixed(4));
      overlay.style.setProperty("--vv3-bride", phase(progress, .34, .37, .49, .53).toFixed(4));
      overlay.style.setProperty("--vv3-groom", phase(progress, .54, .57, .67, .71).toFixed(4));
      overlay.style.setProperty("--vv3-event", phase(progress, .72, .75, .90, .94).toFixed(4));
      overlay.style.setProperty("--vv3-finale", smooth((progress - .91) / .09).toFixed(4));
    };

    const init = async () => {
      try {
        scene = new THREE.Scene();
        renderer = new THREE.WebGLRenderer({ antialias: !lowPower, alpha: false, powerPreference: lowPower ? "low-power" : "high-performance" });
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = .94;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = lowPower ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowPower ? 1.25 : 1.75));
        renderer.setSize(mount.clientWidth, mount.clientHeight, false);
        mount.replaceChildren(renderer.domElement);

        const camera = new THREE.PerspectiveCamera(mobile ? 56 : 44, mount.clientWidth / Math.max(1, mount.clientHeight), .1, 100);
        const world = await buildWorld(scene, renderer, (loaded, total) => setLoadingLabel(`Menyiapkan taman ${loaded}/${total}`));
        if (disposed) return;
        setReady(true);
        readyCallbackRef.current?.();
        state.last = performance.now();

        const resize = () => {
          const width = Math.max(1, mount.clientWidth);
          const height = Math.max(1, mount.clientHeight);
          renderer.setSize(width, height, false);
          camera.aspect = width / height;
          camera.fov = width <= 800 ? 56 : 44;
          camera.updateProjectionMatrix();
        };
        resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(mount);

        const render = (now) => {
          if (disposed) return;
          // The timeline follows elapsed wall time, not frame count. This keeps
          // the cinematic close to 50 seconds on both 120 Hz and slower phones.
          const delta = Math.min(1000, Math.max(0, now - state.last));
          state.last = now;
          if (!state.hidden) {
            if (activeRef.current) state.ambient += delta;
            if (activeRef.current && !state.paused && !state.completed) state.timeline = Math.min(VERDANT_CINEMATIC_DURATION, state.timeline + delta);
          }
          const progress = state.timeline / VERDANT_CINEMATIC_DURATION;
          const seconds = state.ambient / 1000;
          const cameraFrame = sampleCamera(progress, reducedMotion, mobile);
          camera.position.copy(cameraFrame.position);
          camera.lookAt(cameraFrame.target);
          if (mobile && cameraFrame.roll) camera.rotateZ(cameraFrame.roll);

          world.floralGroups.forEach((group, index) => {
            group.rotation.z = (group.userData.baseRotationZ || 0) + Math.sin(seconds * .42 + group.userData.phase + index * .18) * .012;
          });
          world.fallingLeaves.forEach((leaf) => {
            const data = leaf.userData;
            leaf.position.x = data.baseX + Math.sin(seconds * data.drift + data.phase) * data.sway;
            leaf.position.y -= data.speed * delta / 1000;
            leaf.rotation.x = seconds * (.48 + data.drift * .25) + data.phase;
            leaf.rotation.y = seconds * .36 + data.phase * .7;
            leaf.rotation.z = Math.sin(seconds * .52 + data.phase) * 1.1;
            if (leaf.position.y < .24) leaf.position.y = 6.4 + (data.index % 5) * .38;
          });
          world.seated.rotation.z = Math.sin(seconds * .28) * .0018;
          world.standing.rotation.z = Math.sin(seconds * .25 + 1.7) * .0015;

          updateOverlay(progress);
          renderer.render(scene, camera);

          if (state.timeline >= VERDANT_CINEMATIC_DURATION && !state.completed) finish("complete");
          if (!state.completed) animationFrame = window.requestAnimationFrame(render);
        };
        animationFrame = window.requestAnimationFrame(render);
      } catch (error) {
        console.error("Verdant cinematic could not start", error);
        if (!disposed) {
          setFailed(true);
          setReady(true);
          readyCallbackRef.current?.();
          state.last = performance.now();
          const renderFallback = (now) => {
            if (disposed) return;
            const delta = Math.min(1000, Math.max(0, now - state.last));
            state.last = now;
            if (activeRef.current && !state.hidden && !state.paused && !state.completed) state.timeline = Math.min(VERDANT_CINEMATIC_DURATION, state.timeline + delta);
            updateOverlay(state.timeline / VERDANT_CINEMATIC_DURATION);
            if (state.timeline >= VERDANT_CINEMATIC_DURATION && !state.completed) finish("complete");
            if (!state.completed) animationFrame = window.requestAnimationFrame(renderFallback);
          };
          animationFrame = window.requestAnimationFrame(renderFallback);
        }
      }
    };

    init();
    return () => {
      disposed = true;
      controllerRef.current = null;
      document.removeEventListener("visibilitychange", handleVisibility);
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      resizeObserver?.disconnect();
      if (scene && renderer) disposeWorld(scene, renderer);
      mount.replaceChildren();
    };
  }, [runId]);

  return (
    <div className={`vv3-flight ${ready ? "is-ready" : "is-loading"} ${paused ? "is-paused" : ""} ${failed ? "is-fallback" : ""}`}>
      <div className="vv3-canvas" ref={mountRef} aria-hidden="true" />
      {failed && <div className="vv3-static-world" aria-hidden="true" />}
      <div className="vv3-overlay" ref={overlayRef}>
        <div className="vv3-copy vv3-copy-names">
          <small>The wedding journey of</small>
          <h1>{bride}<i>&amp;</i>{groom}</h1>
          <p>Dengan penuh rasa syukur, kami mengundang Anda menyusuri hari bahagia kami.</p>
        </div>
        <div className="vv3-copy vv3-copy-bride">
          <small>Mempelai wanita</small>
          <h2>{brideFull}</h2>
          <p>Putri dari<br /><b>{i.bride_father || "Bapak"}</b> &amp; <b>{i.bride_mother || "Ibu"}</b></p>
        </div>
        <div className="vv3-copy vv3-copy-groom">
          <small>Mempelai pria</small>
          <h2>{groomFull}</h2>
          <p>Putra dari<br /><b>{i.groom_father || "Bapak"}</b> &amp; <b>{i.groom_mother || "Ibu"}</b></p>
        </div>
        <div className="vv3-copy vv3-copy-event">
          <small>Hari yang kami nantikan</small>
          <h2>{dateLabel}</h2>
          <p><b>{i.venue_name || "Lokasi Pernikahan"}</b>{i.venue_address && <><br />{i.venue_address}</>}</p>
        </div>
        <div className="vv3-finale"><small>Perjalanan berlanjut</small><span /></div>
        <div className="vv3-controls" aria-label="Kontrol cinematic">
          <button type="button" onClick={() => controllerRef.current?.toggle()}>{paused ? "Lanjutkan" : "Jeda"}</button>
          <button type="button" onClick={() => controllerRef.current?.skip()}>Lewati Cinematic</button>
        </div>
        <div className="vv3-progress" aria-hidden="true"><i /></div>
      </div>
      <div className="vv3-loader" role="status" aria-hidden={ready}><i /><span>{loadingLabel}</span></div>
    </div>
  );
}
