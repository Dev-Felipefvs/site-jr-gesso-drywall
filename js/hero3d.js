/* Hero 3D — JR Gesso e Drywall
   Monograma JR feito de placas arredondadas (como chapas de drywall), em material acetinado
   translúcido com reflexo vermelho. Uma luz rasante gira e arrasta a sombra pela parede de gesso.
   O pó de gesso chega, monta a marca, depois a desfaz e volta a montar.
   Sem WebGL ou com "reduzir movimento": fica a imagem estática (.hero__poster). */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const hero = document.querySelector('.hero');
const stage = hero && hero.querySelector('.hero__stage');
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const lite = matchMedia('(max-width: 760px), (pointer: coarse)').matches;
const still = /[?&]still\b/.test(location.search);

function webglOk() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); }
  catch (e) { return false; }
}

if (stage && (!reduce.matches || still) && webglOk()) start();

function start() {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: still });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, lite ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.localClippingEnabled = true;
  const canvas = renderer.domElement;
  canvas.className = 'hero__canvas';
  canvas.setAttribute('aria-hidden', 'true');
  stage.appendChild(canvas);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0f0f10);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0, 12);

  /* ---------- parede de gesso (relevo sutil que aparece com a luz rasante) ---------- */
  const grain = document.createElement('canvas'); grain.width = grain.height = 256;
  const gg = grain.getContext('2d'); const id = gg.createImageData(256, 256);
  for (let i = 0; i < id.data.length; i += 4) { const v = 118 + Math.random() * 30; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
  gg.putImageData(id, 0, 0);
  // passadas de desempenadeira: manchas largas e suaves
  gg.filter = 'blur(6px)'; gg.globalAlpha = .18;
  for (let k = 0; k < 40; k++) { gg.fillStyle = Math.random() > .5 ? '#fff' : '#000'; gg.beginPath(); gg.ellipse(Math.random() * 256, Math.random() * 256, 30 + Math.random() * 50, 8 + Math.random() * 14, Math.random() * 3, 0, 7); gg.fill(); }
  gg.filter = 'none';
  const grainTex = new THREE.CanvasTexture(grain); grainTex.wrapS = grainTex.wrapT = THREE.RepeatWrapping; grainTex.repeat.set(9, 6);
  const wall = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 40),
    new THREE.MeshStandardMaterial({ color: 0x8b8987, roughness: .96, metalness: 0, bumpMap: grainTex, bumpScale: .9, envMapIntensity: .04 })
  );
  wall.position.z = -1.7; wall.receiveShadow = true; scene.add(wall);

  /* ---------- luzes ---------- */
  scene.add(new THREE.HemisphereLight(0xf3efe8, 0x18120f, .12));
  const spot = new THREE.SpotLight(0xfff1e2, 200, 0, .42, .9, 2);
  spot.castShadow = true;
  spot.shadow.mapSize.set(lite ? 1024 : 2048, lite ? 1024 : 2048);
  spot.shadow.bias = -0.0005; spot.shadow.normalBias = .02;
  spot.shadow.camera.near = 2; spot.shadow.camera.far = 40;
  scene.add(spot); scene.add(spot.target);
  // contraluz vermelha vinda de trás da parede: acende só as bordas da marca
  const rim = new THREE.DirectionalLight(0xe3232c, 7); scene.add(rim); scene.add(rim.target);
  const fill = new THREE.DirectionalLight(0xdfe6ff, .25); fill.position.set(-4, -2, 6); scene.add(fill);

  /* ---------- monograma JR (placas com folga entre si) ---------- */
  // [centroX, centroY, largura, altura, rotação]
  const SLABS = [
    [1.2, 1.785, .5, 2.43, 0],      // J haste
    [.885, .25, 1.03, .5, 0],       // J base
    [.05, .5, .5, 1.0, 0],          // J volta
    [2.15, 1.5, .5, 3.0, 0],        // R haste
    [2.985, 2.75, 1.03, .5, 0],     // R topo
    [3.82, 2.285, .5, 1.43, 0],     // R bojo
    [2.985, 1.32, 1.03, .44, 0],    // R meio
    [3.55, .52, .5, 1.5, .77]       // R perna
  ];
  const ACCENT = [1.68, 2.62, .2, .66, -.38]; // o "apóstrofo" da marca J'R, em vermelho
  const OX = 1.94, OY = 1.5, D = .5, SEG = lite ? 3 : 4, RAD = .09;
  const slab = ([x, y, w, h, r]) => { const g = new RoundedBoxGeometry(w, h, D, SEG, RAD); g.rotateZ(r); g.translate(x - OX, y - OY, 0); return g; };
  const markGeo = mergeGeometries(SLABS.map(slab));
  const accentGeo = slab(ACCENT);

  const planeA = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0); // mostra x < frente de montagem
  const planeB = new THREE.Plane(new THREE.Vector3(1, 0, 0), 0);  // mostra x > frente de dispersão
  const clipping = [planeA, planeB];

  const markMat = new THREE.MeshPhysicalMaterial({
    color: 0xf6f3ee, roughness: lite ? .16 : .14, metalness: 0,
    transmission: lite ? 0 : .4, thickness: 1.4, ior: 1.42,
    attenuationColor: new THREE.Color(0xc3262d), attenuationDistance: 2.2,
    clearcoat: 1, clearcoatRoughness: .14, iridescence: .7, iridescenceIOR: 1.3, iridescenceThicknessRange: [180, 520],
    envMapIntensity: 1.5, clippingPlanes: clipping, clipShadows: true
  });
  const accentMat = new THREE.MeshPhysicalMaterial({
    color: 0xc0161d, roughness: .24, clearcoat: 1, clearcoatRoughness: .1,
    emissive: 0x2a0002, envMapIntensity: .7, clippingPlanes: clipping, clipShadows: true
  });
  const group = new THREE.Group(); scene.add(group);
  const mark = new THREE.Mesh(markGeo, markMat); mark.castShadow = true; group.add(mark);
  const accent = new THREE.Mesh(accentGeo, accentMat); accent.castShadow = true; group.add(accent);
  markGeo.computeBoundingBox();
  const MINX = markGeo.boundingBox.min.x, MAXX = markGeo.boundingBox.max.x;

  /* ---------- pó de gesso ---------- */
  const COUNT = lite ? 1700 : 3800;
  const target = new Float32Array(COUNT * 3), startP = new Float32Array(COUNT * 3), scatter = new Float32Array(COUNT * 3), rnd = new Float32Array(COUNT * 4);
  const sMark = new MeshSurfaceSampler(new THREE.Mesh(markGeo)).build();
  const sAcc = new MeshSurfaceSampler(new THREE.Mesh(accentGeo)).build();
  const v = new THREE.Vector3();
  for (let i = 0; i < COUNT; i++) {
    const red = i < COUNT * .06;
    (red ? sAcc : sMark).sample(v);
    target.set([v.x, v.y, v.z], i * 3);
    const a = Math.random() * Math.PI * 2, rr = 2.5 + Math.random() * 4.5;
    startP.set([v.x - 4.5 + Math.cos(a) * rr * .6, v.y - 1.2 + Math.sin(a) * rr * .55, v.z + 1 + Math.random() * 3], i * 3);
    scatter.set([v.x + 2.2 + Math.random() * 3.5, v.y + .8 + Math.random() * 2.8, v.z - .5 + Math.random() * 2.5], i * 3);
    rnd.set([Math.random(), Math.random(), red ? 1 : 0, Math.random()], i * 4);
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(target, 3));
  pGeo.setAttribute('aStart', new THREE.BufferAttribute(startP, 3));
  pGeo.setAttribute('aScatter', new THREE.BufferAttribute(scatter, 3));
  pGeo.setAttribute('aRand', new THREE.BufferAttribute(rnd, 4));
  const pMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uA: { value: 0 }, uS: { value: 0 }, uT: { value: 0 }, uPx: { value: renderer.getPixelRatio() }, uSize: { value: lite ? 30 : 34 }, uMin: { value: MINX }, uMax: { value: MAXX } },
    vertexShader: /* glsl */`
      attribute vec3 aStart; attribute vec3 aScatter; attribute vec4 aRand;
      uniform float uA, uS, uT, uPx, uSize, uMin, uMax;
      varying float vA; varying float vRed;
      void main(){
        float xn = (position.x - uMin) / (uMax - uMin);
        float a = clamp(uA * 1.7 - xn * .7 - aRand.w * .12, 0., 1.); a = 1. - pow(1. - a, 3.);
        float s = clamp(uS * 1.7 - xn * .7 - aRand.w * .12, 0., 1.); s = s * s;
        vec3 sw = vec3(sin(uT * 1.3 + aRand.x * 6.28), cos(uT * 1.1 + aRand.y * 6.28), sin(uT * .9 + aRand.w * 6.28)) * .55;
        vec3 p = mix(aStart, position, a) + sw * (1. - a);
        p = mix(p, aScatter, s) + sw * s * .8;
        vec4 mv = modelViewMatrix * vec4(p, 1.);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uSize * (.45 + aRand.x * .9) * uPx * (1. + (1. - a) * .9 + s) / -mv.z;
        float land = a * (1. - s);
        vA = mix(.85, .14 + .16 * sin(uT * 2.2 + aRand.y * 40.), land) * (1. - smoothstep(.55, 1., s)) * smoothstep(0., .06, uA);
        vRed = aRand.z;
      }`,
    fragmentShader: /* glsl */`
      varying float vA; varying float vRed;
      void main(){
        float d = length(gl_PointCoord - .5);
        float m = smoothstep(.5, .05, d);
        vec3 c = mix(vec3(1., .975, .95), vec3(.86, .12, .15), vRed);
        gl_FragColor = vec4(c, m * vA);
      }`
  });
  const dust = new THREE.Points(pGeo, pMat); dust.frustumCulled = false; group.add(dust);

  /* ---------- enquadramento ---------- */
  // A marca ocupa o espaço que o texto deixa livre (à direita no desktop, acima no celular).
  const copy = hero.querySelector('.hero__copy h1');
  const facts = hero.querySelector('.hero__facts');
  let W = 1, H = 1;
  function layout() {
    W = stage.clientWidth || 1; H = stage.clientHeight || 1;
    renderer.setSize(W, H, false);
    camera.aspect = W / H; camera.updateProjectionMatrix();
    const vh = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)), vw = vh * camera.aspect;
    const px = vh / H; // unidades de mundo por pixel
    const rg = document.createRange(); rg.selectNodeContents(copy);
    const hb = hero.getBoundingClientRect(), cb = rg.getBoundingClientRect(), fb = facts.getBoundingClientRect();
    let x0, x1, y0, y1; // região livre em pixels
    if (W >= 880) { x0 = Math.max(cb.right - hb.left + 20, W * .46); x1 = W - 90; y0 = 90; y1 = fb.top - hb.top - 20; }
    else { x0 = 16; x1 = W - 16; y0 = 76; y1 = cb.top - hb.top - 14; }
    const aw = (x1 - x0) * px, ah = Math.max(60, y1 - y0) * px;
    const s = Math.min(1, aw * .8 / 4.4, ah * .74 / 3.2);
    group.scale.setScalar(s);
    group.position.set(((x0 + x1) / 2 - W / 2) * px, (H / 2 - (y0 + y1) / 2) * px, 0);
  }
  layout();
  new ResizeObserver(layout).observe(stage);
  if (document.fonts) document.fonts.ready.then(layout);

  /* ---------- ponteiro com mola (interrompível) ---------- */
  const ptr = { x: 0, y: 0 }, rot = { x: 0, y: 0, vx: 0, vy: 0 };
  if (!lite) addEventListener('pointermove', (e) => { ptr.x = e.clientX / innerWidth * 2 - 1; ptr.y = e.clientY / innerHeight * 2 - 1; }, { passive: true });

  /* ---------- linha do tempo: monta (2,8 s) · segura (9 s) · desfaz (2,2 s) · pausa ---------- */
  const T_A = 2.8, T_H = 9, T_S = 2.2, T_G = .7, CYCLE = T_A + T_H + T_S + T_G;
  const clock = new THREE.Clock();
  let t = 0, first = true;
  const wp = new THREE.Vector3(), wn = new THREE.Vector3();

  function frame() {
    const raw = clock.getDelta(); t += Math.min(raw, .25);
    const dt = Math.min(raw, 1 / 30);
    const ct = still ? T_A + 3.2 : Math.max(0, t - .35) % CYCLE;
    const uA = Math.min(1, ct / T_A);
    const uS = ct < T_A + T_H ? 0 : Math.min(1, (ct - T_A - T_H) / T_S);
    pMat.uniforms.uA.value = uA; pMat.uniforms.uS.value = uS; pMat.uniforms.uT.value = t;

    // luz rasante girando
    const th = still ? 2.2 : t * .32 + 1.4;
    spot.position.set(Math.cos(th) * 8.5 + group.position.x, group.position.y + 2.6 + Math.sin(th * .8) * 2.6, 4.6 + Math.sin(th) * 1.2);
    spot.target.position.copy(group.position);
    rim.position.set(group.position.x - Math.cos(th) * 4, group.position.y - 1.5, -3); rim.target.position.copy(group.position);

    // mola
    const k = 38, c = 9;
    const tx = (still ? .12 : ptr.y * -.16) + Math.sin(t * .5) * .05;
    const ty = (still ? -.28 : ptr.x * .38) + Math.sin(t * .37) * .14;
    rot.vx += ((tx - rot.x) * k - rot.vx * c) * dt; rot.x += rot.vx * dt;
    rot.vy += ((ty - rot.y) * k - rot.vy * c) * dt; rot.y += rot.vy * dt;
    group.rotation.set(rot.x, rot.y, 0);
    group.updateMatrixWorld();

    // planos de corte acompanham a frente do pó (em coordenadas da marca)
    const R = MAXX - MINX;
    const fa = MINX + ((uA * 1.7 - 1) / .7) * R - .05;
    const fs = MINX + ((uS * 1.7) / .7) * R * (uS > 0 ? 1 : 0) - (uS > 0 ? 0 : 99);
    wn.set(-1, 0, 0).transformDirection(group.matrixWorld);
    planeA.setFromNormalAndCoplanarPoint(wn, group.localToWorld(wp.set(fa, 0, 0)));
    wn.set(1, 0, 0).transformDirection(group.matrixWorld);
    planeB.setFromNormalAndCoplanarPoint(wn, group.localToWorld(wp.set(fs, 0, 0)));

    renderer.render(scene, camera);
    if (first) { first = false; hero.classList.add('is-3d'); if (still) window.__heroReady = true; }
  }

  let running = false, onScreen = true;
  function sync() {
    const go = onScreen && !document.hidden && (!reduce.matches || still);
    if (go === running) return;
    running = go;
    if (go) clock.getDelta();
    renderer.setAnimationLoop(go ? frame : null);
  }
  new IntersectionObserver((es) => { onScreen = es[0].isIntersecting; sync(); }).observe(hero);
  document.addEventListener('visibilitychange', sync);
  reduce.addEventListener('change', () => { if (reduce.matches && !still) { hero.classList.remove('is-3d'); } sync(); });
  sync();
}
