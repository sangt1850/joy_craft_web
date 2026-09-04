import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { SlideProps } from "../SlideProps";
import { useSlideComplete } from "../useSlideComplete";
import { useSlideTimeout } from "../useSlideTimeout";

/* ─────────────────────────────────────────────────────────
   GLB 경로 — 원래 색상 유지 (TINT = false)
   ───────────────────────────────────────────────────────── */
const MODEL_URL = "/matryoshka-dog.glb";
const MODEL_HEIGHT = 1.9;

/* ─────────────────────────────────────────────────────────
   물리 상수 — 원본과 동일
   ───────────────────────────────────────────────────────── */
const PALETTE = [
  "#F7A8B8", "#FFCF9E", "#FBE7A1", "#B7E4C7", "#A5D8E6",
  "#C3B7F0", "#F6BFD8", "#FFD6BA", "#C8E6A0", "#9ED9D3",
];
const DARK = "#5A4A4A";
const GRAVITY = -17;
const BOUNCE = 0.52;
const SLIDE = 0.88;
const INNER_R = 2.0;
const OUTER_R = 4.6;
const LIFT_NEED = 1.75;

/* 카메라 오빗 */
const CAM_TARGET  = new THREE.Vector3(0, MODEL_HEIGHT * 0.5, 0); // 모델 높이 중앙
const ORBIT_SPEED = 0.004;

/* ─────────────────────────────────────────────────────────
   절차적 강아지 (GLB 실패 폴백)
   ───────────────────────────────────────────────────────── */
function buildDog(colorHex: string) {
  const g = new THREE.Group();
  const skin  = new THREE.MeshToonMaterial({ color: new THREE.Color(colorHex) });
  const dark  = new THREE.MeshToonMaterial({ color: new THREE.Color(DARK) });
  const cream = new THREE.MeshToonMaterial({ color: new THREE.Color("#FFF7EF") });
  const blush = new THREE.MeshToonMaterial({ color: new THREE.Color("#FF9DB0") });

  const add = (
    geo: THREE.BufferGeometry,
    mat: THREE.Material,
    pos: [number, number, number],
    scale?: [number, number, number],
    rot?: [number, number, number],
  ) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(...pos);
    if (scale) m.scale.set(...scale);
    if (rot)   m.rotation.set(...rot);
    m.castShadow = true;
    g.add(m);
  };
  const sph = (r: number, s = 24) =>
    new THREE.SphereGeometry(r, s, Math.round(s * 0.7));

  add(sph(0.62, 32), skin,  [0,    0.66,  0   ], [1,    1.12, 0.94]);
  add(sph(0.30, 24), cream, [0,    0.52,  0.42 ], [0.9,  1.05, 0.6 ]);
  add(sph(0.44, 32), skin,  [0,    1.46,  0.04 ]);
  add(sph(0.19, 24), cream, [0,    1.33,  0.36 ], [1.1,  0.85, 1.15]);
  add(sph(0.075,16), dark,  [0,    1.38,  0.53 ], [1.3,  0.9,  1   ]);
  add(sph(0.065,16), dark,  [-0.17,1.51,  0.36 ]);
  add(sph(0.065,16), dark,  [ 0.17,1.51,  0.36 ]);
  add(sph(0.075,16), blush, [-0.31,1.38,  0.28 ], [1,    0.65, 0.5 ]);
  add(sph(0.075,16), blush, [ 0.31,1.38,  0.28 ], [1,    0.65, 0.5 ]);
  add(sph(0.18, 20), skin,  [-0.35,1.62,  0    ], [0.62, 1.35, 0.4 ], [0, 0,  0.32]);
  add(sph(0.18, 20), skin,  [ 0.35,1.62,  0    ], [0.62, 1.35, 0.4 ], [0, 0, -0.32]);
  add(sph(0.17, 20), skin,  [-0.27,0.13,  0.36 ], [1,    0.6,  1.25]);
  add(sph(0.17, 20), skin,  [ 0.27,0.13,  0.36 ], [1,    0.6,  1.25]);
  add(sph(0.14, 16), skin,  [0,    0.92, -0.58 ], [0.7,  0.7,  1.4 ], [0.5, 0, 0]);
  return g;
}

/* ─────────────────────────────────────────────────────────
   쪽지 오브젝트 (원본과 동일)
   ───────────────────────────────────────────────────────── */
function buildNote() {
  const W = 0.95, H = 0.60, T = 0.055, FH = H * 0.56;

  const g = new THREE.Group();
  const paperMat = new THREE.MeshToonMaterial({ color: new THREE.Color("#FFFDF5") });
  const flapMat  = new THREE.MeshToonMaterial({ color: new THREE.Color("#FBF0DC") });
  const sealMat  = new THREE.MeshToonMaterial({ color: new THREE.Color("#E8748C") });
  const inkMat   = new THREE.MeshToonMaterial({ color: new THREE.Color("#CFC3B6") });
  const stampMat = new THREE.MeshToonMaterial({ color: new THREE.Color("#A5D8E6") });

  /* 봉투 본체 */
  const body = new THREE.Mesh(new THREE.BoxGeometry(W, H, T), paperMat);
  body.castShadow = true;
  g.add(body);

  /* 우표 */
  const stamp = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.18, 0.004), stampMat);
  stamp.position.set(W / 2 - 0.13, H / 2 - 0.14, T / 2 + 0.002);
  g.add(stamp);

  /* 주소 줄 3개 */
  [0.02, -0.05, -0.12].forEach((y, i) => {
    const line = new THREE.Mesh(
      new THREE.BoxGeometry(0.34 - i * 0.07, 0.022, 0.004), inkMat
    );
    line.position.set(-0.16 + i * 0.035, y, T / 2 + 0.002);
    g.add(line);
  });

  /* 편지지 — 봉투 안에 숨어 있고, 개봉 시 위로 솟아오름 */
  const sheet = new THREE.Group();
  const paper = new THREE.Mesh(new THREE.BoxGeometry(W * 0.86, H * 0.94, 0.01), paperMat);
  paper.castShadow = true;
  sheet.add(paper);
  for (let i = 0; i < 4; i++) {
    const ln = new THREE.Mesh(
      new THREE.BoxGeometry(W * (0.62 - (i % 2) * 0.12), 0.018, 0.003), inkMat
    );
    ln.position.set(-0.02 + (i % 2) * 0.03, 0.16 - i * 0.09, 0.007);
    sheet.add(ln);
  }
  g.add(sheet);

  /* 뚜껑(플랩) — ExtrudeGeometry로 삼각형 */
  const shape = new THREE.Shape();
  shape.moveTo(-W / 2, 0);
  shape.lineTo(W / 2, 0);
  shape.lineTo(0, -FH);
  shape.lineTo(-W / 2, 0);
  const flap = new THREE.Mesh(
    new THREE.ExtrudeGeometry(shape, { depth: 0.014, bevelEnabled: false }),
    flapMat
  );
  flap.castShadow = true;
  const flapPivot = new THREE.Group();
  flapPivot.position.set(0, H / 2, T / 2 - 0.014);
  flapPivot.add(flap);
  g.add(flapPivot);

  /* 봉랍 — 플랩 위에 고정 */
  const seal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.075, 0.075, 0.022, 24), sealMat
  );
  seal.rotation.x = Math.PI / 2;
  seal.position.set(0, -FH + 0.05, 0.024);
  flap.add(seal);

  g.userData = { flapPivot, sheet };
  g.position.set(0, 0.75, 0);
  return g;
}

/* ─────────────────────────────────────────────────────────
   GLB 로더 — 높이 정규화, 바닥=0, 중심=0
   ───────────────────────────────────────────────────────── */
function loadTemplate(url: string): Promise<THREE.Group> {
  return new Promise((resolve, reject) => {
    new GLTFLoader().load(
      url,
      (gltf) => {
        const inner = gltf.scene;
        const box   = new THREE.Box3().setFromObject(inner);
        const size  = new THREE.Vector3();
        const center = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(center);
        const k = MODEL_HEIGHT / (size.y || 1);
        inner.scale.setScalar(k);
        inner.position.set(-center.x * k, -box.min.y * k, -center.z * k);
        const wrap = new THREE.Group();
        wrap.rotation.y = 0; // 180° = π rad — 강아지 정면이 카메라를 향하도록
        wrap.add(inner);
        resolve(wrap);
      },
      undefined,
      reject,
    );
  });
}

/* GLB 클론 — 재질만 clone, 색상 덮어쓰지 않음 */
function cloneTemplate(template: THREE.Group): THREE.Group {
  const g = template.clone(true);
  g.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.castShadow = true;
    mesh.material = Array.isArray(mesh.material)
      ? (mesh.material as THREE.Material[]).map((m) => m.clone())
      : (mesh.material as THREE.Material).clone();
  });
  return g;
}

/* ─────────────────────────────────────────────────────────
   내부 상태 타입
   ───────────────────────────────────────────────────────── */
interface PoppedShell {
  obj: THREE.Group;
  rest: number;
  vel: THREE.Vector3;
  spin: THREE.Vector3;
  sleeping: boolean;
}

interface ThreeState {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  rig: THREE.Group;
  shells: THREE.Group[];
  popped: PoppedShell[];
  active: number;
  ratio: number;
  note: THREE.Group | null;
  noteScale: number;
  noteOpening: boolean;
  noteOpenP: number;
  clock: THREE.Clock;
  spring: THREE.Group | null;
  template: THREE.Group | null;
  /** 카메라 현재 구면 좌표 (부드럽게 lerp) */
  sph: THREE.Spherical;
  /** 카메라 목표 구면 좌표 (드래그로 직접 업데이트) */
  sphTarget: THREE.Spherical;
}

/* ─────────────────────────────────────────────────────────
   Data props 타입
   ───────────────────────────────────────────────────────── */
interface MatryoshkaDogData {
  message: string;
  layerCount: number;
  backgroundColor: string;
}

/* ══════════════════════════════════════════════════════════
   슬라이드 컴포넌트
   ══════════════════════════════════════════════════════════ */
export default function MatryoshkaDog({
  data, onComplete, isPreview,
}: SlideProps<MatryoshkaDogData>) {
  const { message, layerCount, backgroundColor } = data;
  const complete = useSlideComplete(onComplete, isPreview);
  const later    = useSlideTimeout();

  const mountRef = useRef<HTMLDivElement>(null);
  const three    = useRef<Partial<ThreeState>>({});

  const [phase,      setPhase]      = useState<"loading" | "playing" | "note">("loading");
  const [opened,     setOpened]     = useState(0);
  const [letterOpen, setLetterOpen] = useState(false);
  const [liftRatio,  setLiftRatio]  = useState(0);

  /* 반응형 */
  const [vw, setVw] = useState(0);

  /* ── Three.js 씬 초기화 (최초 1회) ─────── */
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    /* ResizeObserver for vw */
    const roVw = new ResizeObserver(([e]) => setVw(e.contentRect.width));
    roVw.observe(mount);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 200);
    // 모델 높이 중앙(0.95)을 화면 정중앙에 맞춘 카메라 위치
    camera.position.set(0, CAM_TARGET.y + 1.8, 7.8);
    camera.lookAt(CAM_TARGET);

    /* 초기 구면 좌표 계산 — current·target 동일하게 시작 */
    const sph = new THREE.Spherical();
    sph.setFromVector3(camera.position.clone().sub(CAM_TARGET));
    const sphTarget = sph.clone();

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
    /* GLB 원래 색상을 정확하게 표현하기 위해 sRGB 출력 설정 */
    try {
      (renderer as THREE.WebGLRenderer & { outputColorSpace?: string }).outputColorSpace =
        THREE.SRGBColorSpace;
    } catch {
      // Three.js r149 이하
      (renderer as THREE.WebGLRenderer & { outputEncoding?: number }).outputEncoding =
        (THREE as typeof THREE & { sRGBEncoding?: number }).sRGBEncoding ?? 3001;
    }
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.display     = "block";
    renderer.domElement.style.touchAction = "none";

    /* 조명 — 원본과 동일 */
    scene.add(new THREE.AmbientLight(0xffffff, 0.78));
    const key = new THREE.DirectionalLight(0xffffff, 0.85);
    key.position.set(4, 8, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    const sc = key.shadow.camera as THREE.OrthographicCamera;
    sc.left = -20; sc.right = 20; sc.top = 20; sc.bottom = -20;
    sc.near = 1;   sc.far  = 40;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xfff0f5, 0.35);
    fill.position.set(-5, 3, -4);
    scene.add(fill);

    /* 바닥 그림자 */
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(24, 48),
      new THREE.ShadowMaterial({ opacity: 0.16 }),
    );
    floor.rotation.x  = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const rig = new THREE.Group();
    rig.position.x = -0.2; // 화면 기준 약 20px 왼쪽 오프셋
    scene.add(rig);

    Object.assign(three.current, {
      scene, camera, renderer, rig,
      shells: [], popped: [],
      active: 0, ratio: 0.8,
      note: null, noteScale: 0, noteOpening: false, noteOpenP: 0,
      clock: new THREE.Clock(),
      spring: null, template: null,
      sph, sphTarget,
    });

    /* 리사이즈 */
    const resize = () => {
      const w = mount.clientWidth, h = mount.clientHeight;
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    /* 렌더 루프 — 원본과 동일 */
    let raf: number;
    const loop = () => {
      const t  = three.current as ThreeState;
      const dt = Math.min(t.clock.getDelta(), 0.05);

      /* 스프링 복귀 */
      if (t.spring) {
        const k = 1 - Math.exp(-dt * 11);
        t.spring.position.multiplyScalar(1 - k);
        t.spring.rotation.z *= 1 - k;
        if (t.spring.position.length() < 0.004) {
          t.spring.position.set(0, 0, 0);
          t.spring.rotation.z = 0;
          t.spring = null;
        }
      }

      /* 벗겨진 셸 물리 */
      for (const p of t.popped) {
        if (p.sleeping) continue;
        p.vel.y += GRAVITY * dt;
        p.obj.position.addScaledVector(p.vel, dt);
        p.obj.rotation.x += p.spin.x * dt;
        p.obj.rotation.y += p.spin.y * dt;
        p.obj.rotation.z += p.spin.z * dt;

        if (p.obj.position.y < 1.3) {
          const x = p.obj.position.x, z = p.obj.position.z;
          let r = Math.hypot(x, z);
          if (r < 0.001) { p.obj.position.x = 0.01; r = 0.01; }
          const nx = p.obj.position.x / r, nz = z / r;
          if (r > OUTER_R || r < INNER_R) {
            const target = r > OUTER_R ? OUTER_R : INNER_R;
            p.obj.position.x = nx * target;
            p.obj.position.z = nz * target;
            const vr   = p.vel.x * nx + p.vel.z * nz;
            const push = r > OUTER_R ? vr > 0 : vr < 0;
            if (push) { p.vel.x -= 1.5 * vr * nx; p.vel.z -= 1.5 * vr * nz; }
          }
        }

        if (p.obj.position.y < p.rest) {
          p.obj.position.y  = p.rest;
          p.vel.y           = Math.abs(p.vel.y) * BOUNCE;
          p.vel.x          *= SLIDE; p.vel.z *= SLIDE;
          p.spin.multiplyScalar(0.82);
          if (p.vel.length() < 0.5) {
            p.vel.set(0,0,0); p.spin.set(0,0,0); p.sleeping = true;
          }
        } else {
          p.vel.x *= 1 - dt * 0.25;
          p.vel.z *= 1 - dt * 0.25;
        }
      }

      /* 카메라 부드러운 오빗 lerp */
      const lk = 1 - Math.exp(-dt * 12);
      t.sph.theta += (t.sphTarget.theta - t.sph.theta) * lk;
      t.sph.phi   += (t.sphTarget.phi   - t.sph.phi)   * lk;
      t.camera.position.setFromSpherical(t.sph).add(CAM_TARGET);
      t.camera.lookAt(CAM_TARGET);

      /* 쪽지 등장 + 둥실둥실 — 카메라 중심 높이(CAM_TARGET.y)에서 떠오름 */
      if (t.note) {
        const e = t.clock.elapsedTime;
        t.noteScale += (1 - t.noteScale) * (1 - Math.exp(-dt * 5));
        t.note.scale.setScalar(1.4 * t.noteScale);

        if (t.noteOpening) {
          /* 개봉 애니메이션 — 0→1 진행 */
          t.noteOpenP = Math.min(1, t.noteOpenP + dt * 1.4);
          const ease = 1 - Math.pow(1 - t.noteOpenP, 3); // cubic-out

          const { flapPivot, sheet } = t.note.userData as {
            flapPivot: THREE.Group; sheet: THREE.Group;
          };
          if (flapPivot) flapPivot.rotation.x = ease * 2.5;
          if (sheet) {
            sheet.position.y = ease * 0.55;
            sheet.position.z = ease * 0.08;
          }

          /* 정면으로 수렴 */
          t.note.rotation.y *= 1 - dt * 6;
          t.note.rotation.z *= 1 - dt * 6;
          t.note.position.y  = CAM_TARGET.y;

          /* 완료 + 0.5초 뒤 팝업 */
          if (t.noteOpenP >= 1) {
            t.noteOpening = false;
            setLetterOpen(true)
          }
        } else {
          t.note.position.y = CAM_TARGET.y + Math.sin(e * 1.8) * 0.07;
          t.note.rotation.y = Math.sin(e * 0.9)  * 0.32;
          t.note.rotation.z = Math.sin(e * 1.3)  * 0.06;
        }
      }

      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      roVw.disconnect();
      renderer.dispose();
      if (renderer.domElement.parentNode) mount.removeChild(renderer.domElement);
    };
  }, []);

  /* ── 레이어 조립 (원본과 동일) ─────────── */
  const buildLayers = useCallback((n: number) => {
    const t = three.current as ThreeState;
    if (!t.scene) return;

    [...t.rig.children].forEach((o) => t.rig.remove(o));
    t.popped.forEach((p) => t.scene.remove(p.obj));
    t.popped = [];
    if (t.note) { t.scene.remove(t.note); t.note = null; }

    /* 레이어 수와 무관하게 한 단계당 일정 비율 축소
       → 2개여도 "10 → 9" 느낌, 10개여도 "10→9→8…" 느낌 */
    const LAYER_RATIO = 0.82;
    t.ratio  = LAYER_RATIO;
    t.shells = [];

    for (let i = 0; i < n; i++) {
      /* GLB가 있으면 cloneTemplate (색 덮어쓰기 없음),
         없으면 절차적 강아지 (PALETTE 색 사용) */
      const dog = t.template
        ? cloneTemplate(t.template)
        : buildDog(PALETTE[i % PALETTE.length]);
      dog.scale.setScalar(Math.pow(LAYER_RATIO, i));
      t.rig.add(dog);
      t.shells.push(dog);
    }
    t.active = 0;
  }, []);

  /* ── 최초 마운트: GLB 로드 → 레이어 조립 ─ */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const t = three.current as ThreeState;
      try {
        t.template = await loadTemplate(MODEL_URL);
      } catch {
        /* 실패 시 절차적 강아지로 진행 */
      }
      if (!cancelled) {
        buildLayers(layerCount);
        setOpened(0);
        setLetterOpen(false);
        setPhase("playing");
      }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── 포인터 이벤트 (껍질 벗기기 + 카메라 오빗) ── */
  useEffect(() => {
    const t = three.current as ThreeState;
    if (!t.renderer) return;
    const el  = t.renderer.domElement;
    const ray = new THREE.Raycaster();
    const ndc = new THREE.Vector2();

    type DragMode = "peel" | "orbit";
    let mode: DragMode | null = null;

    let peel: {
      shell: THREE.Group;
      scale: number;
      startX: number; startY: number;
      unit: number;
      need: number;
      lift: number;
    } | null = null;

    let orbitPrev = { x: 0, y: 0 };

    const getNDC = (ev: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      ndc.x =  ((ev.clientX - rect.left) / rect.width)  * 2 - 1;
      ndc.y = -((ev.clientY - rect.top)  / rect.height) * 2 + 1;
      ray.setFromCamera(ndc, t.camera);
    };

    const onDown = (ev: PointerEvent) => {
      getNDC(ev);

      /* 쪽지 단계: 쪽지 클릭 → 편지 팝업, 배경 드래그 → 오빗 */
      if (phase === "note") {
        if (t.note && !t.noteOpening && ray.intersectObject(t.note, true).length) {
          t.noteOpening = true;
          t.noteOpenP   = 0;
          return;
        }
        mode = "orbit";
        orbitPrev = { x: ev.clientX, y: ev.clientY };
        try { el.setPointerCapture(ev.pointerId); } catch {}
        return;
      }

      if (phase !== "playing") return;

      /* 현재 활성 셸에 레이캐스트 */
      const shell = t.shells[t.active];
      if (shell && ray.intersectObject(shell, true).length) {
        /* 껍질 벗기기 */
        mode = "peel";
        const rect = el.getBoundingClientRect();
        const camDist = t.camera.position.length();
        const viewH   = 2 * Math.tan((t.camera.fov * Math.PI) / 360) * camDist;
        t.spring = null;
        peel = {
          shell,
          scale: shell.scale.x,
          startX: ev.clientX,
          startY: ev.clientY,
          unit: (viewH / rect.height) * 1.05,
          need: LIFT_NEED * shell.scale.x,
          lift: 0,
        };
        try { el.setPointerCapture(ev.pointerId); } catch {}
        setLiftRatio(0.001);
      } else {
        /* 배경 드래그 → 카메라 오빗 */
        mode = "orbit";
        orbitPrev = { x: ev.clientX, y: ev.clientY };
        try { el.setPointerCapture(ev.pointerId); } catch {}
      }
    };

    const onMove = (ev: PointerEvent) => {
      if (mode === "peel" && peel) {
        /* 원본과 동일한 껍질 드래그 로직 */
        const lift = Math.max(0, (peel.startY - ev.clientY) * peel.unit);
        const side = (ev.clientX - peel.startX) * peel.unit;
        peel.lift = lift;
        peel.shell.position.set(side * 0.8, Math.min(lift, peel.need * 2.4), 0);
        peel.shell.rotation.z = -side * 0.16;
        setLiftRatio(Math.min(1, lift / peel.need));

      } else if (mode === "orbit") {
        /* 목표 구면 좌표만 업데이트 — 실제 카메라는 렌더루프에서 lerp */
        const dx = ev.clientX - orbitPrev.x;
        const dy = ev.clientY - orbitPrev.y;
        orbitPrev = { x: ev.clientX, y: ev.clientY };

        t.sphTarget.theta -= dx * ORBIT_SPEED;
        t.sphTarget.phi   -= dy * ORBIT_SPEED;
        t.sphTarget.phi    = THREE.MathUtils.clamp(t.sphTarget.phi, 0.18, Math.PI * 0.44);
      }
    };

    const onUp = () => {
      if (mode === "peel" && peel) {
        const { shell, scale, lift, need } = peel;
        peel = null;
        setLiftRatio(0);

        if (lift < need) {
          /* 덜 들었으면 스프링 복귀 */
          t.spring = shell;
          mode = null;
          return;
        }

        /* 완전히 벗겨짐 — 원본과 동일한 물리 발사 */
        t.scene.attach(shell);
        const rest = 0.3 * scale;
        const ang  = Math.random() * Math.PI * 2;
        const dist = INNER_R + 0.6 + Math.random() * (OUTER_R - INNER_R - 1.2);
        const tx   = Math.cos(ang) * dist;
        const tz   = Math.sin(ang) * dist * 0.7;
        const vy   = 4.2 + Math.random() * 2.4;
        const gr   = -GRAVITY;
        const h    = Math.max(shell.position.y - rest, 0.01);
        const flight = (vy + Math.sqrt(vy * vy + 2 * gr * h)) / gr;

        t.popped.push({
          obj: shell, rest,
          vel: new THREE.Vector3(
            ((tx - shell.position.x) / flight) * 0.8,
            vy,
            ((tz - shell.position.z) / flight) * 0.8,
          ),
          spin: new THREE.Vector3(
            (Math.random() - 0.5) * 13,
            (Math.random() - 0.5) * 13,
            (Math.random() - 0.5) * 13,
          ),
          sleeping: false,
        });

        t.active += 1;
        setOpened(t.active);

        if (t.active >= t.shells.length) {
          /* 모두 벗겼다 → 쪽지 3D 등장 후 1.5초 뒤 편지 자동 오픈 */
          const note = buildNote();
          note.scale.setScalar(0.05);
          t.scene.add(note);
          t.note      = note;
          t.noteScale = 0.05;
          setPhase("note");
        }
      }

      mode = null;
      peel = null;
    };

    el.addEventListener("pointerdown",   onDown);
    el.addEventListener("pointermove",   onMove);
    el.addEventListener("pointerup",     onUp);
    el.addEventListener("pointercancel", onUp);
    return () => {
      el.removeEventListener("pointerdown",   onDown);
      el.removeEventListener("pointermove",   onMove);
      el.removeEventListener("pointerup",     onUp);
      el.removeEventListener("pointercancel", onUp);
    };
  }, [phase]);

  /* ── 편지 열릴 때 3D 쪽지 오브젝트 숨김 ── */
  useEffect(() => {
    const t = three.current as ThreeState;
    if (t.note) t.note.visible = !letterOpen;
  }, [letterOpen]);

  /* ── 처음부터 ───────────────────────────── */
  const reset = useCallback(() => {
    const t = three.current as ThreeState;
    [...t.rig.children].forEach((o) => t.rig.remove(o));
    t.popped.forEach((p) => t.scene.remove(p.obj));
    t.popped  = [];
    if (t.note) { t.scene.remove(t.note); t.note = null; }
    t.active  = 0;
    t.spring  = null;
    buildLayers(layerCount);
    setLiftRatio(0);
    setLetterOpen(false);
    setOpened(0);
    setPhase("playing");
  }, [layerCount, buildLayers]);

  /* ── 컨페티 데이터 (원본과 동일) ───────── */
  const confetti = Array.from({ length: 44 }, (_, i) => ({
    left:  (i * 2.3 + Math.random() * 2) % 100,
    delay: Math.random() * 2.2,
    dur:   2.6 + Math.random() * 2.4,
    color: PALETTE[i % PALETTE.length],
    size:  6 + Math.random() * 8,
  }));

  /* ── 반응형 ─────────────────────────────── */
  const isWide    = vw >= 600;
  const hudSize   = isWide ? 14 : 12;
  const hudPad    = isWide ? "8px 20px" : "6px 14px";
  const btnPad    = isWide ? "10px 28px" : "7px 18px";
  const btnFont   = isWide ? 14 : 12;

  /* ── HUD 메시지 (원본과 동일) ───────────── */
  const hudText = phase === "loading"
    ? "불러오는 중…"
    : phase === "note"
    ? "✉ 편지를 눌러보세요"
    : liftRatio > 0
    ? (liftRatio >= 1
        ? "손을 놓으면 벗겨집니다"
        : "조금 더 위로 — 놓으면 다시 덮여요")
    : `${opened} / ${layerCount} 벗김 · 위로 끌어올리세요`;

  /* ── 커서 */
  const cursor = phase === "note" ? "pointer"
    : phase === "playing" && liftRatio > 0 ? "grabbing"
    : "grab";

  return (
    <div
      ref={mountRef}
      style={{
        position: "absolute", inset: 0,
        overflow: "hidden", userSelect: "none",
        background: `linear-gradient(180deg,${backgroundColor} 0%,#FDEBF2 45%,#EFE6FB 100%)`,
        fontFamily: "'Pretendard', sans-serif",
        cursor,
      }}
    >
      <style>{`
        @keyframes md-fall {
          0%  { transform: translateY(-12vh) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          100%{ transform: translateY(105vh) rotate(720deg); opacity: 0; }
        }
        @keyframes md-pop {
          0%  { transform: scale(.85); opacity: 0; }
          100%{ transform: scale(1);   opacity: 1; }
        }
      `}</style>

      {/* HUD */}
      {phase !== "loading" && (
        <>
          <div style={{
            position: "absolute", left: 0, right: 0, top: 20,
            display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
            pointerEvents: "none",
          }}>
            <div style={{
              background: "rgba(255,255,255,0.75)",
              backdropFilter: "blur(8px)",
              borderRadius: 999,
              padding: hudPad,
              fontSize: hudSize,
              fontWeight: 600,
              color: "#4a3a3a",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}>
              {hudText}
            </div>

            {liftRatio > 0 && (
              <div style={{
                width: 140, height: 6, borderRadius: 999,
                background: "rgba(255,255,255,0.6)", overflow: "hidden",
              }}>
                <div style={{
                  height: "100%", borderRadius: 999, background: "#F7A8B8",
                  width: `${Math.min(100, liftRatio * 100)}%`,
                  transition: "width 75ms linear",
                }} />
              </div>
            )}
          </div>

          <button
            onClick={reset}
            style={{
              position: "absolute", bottom: 24, left: "50%",
              transform: "translateX(-50%)",
              background: "rgba(255,255,255,0.85)",
              backdropFilter: "blur(8px)",
              border: "none", borderRadius: 999,
              padding: btnPad, fontSize: btnFont,
              fontWeight: 600, color: "#5a4a4a",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            처음부터
          </button>
        </>
      )}

      {/* 쪽지 열림 오버레이 — 원본 matryoshka-dog.jsx 디자인 */}
      {letterOpen && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 20,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(28,25,23,0.35)",
          backdropFilter: "blur(4px)",
          padding: "0 24px",
        }}>
          {/* 컨페티 */}
          {confetti.map((c, i) => (
            <span key={i} style={{
              position: "absolute", top: 0, left: `${c.left}%`,
              width: c.size, height: c.size * 1.6,
              background: c.color, borderRadius: 2,
              pointerEvents: "none",
              animation: `md-fall ${c.dur}s linear ${c.delay}s infinite`,
            }} />
          ))}

          {/* 편지 카드 — rounded-3xl bg-white p-8 shadow-2xl (원본 그대로) */}
          <div style={{
            position: "relative",
            width: "100%", maxWidth: 384,          /* max-w-sm */
            background: "#fff",
            borderRadius: 24,                       /* rounded-3xl */
            padding: 32,                            /* p-8 */
            textAlign: "center",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", /* shadow-2xl */
            animation: "md-pop .45s cubic-bezier(.2,1.4,.4,1)",
          }}>
            {/* mt-4 whitespace-pre-line text-lg font-semibold leading-relaxed text-stone-700 */}
            <p style={{
              marginTop: 16,
              fontSize: 18,
              fontWeight: 600,
              lineHeight: 1.625,
              color: "#44403c",
              whiteSpace: "pre-line",
            }}>
              {message}
            </p>

            {/* mt-7 w-full rounded-2xl bg-primary-400 py-3 font-semibold text-white */}
            <button
              onClick={() => later(complete, 300)}
              style={{
                marginTop: 28,
                width: "100%",
                padding: "12px 0",
                borderRadius: 16,
                border: "none",
                background: "#f472b6",
                color: "#fff",
                fontSize: 16,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              확인 ✓
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
