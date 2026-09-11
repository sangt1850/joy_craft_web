import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import glbUrl from "./open-superbox.glb?url";
import type { SlideProps } from "../SlideProps";
import { useVibrate } from "../useVibrate";
import { useAudio } from "../useAudio";
import { useSlideTimeout } from "../useSlideTimeout";
import FireworksOverlay from "../fireworks/FireworksOverlay";

interface GiftUnboxingData {
  boxColor: string;
  ribbonColor: string;
  cardImage: string | null;
  cardEmoji: string;
  cardTitle: string;
  cardMessage: string;
}

const ANIM_DUR = { a2: 3000 };

// ── Mesh visibility groups ──────────────────────────────────────────────────
const ANIM1_RIBBONS = [
  "bantik1Animation1",
  "bantik2Animation1",
  "ribbonAnimation1",
];
const ANIM2_RIBBONS = [
  "bantik1Animation2",
  "bantik2Animation2",
  "ribbonLong1Animation2",
  "ribbonLong2Animation2",
  "ribbonShort1Animation2",
  "ribbonShort2Animation2",
];

// ── Three.js state ──────────────────────────────────────────────────────────

interface ThreeState {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  mixer: THREE.AnimationMixer;
  actions: Record<string, THREE.AnimationAction>;
  model: THREE.Group;
  clock: THREE.Clock;
  pinkMat: THREE.MeshStandardMaterial | null;
  redMat: THREE.MeshStandardMaterial | null;
  stage: number;
  lockedUntil: number;
}

// ── Main ────────────────────────────────────────────────────────────────────

export function GiftUnboxing({
  data,
  onComplete,
  isPreview,
}: SlideProps<GiftUnboxingData>) {
  const {
    boxColor = "#FF586F",
    ribbonColor = "#FFD1DB",
    cardImage,
    cardEmoji = "",
    cardTitle = "",
    cardMessage = "",
  } = data;

  const vibe = useVibrate();
  const { blip } = useAudio();
  const later = useSlideTimeout();

  const mountRef = useRef<HTMLDivElement>(null);
  const three = useRef<Partial<ThreeState>>({});

  const [stage, setStage] = useState(0);
  const [showDimmer, setShowDimmer] = useState(false);
  const [showFireworks, setShowFireworks] = useState(false);
  const [showCard, setShowCard] = useState(false);
  // Box opening screen position (px) — from bantik world position
  const [fwOrigin, setFwOrigin] = useState({ x: 0, y: 0 });

  // ── Three.js init (once) ──────────────────────────────────────────────────
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0, 2.6 * 0.7 * 1.15, 7.2 * 1.3 * 1.8);
    camera.lookAt(0, 0.95 * 0.7 * 3, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    try {
      (renderer as THREE.WebGLRenderer & { outputColorSpace?: string }).outputColorSpace =
        THREE.SRGBColorSpace;
    } catch {
      (renderer as THREE.WebGLRenderer & { outputEncoding?: number }).outputEncoding =
        (THREE as typeof THREE & { sRGBEncoding?: number }).sRGBEncoding ?? 3001;
    }
    renderer.toneMapping = THREE.NoToneMapping;
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.display = "block";
    renderer.domElement.style.touchAction = "none";

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 2));
    const key = new THREE.DirectionalLight(0xffffff, 1.0);
    key.position.set(4, 8, 5);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, 0.4);
    fill.position.set(-3, 3, -2);
    scene.add(fill);

    const clock = new THREE.Clock();

    Object.assign(three.current, {
      scene, camera, renderer, clock,
      mixer: null, actions: {}, model: null,
      pinkMat: null, redMat: null,
      stage: 0, lockedUntil: 0,
    });

    // Resize
    const resize = () => {
      const w = mount.clientWidth, h = mount.clientHeight;
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    // Load GLB
    let cancelled = false;
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.7/");
    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);
    gltfLoader.load(glbUrl, (gltf) => {
      if (cancelled) return;
      const model = gltf.scene;
      model.position.set(0, -1.2, 0);
      model.rotation.y = Math.PI / 4;
      scene.add(model);

      // Clone materials for color customization
      const cloned: Record<string, THREE.MeshStandardMaterial> = {};
      model.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (!mesh.isMesh || !mesh.material) return;
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (!cloned[mat.name]) {
          const c = mat.clone();
          c.roughness = Math.max(mat.roughness, 0.5);
          c.metalness = 0;
          c.side = THREE.FrontSide;
          cloned[mat.name] = c;
        }
        mesh.material = cloned[mat.name];
      });

      const t = three.current as ThreeState;
      t.pinkMat = cloned["pink"] ?? null;
      t.redMat = cloned["red"] ?? null;
      if (t.redMat) t.redMat.color.set(boxColor);
      if (t.pinkMat) t.pinkMat.color.set(ribbonColor);

      // Visibility: whitelist — only phase-0 renderable objects visible
      const PHASE0_VISIBLE = new Set([
        ...ANIM1_RIBBONS, "Cap1", "Main_Body",
      ]);
      model.traverse((o) => {
        if ((o as unknown as { geometry?: unknown }).geometry) {
          o.visible = PHASE0_VISIBLE.has(o.name);
        }
      });

      // Mixer + actions
      const mixer = new THREE.AnimationMixer(model);
      const actions: Record<string, THREE.AnimationAction> = {};

      gltf.animations.forEach((clip) => {
        if (clip.name === "Animation1") {
          // Remove PointCap tracks — GLB node default transform is correct
          const filtered = clip.tracks.filter(
            (t) => !t.name.startsWith("PointCap."),
          );
          const modClip = new THREE.AnimationClip(
            "A1_noCap",
            clip.duration,
            filtered,
          );
          actions[clip.name] = mixer.clipAction(modClip, model);
        } else {
          actions[clip.name] = mixer.clipAction(clip, model);
        }
      });

      // Animation1: clamp at end (bone assembly pose), never stop
      const a1 = actions["Animation1"];
      if (a1) {
        a1.reset();
        a1.clampWhenFinished = true;
        a1.setLoop(THREE.LoopOnce, 1);
        a1.play();
        mixer.setTime(a1.getClip().duration);
        a1.paused = true;
      }

      t.mixer = mixer;
      t.actions = actions;
      t.model = model;
    });

    // Render loop
    let raf: number;
    const loop = () => {
      const t = three.current as ThreeState;
      const dt = Math.min(clock.getDelta(), 0.05);
      if (t.mixer) t.mixer.update(dt);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      const t = three.current as ThreeState;
      if (t.mixer) {
        t.mixer.stopAllAction();
        if (t.model) t.mixer.uncacheRoot(t.model);
      }
      dracoLoader.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) mount.removeChild(renderer.domElement);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Color updates ─────────────────────────────────────────────────────────
  useEffect(() => {
    const t = three.current as ThreeState;
    if (t.redMat) t.redMat.color.set(boxColor);
  }, [boxColor]);

  useEffect(() => {
    const t = three.current as ThreeState;
    if (t.pinkMat) t.pinkMat.color.set(ribbonColor);
  }, [ribbonColor]);

  // ── Click handler ─────────────────────────────────────────────────────────
  const handleClick = useCallback(() => {
    const t = three.current as ThreeState;
    if (!t.model || !t.mixer) return;
    if (Date.now() < t.lockedUntil) return;

    const acts = t.actions;

    const setVisible = (names: string[], vis: boolean) =>
      names.forEach((n) => {
        const o = t.model.getObjectByName(n);
        if (o) o.visible = vis;
      });

    if (t.stage === 0) {
      // Click 1: ribbon untie
      setVisible(ANIM1_RIBBONS, false);
      setVisible(ANIM2_RIBBONS, true);

      const a2 = acts["Animation2"];
      if (!a2) return;
      a2.reset().setLoop(THREE.LoopOnce, 1);
      a2.clampWhenFinished = true;
      a2.play();
      t.lockedUntil = Date.now() + ANIM_DUR.a2;
      t.stage = 1;
      setStage(1);
      vibe([10, 30, 10]);
      blip(520, 0.08, "sine", 0.12);
    } else if (t.stage === 1) {
      // Click 2: lid opens → 0.5s later fireworks auto-launch
      setVisible(["bantik1Animation2", "bantik2Animation2"], false);

      const a3 = acts["Animation3"];
      if (!a3) return;
      a3.reset().setLoop(THREE.LoopOnce, 1);
      a3.clampWhenFinished = true;
      a3.play();
      t.stage = 2;
      setStage(2);
      vibe([10, 30, 10]);
      blip(440, 0.12, "sine", 0.15);

      // Project bantik (bow knot at box opening) to screen px
      const bantik = t.model.getObjectByName("bantik1Animation2");
      if (bantik && mountRef.current) {
        const wp = new THREE.Vector3();
        bantik.getWorldPosition(wp);
        wp.project(t.camera);
        const rect = mountRef.current.getBoundingClientRect();
        setFwOrigin({
          x: ((wp.x + 1) / 2) * rect.width,
          y: ((1 - wp.y) / 2) * rect.height + 180,
        });
      }

      // Dim background, then fire fireworks from box
      setShowDimmer(true);
      later(() => {
        vibe([12, 40, 12, 40, 90]);
        blip(360, 0.3, "sine", 0.1);
        setShowFireworks(true);
        setStage(3);
        t.stage = 3;
      }, 1600);
    }
  }, [vibe, blip, later]);

  const handleFireworksComplete = useCallback(() => {
    setShowFireworks(false);
    setShowCard(true);
    if (!isPreview) later(() => onComplete?.(), 4000);
  }, [isPreview, later, onComplete]);

  const hintText =
    stage === 0
      ? "선물을 터치하세요"
      : stage < 3
        ? "한번 더!"
        : "";

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "#fff6f6",
        overflow: "hidden",
        fontFamily: "'Space Grotesk', sans-serif",
      }}
    >
      {/* Dimmer overlay — between background and 3D canvas */}
      {showDimmer && !showCard && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            zIndex: 1,
            pointerEvents: "none",
            animation: "jc-dim-in 0.5s ease-in forwards",
          }}
        />
      )}

      {/* 3D canvas mount — above dimmer, transparent background */}
      <div
        ref={mountRef}
        onClick={handleClick}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 2,
          cursor: stage < 3 ? "pointer" : "default",
        }}
      />

      {/* Hint text */}
      {stage < 3 && (
        <p
          style={{
            position: "absolute",
            bottom: 36,
            left: 0,
            right: 0,
            textAlign: "center",
            fontSize: 14,
            fontWeight: 700,
            color: showDimmer ? "#fff" : "#1A1A1A",
            margin: 0,
            zIndex: 10,
            pointerEvents: "none",
            opacity: 0.7,
            animation: "jc-fadeup .4s",
          }}
        >
          {hintText}
        </p>
      )}

      {/* Fireworks — bottom-center of container = box opening position */}
      {showFireworks && (
        <div
          style={{
            position: "absolute",
            // Place bottom-center at the bantik (box opening) screen position
            left: fwOrigin.x - window.innerWidth,
            width: window.innerWidth * 2,
            height: window.innerHeight * 2,
            top: fwOrigin.y - window.innerHeight * 2,
            zIndex: 5,
            pointerEvents: "none",
          }}
        >
          <FireworksOverlay
            loop={false}
            autoplay
            density={1.5}
            speed={2.5}
            onComplete={handleFireworksComplete}
          />
        </div>
      )}

      {/* Card overlay */}
      {showCard && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 20,
            background: "rgba(255,246,246,0.75)",
            backdropFilter: "blur(6px)",
            animation: "jc-fadeup .5s",
          }}
        >
          <div
            style={{
              background: "#FDF2E9",
              borderRadius: 8,
              padding: "28px 22px",
              border: "2px solid #1A1A1A",
              boxShadow: "6px 6px 0 #1A1A1A",
              textAlign: "center",
              width: 220,
              maxWidth: "80vw",
            }}
          >
            {cardImage ? (
              <img
                src={cardImage}
                alt=""
                style={{
                  width: "100%",
                  maxHeight: 110,
                  objectFit: "cover",
                  borderRadius: 6,
                  border: "2px solid #1A1A1A",
                  marginBottom: 12,
                }}
              />
            ) : cardEmoji ? (
              <div style={{ fontSize: 44, marginBottom: 8 }}>{cardEmoji}</div>
            ) : (
              <div style={{ fontSize: 44, marginBottom: 8 }}>&#x1F49D;</div>
            )}
            {cardTitle && (
              <p
                style={{
                  fontSize: 17,
                  fontWeight: 800,
                  color: "#1A1A1A",
                  lineHeight: 1.4,
                  margin: "0 0 6px",
                }}
              >
                {cardTitle}
              </p>
            )}
            {cardMessage && (
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: "#333",
                  lineHeight: 1.6,
                  margin: 0,
                  whiteSpace: "pre-line",
                }}
              >
                {cardMessage}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Next page badge */}
      {showCard && (
        <div
          style={{
            position: "absolute",
            bottom: 32,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            zIndex: 25,
          }}
        >
          <div
            style={{
              fontSize: 13,
              color: "#1A1A1A",
              background: "#4ECDC4",
              padding: "6px 18px",
              borderRadius: 6,
              fontWeight: 700,
              animation: "jc-fadeup .5s",
              border: "2px solid #1A1A1A",
              boxShadow: "3px 3px 0 #1A1A1A",
            }}
          >
            다음 페이지로
          </div>
        </div>
      )}
    </div>
  );
}
