import {useEffect, useRef, useState} from "react";
import * as THREE from "three";
import type {SlideProps} from "../SlideProps";

interface GiftUnboxingData {
    boxColor: string;
    ribbonColor: string;
    cardImage: string | null;
    cardEmoji: string;
    cardTitle: string;
    cardMessage: string;
}

export function GiftUnboxing({
                                 data,
                             }: SlideProps<GiftUnboxingData>) {
    const {
        boxColor = "#FD5D71",
        ribbonColor = "#FFE7F2",
        cardImage = null,
        cardEmoji = "\u{1F381}",
        cardTitle = "\uC0DD\uC77C \uCD95\uD558\uD574!",
        cardMessage = "\uB298 \uACC1\uC5D0 \uC788\uC5B4\uC918\uC11C \uACE0\uB9C8\uC6CC.\n\uC624\uB298 \uD558\uB8E8\uB3C4 \uBC18\uC9DD\uC774\uAE38 \uBC14\uB77C.",
    } = data;

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mountedRef = useRef(false);
    const resetRef = useRef<(() => void) | null>(null);

    const [veilShow, setVeilShow] = useState(false);
    const [cardShow, setCardShow] = useState(false);


    useEffect(() => {
        mountedRef.current = true;
        const canvas = canvasRef.current;
        if (!canvas) return;

        setVeilShow(false);
        setCardShow(false);

        // ── 치수 ────────────────────────────────────────────────
        const BOX_W = 1.72, BOX_D = 1.72, BODY_H = 1.34;
        const WALL = 0.024;
        const RAD = 0.30, BEVEL = 0.009;
        const LID_W = 1.80, LID_D = 1.80, LID_H = 0.50;
        const LIFT = 0.05;
        const LID_Y = LIFT + BODY_H - 0.18;
        const TOP_Y = LID_Y + LID_H;
        const BODY_TOP = LIFT + BODY_H;
        const HALF = LID_W / 2;
        const CLR = 0.06;
        const RX = HALF + CLR;
        const RTOP = TOP_Y + CLR;
        const RBOT = 0.012;
        const SEGS = 96, RIBBON_W = 0.40;

        // ── 렌더러 ──────────────────────────────────────────────
        const renderer = new THREE.WebGLRenderer({canvas, antialias: true});
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        (renderer as any).outputEncoding = (THREE as any).sRGBEncoding;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.05;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xFDF1ED);

        const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
        const camPos = new THREE.Vector3(0, 2.6, 7.2);
        const camTgt = new THREE.Vector3(0, 0.95, 0);
        const camPosGoal = camPos.clone(), camTgtGoal = camTgt.clone();
        const _camVec = new THREE.Vector3();

        // ── 리사이즈 ────────────────────────────────────────────
        let lastW = 0, lastH = 0;
        const resize = () => {
            const w = canvas.clientWidth || window.innerWidth;
            const h = canvas.clientHeight || window.innerHeight;
            if (!w || !h) return;
            lastW = w;
            lastH = h;
            renderer.setSize(w, h, false);
            camera.aspect = w / h;
            camera.fov = h > w ? 40 : 32;
            camera.updateProjectionMatrix();
        };
        window.addEventListener("resize", resize);
        const ro = new ResizeObserver(() => resize());
        ro.observe(canvas);

        // ── 조명 ────────────────────────────────────────────────
        scene.add(new THREE.HemisphereLight(0xffffff, 0xF7D9D2, 0.75));
        const key = new THREE.DirectionalLight(0xffffff, 1.15);
        key.position.set(3.2, 6.4, 4.2);
        key.castShadow = true;
        key.shadow.mapSize.set(1024, 1024);
        key.shadow.camera.near = 1;
        key.shadow.camera.far = 22;
        (key.shadow.camera as THREE.OrthographicCamera).left = -6;
        (key.shadow.camera as THREE.OrthographicCamera).right = 6;
        (key.shadow.camera as THREE.OrthographicCamera).top = 6;
        (key.shadow.camera as THREE.OrthographicCamera).bottom = -6;
        (key.shadow as any).radius = 4;
        key.shadow.bias = -0.0012;
        scene.add(key);
        const fillL = new THREE.DirectionalLight(0xFFD9DE, 0.42);
        fillL.position.set(-4, 2.4, 2.5);
        scene.add(fillL);
        const rimL = new THREE.DirectionalLight(0xffffff, 0.30);
        rimL.position.set(-1.5, 3, -5);
        scene.add(rimL);

        const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShadowMaterial({opacity: 0.13}));
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        scene.add(ground);

        // ── 라운드 상자 헬퍼 ─────────────────────────────────────
        function roundedPath(t: THREE.Shape | THREE.Path, w: number, d: number, r: number) {
            const x = -w / 2, y = -d / 2;
            r = Math.min(r, Math.min(w, d) / 2 - 0.001);
            t.moveTo(x + r, y);
            t.lineTo(x + w - r, y);
            t.quadraticCurveTo(x + w, y, x + w, y + r);
            t.lineTo(x + w, y + d - r);
            t.quadraticCurveTo(x + w, y + d, x + w - r, y + d);
            t.lineTo(x + r, y + d);
            t.quadraticCurveTo(x, y + d, x, y + d - r);
            t.lineTo(x, y + r);
            t.quadraticCurveTo(x, y, x + r, y);
            return t;
        }

        function extrudeUp(shape: THREE.Shape, h: number, bv: number) {
            const g = new THREE.ExtrudeGeometry(shape, {
                depth: Math.max(0.001, h - bv * 2), bevelEnabled: true,
                bevelSize: bv, bevelThickness: bv, bevelSegments: 4, curveSegments: 20,
            });
            g.rotateX(-Math.PI / 2);
            g.translate(0, bv, 0);
            g.computeVertexNormals();
            return g;
        }

        function makeShell(w: number, d: number, h: number, wall: number, r: number, mat: THREE.Material, capTop: boolean) {
            const g = new THREE.Group();
            const o = roundedPath(new THREE.Shape(), w, d, r) as THREE.Shape;
            o.holes.push(roundedPath(new THREE.Path(), w - wall * 2, d - wall * 2, Math.max(0.03, r - wall)) as THREE.Path);
            const walls = new THREE.Mesh(extrudeUp(o, h, BEVEL), mat);
            walls.castShadow = walls.receiveShadow = true;
            g.add(walls);
            const ct = 0.032;
            const cap = new THREE.Mesh(
                extrudeUp(roundedPath(new THREE.Shape(), w - wall * 1.6, d - wall * 1.6, Math.max(0.03, r - wall * 0.8)) as THREE.Shape, ct, 0.008), mat);
            cap.position.y = capTop ? (h - ct) : 0.0005;
            cap.castShadow = cap.receiveShadow = true;
            g.add(cap);
            return g;
        }

        // ── 재료 ─────────────────────────────────────────────────
        let boxHex: number;
        try {
            boxHex = new THREE.Color(boxColor || "#EE3B2B").getHex();
        } catch {
            boxHex = 0xEE3B2B;
        }
        const RED = new THREE.MeshStandardMaterial({color: boxHex, roughness: 0.52, metalness: 0.02});
        (RED.color as any).convertSRGBToLinear?.();
        const pinkColor = new THREE.Color(ribbonColor || "#FFE7F2");
        const PINK = new THREE.MeshStandardMaterial({color: pinkColor, roughness: 0.42, side: THREE.DoubleSide});

        const body = makeShell(BOX_W, BOX_D, BODY_H, WALL, RAD, RED, false);
        body.position.y = LIFT;
        scene.add(body);
        const lid = makeShell(LID_W, LID_D, LID_H, WALL, RAD + 0.02, RED, true);
        lid.position.y = LID_Y;
        scene.add(lid);

        // ── 리본 경로: fillet 방식 ────────────────────────────────
        function fillet(corners: number[][], r: number): THREE.Vector2[] {
            const V = (a: number[]) => new THREE.Vector2(a[0], a[1]);
            const out: THREE.Vector2[] = [V(corners[0])];
            for (let i = 1; i < corners.length - 1; i++) {
                const A = V(corners[i - 1]), B = V(corners[i]), C = V(corners[i + 1]);
                const v1 = A.clone().sub(B), v2 = C.clone().sub(B);
                const l1 = v1.length(), l2 = v2.length();
                v1.normalize();
                v2.normalize();
                const ang = Math.acos(Math.max(-1, Math.min(1, v1.dot(v2))));
                if (ang > Math.PI - 1e-3 || ang < 1e-3) {
                    out.push(B);
                    continue;
                }
                const half = ang / 2;
                const d = Math.min(r / Math.tan(half), l1 * 0.48, l2 * 0.48);
                const rr = d * Math.tan(half);
                const P1 = B.clone().addScaledVector(v1, d), P2 = B.clone().addScaledVector(v2, d);
                const ctr = B.clone().addScaledVector(v1.clone().add(v2).normalize(), rr / Math.sin(half));
                const a1 = Math.atan2(P1.y - ctr.y, P1.x - ctr.x);
                let da = Math.atan2(P2.y - ctr.y, P2.x - ctr.x) - a1;
                while (da > Math.PI) da -= Math.PI * 2;
                while (da < -Math.PI) da += Math.PI * 2;
                const st = Math.max(3, Math.ceil(Math.abs(da) / 0.18));
                for (let s = 0; s <= st; s++) {
                    const a = a1 + da * s / st;
                    out.push(new THREE.Vector2(ctr.x + rr * Math.cos(a), ctr.y + rr * Math.sin(a)));
                }
            }
            out.push(V(corners[corners.length - 1]));
            return out;
        }

        function resample(pts: THREE.Vector2[], n: number): THREE.Vector3[] {
            const d = [0];
            for (let i = 1; i < pts.length; i++) d.push(d[i - 1] + pts[i].distanceTo(pts[i - 1]));
            const total = d[d.length - 1], res: THREE.Vector3[] = [];
            let j = 0;
            for (let i = 0; i <= n; i++) {
                const target = total * i / n;
                while (j < d.length - 2 && d[j + 1] < target) j++;
                const seg = d[j + 1] - d[j];
                const f = seg > 1e-9 ? (target - d[j]) / seg : 0;
                const p = pts[j].clone().lerp(pts[j + 1], f);
                res.push(new THREE.Vector3(p.x, p.y, 0));
            }
            return res;
        }

        function tiedPath(): THREE.Vector3[] {
            return resample(fillet([
                [0, RTOP], [-RX, RTOP], [-RX, RBOT], [RX, RBOT], [RX, RTOP], [0, RTOP],
            ], 0.09), SEGS);
        }

        function loosePath(): { pts: THREE.Vector3[]; sides: THREE.Vector3[] } {
            const pts: THREE.Vector3[] = [], sides: THREE.Vector3[] = [], L = 3.30;
            for (let i = 0; i <= SEGS; i++) {
                const s = i / SEGS, edge = Math.abs(s * 2 - 1);
                const x = -L + s * L * 2;
                const z = 0.30 * Math.sin(s * Math.PI * 2.4) + 0.42 * edge * edge * Math.sin(s * Math.PI * 5.5);
                const y = 0.022 + 0.20 * Math.pow(Math.max(0, edge - 0.55) / 0.45, 2) * Math.abs(Math.sin(s * Math.PI * 6))
                    + 0.05 * Math.max(0, Math.sin(s * Math.PI * 3.2));
                pts.push(new THREE.Vector3(x, y, z));
                const roll = 1.15 * Math.pow(Math.max(0, edge - 0.45) / 0.55, 2) * Math.sin(s * Math.PI * 7);
                sides.push(new THREE.Vector3(0, Math.sin(roll), Math.cos(roll)).normalize());
            }
            return {pts, sides};
        }

        // ── 리본 스트립: 점당 2정점(flat) ─────────────────────────
        function makeStrip(mat: THREE.Material) {
            const g = new THREE.BufferGeometry();
            g.setAttribute("position", new THREE.BufferAttribute(new Float32Array((SEGS + 1) * 6), 3));
            g.setAttribute("normal", new THREE.BufferAttribute(new Float32Array((SEGS + 1) * 6), 3));
            const uv = new Float32Array((SEGS + 1) * 4), idx: number[] = [];
            for (let i = 0; i <= SEGS; i++) {
                uv[i * 4] = i / SEGS;
                uv[i * 4 + 1] = 0;
                uv[i * 4 + 2] = i / SEGS;
                uv[i * 4 + 3] = 1;
                if (i < SEGS) {
                    const a = i * 2, b = a + 1, c = a + 2, d = a + 3;
                    idx.push(a, b, d, a, d, c);
                }
            }
            g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
            g.setIndex(idx);
            // g.attributes.position.usage = THREE.DynamicDrawUsage;
            // g.attributes.normal.usage   = THREE.DynamicDrawUsage;
            g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 8);
            const m = new THREE.Mesh(g, mat);
            m.castShadow = m.receiveShadow = true;
            m.frustumCulled = false;
            return m;
        }

        interface RibbonData {
            mesh: THREE.Mesh;
            tied: THREE.Vector3[];
            tiedS: THREE.Vector3[];
            loose: THREE.Vector3[];
            looseS: THREE.Vector3[];
        }

        function buildRibbon(rotY: number): RibbonData {
            const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotY);
            const tied = tiedPath().map(p => p.clone().applyQuaternion(q));
            const tiedS = tied.map(() => new THREE.Vector3(0, 0, 1).applyQuaternion(q));
            const lo = loosePath();
            const mesh = makeStrip(PINK);
            scene.add(mesh);
            return {
                mesh, tied, tiedS,
                loose: lo.pts.map(p => p.clone().applyQuaternion(q)),
                looseS: lo.sides.map(s => s.clone().applyQuaternion(q)),
            };
        }

        const ribbons: RibbonData[] = [buildRibbon(0), buildRibbon(Math.PI / 2)];

        const cl01 = (x: number) => x < 0 ? 0 : (x > 1 ? 1 : x);

        function easeInOutCubic(x: number) {
            return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
        }

        function easeOutBack(x: number) {
            const c = 1.70158, c3 = c + 1;
            return 1 + c3 * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2);
        }

        const M = 0.045;
        const FLOOR = LIFT - 0.012;
        const _p = new THREE.Vector3();

        function pushOut(p: THREE.Vector3, below: boolean) {
            const hx = HALF + M;
            if (Math.abs(p.x) >= hx || Math.abs(p.z) >= hx) return p;
            if (below) {
                if (p.y > FLOOR) p.y = FLOOR;
                return p;
            }
            if (p.y > FLOOR && p.y < TOP_Y + M) {
                const dx = hx - Math.abs(p.x), dz = hx - Math.abs(p.z), dy = (TOP_Y + M) - p.y;
                if (dy <= dx && dy <= dz) p.y = TOP_Y + M;
                else if (dx <= dz) p.x = (p.x < 0 ? -1 : 1) * hx;
                else p.z = (p.z < 0 ? -1 : 1) * hx;
            }
            return p;
        }

        const sP = new Float32Array((SEGS + 1) * 3);
        const sS = new Float32Array((SEGS + 1) * 3);

        function setRibbon(prog: number, settle: number) {
            const STAG = 0.32, h = RIBBON_W / 2;
            const sAmp = settle > 0 ? 0.075 * (1 - Math.exp(-10 * settle)) * Math.exp(-2.6 * settle) : 0;
            const sPh = settle > 0 ? settle * 11.0 : 0;

            for (let k = 0; k < ribbons.length; k++) {
                const r = ribbons[k];
                for (let i = 0; i <= SEGS; i++) {
                    const edge = Math.abs(i / SEGS * 2 - 1);
                    let u = (prog - STAG * (1 - edge)) / (1 - STAG);
                    u = u < 0 ? 0 : (u > 1 ? 1 : u);
                    u = easeInOutCubic(u);

                    const a = r.tied[i], b = r.loose[i];
                    _p.set(a.x + (b.x - a.x) * u, a.y + (b.y - a.y) * u, a.z + (b.z - a.z) * u);
                    _p.y += 0.26 * Math.sin(Math.PI * u) * edge;
                    if (sAmp > 0) _p.y += sAmp * Math.sin(sPh - i * 0.32 - k * 1.1) * (0.30 + 0.70 * edge);
                    if (u > 0 && u < 1) pushOut(_p, a.y < LIFT);
                    const j = i * 3;
                    sP[j] = _p.x;
                    sP[j + 1] = _p.y;
                    sP[j + 2] = _p.z;

                    const c = r.tiedS[i], d = r.looseS[i];
                    let sx = c.x + (d.x - c.x) * u, sy = c.y + (d.y - c.y) * u, sz = c.z + (d.z - c.z) * u;
                    const sl = Math.hypot(sx, sy, sz) || 1;
                    sS[j] = sx / sl;
                    sS[j + 1] = sy / sl;
                    sS[j + 2] = sz / sl;
                }

                const geo = r.mesh.geometry as THREE.BufferGeometry;
                const pos = (geo.attributes.position as THREE.BufferAttribute).array as Float32Array;
                const nor = (geo.attributes.normal as THREE.BufferAttribute).array as Float32Array;

                for (let i = 0; i <= SEGS; i++) {
                    const j = i * 3, o = i * 6;
                    const px = sP[j], py = sP[j + 1], pz = sP[j + 2];
                    const sx = sS[j], sy = sS[j + 1], sz = sS[j + 2];
                    pos[o] = px - sx * h;
                    pos[o + 1] = py - sy * h;
                    pos[o + 2] = pz - sz * h;
                    pos[o + 3] = px + sx * h;
                    pos[o + 4] = py + sy * h;
                    pos[o + 5] = pz + sz * h;

                    const pi = (i > 0 ? i - 1 : i) * 3, ni = (i < SEGS ? i + 1 : i) * 3;
                    const tx = sP[ni] - sP[pi], ty = sP[ni + 1] - sP[pi + 1], tz = sP[ni + 2] - sP[pi + 2];
                    let nx = ty * sz - tz * sy, ny = tz * sx - tx * sz, nz = tx * sy - ty * sx;
                    const nl = Math.hypot(nx, ny, nz) || 1;
                    nx /= nl;
                    ny /= nl;
                    nz /= nl;
                    nor[o] = nx;
                    nor[o + 1] = ny;
                    nor[o + 2] = nz;
                    nor[o + 3] = nx;
                    nor[o + 4] = ny;
                    nor[o + 5] = nz;
                }
                (geo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
                (geo.attributes.normal as THREE.BufferAttribute).needsUpdate = true;
            }
        }

        // ── 나비매듭 (새 방식) ────────────────────────────────────
        const bowMat = PINK.clone();
        bowMat.transparent = true;
        const bowMatShade = new THREE.MeshStandardMaterial({
            color: pinkColor.clone().multiplyScalar(0.85), roughness: 0.46, side: THREE.DoubleSide, transparent: true,
        });

        const bow = new THREE.Group();
        bow.position.y = TOP_Y + 0.02;
        scene.add(bow);

        const SIDE_Z = new THREE.Vector3(0, 0, 1);
        const LOOP_W = 0.30;

        function buildFixedStrip(
            points: THREE.Vector3[], widths: number[], sideAxis: THREE.Vector3, mat: THREE.Material
        ): THREE.Mesh {
            const n = points.length;
            const pos = new Float32Array(n * 2 * 3), nor = new Float32Array(n * 2 * 3);
            const uv = new Float32Array(n * 2 * 2), idx: number[] = [];
            for (let i = 0; i < n; i++) {
                const p = points[i], w = widths[i] / 2, o = i * 6;
                pos[o] = p.x - sideAxis.x * w;
                pos[o + 1] = p.y - sideAxis.y * w;
                pos[o + 2] = p.z - sideAxis.z * w;
                pos[o + 3] = p.x + sideAxis.x * w;
                pos[o + 4] = p.y + sideAxis.y * w;
                pos[o + 5] = p.z + sideAxis.z * w;
                uv[i * 4] = i / (n - 1);
                uv[i * 4 + 1] = 0;
                uv[i * 4 + 2] = i / (n - 1);
                uv[i * 4 + 3] = 1;
                const pi = Math.max(0, i - 1), ni = Math.min(n - 1, i + 1);
                const tx = points[ni].x - points[pi].x, ty = points[ni].y - points[pi].y,
                    tz = points[ni].z - points[pi].z;
                let nx = ty * sideAxis.z - tz * sideAxis.y, ny = tz * sideAxis.x - tx * sideAxis.z,
                    nz = tx * sideAxis.y - ty * sideAxis.x;
                const nl = Math.hypot(nx, ny, nz) || 1;
                nx /= nl;
                ny /= nl;
                nz /= nl;
                nor[o] = nx;
                nor[o + 1] = ny;
                nor[o + 2] = nz;
                nor[o + 3] = nx;
                nor[o + 4] = ny;
                nor[o + 5] = nz;
                if (i < n - 1) {
                    const a = i * 2, b = a + 1, c = a + 2, dv = a + 3;
                    idx.push(a, b, dv, a, dv, c);
                }
            }
            const geo = new THREE.BufferGeometry();
            geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
            geo.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
            geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
            geo.setIndex(idx);
            const mesh = new THREE.Mesh(geo, mat);
            mesh.castShadow = mesh.receiveShadow = true;
            return mesh;
        }

        function catmull(pts2D: [number, number][], segs: number): THREE.Vector3[] {
            return new THREE.CatmullRomCurve3(
                pts2D.map(([x, y]) => new THREE.Vector3(x, y, 0)), false, "catmullrom", 0.55
            ).getSpacedPoints(segs);
        }

        function widthProfile(n: number, base: number): number[] {
            const w = new Array<number>(n);
            for (let i = 0; i < n; i++) {
                const u = i / (n - 1);
                w[i] = base * (0.32 + 0.68 * Math.sin(Math.PI * u));
            }
            return w;
        }

        const loopL = catmull([
            [0.02, 0.02], [-0.08, 0.16], [-0.24, 0.34], [-0.36, 0.58], [-0.34, 0.82],
            [-0.16, 0.94], [0.02, 0.80], [0.06, 0.50], [0.03, 0.20], [0.00, 0.02],
        ], 42);
        const loopR = catmull([
            [-0.02, 0.02], [0.09, 0.15], [0.22, 0.30], [0.29, 0.50], [0.23, 0.68],
            [0.07, 0.66], [-0.02, 0.46], [-0.03, 0.20], [0.00, 0.02],
        ], 34);

        const meshLoopL = buildFixedStrip(loopL, widthProfile(loopL.length, LOOP_W), SIDE_Z, bowMat);
        const meshLoopR = buildFixedStrip(loopR, widthProfile(loopR.length, LOOP_W * 0.86), SIDE_Z, bowMat);
        const meshLoopLShade = buildFixedStrip(loopL, widthProfile(loopL.length, LOOP_W * 0.62), SIDE_Z, bowMatShade);
        const meshLoopRShade = buildFixedStrip(loopR, widthProfile(loopR.length, LOOP_W * 0.55), SIDE_Z, bowMatShade);
        meshLoopLShade.position.z = -0.028;
        meshLoopLShade.rotation.y = 0.05;
        meshLoopRShade.position.z = -0.028;
        meshLoopRShade.rotation.y = -0.05;

        const loopGroupL = new THREE.Group();
        loopGroupL.add(meshLoopLShade, meshLoopL);
        loopGroupL.rotation.set(0.16, 0.10, 0.05);
        const loopGroupR = new THREE.Group();
        loopGroupR.add(meshLoopRShade, meshLoopR);
        loopGroupR.rotation.set(0.16, -0.14, -0.08);
        bow.add(loopGroupL, loopGroupR);

        const knotGeo = new THREE.SphereGeometry(0.10, 16, 12);
        knotGeo.scale(1.05, 0.72, 0.62);
        const knot = new THREE.Mesh(knotGeo, bowMat);
        knot.position.y = 0.045;
        knot.castShadow = true;
        const knotGroup = new THREE.Group();
        knotGroup.add(knot);
        bow.add(knotGroup);

        function tailPoints(sg: number, len: number): THREE.Vector3[] {
            const n = 20, pts: THREE.Vector3[] = [];
            for (let i = 0; i < n; i++) {
                const s = i / (n - 1);
                pts.push(new THREE.Vector3(
                    sg * (0.06 + 0.16 * s),
                    0.02 - len * s * s * 0.75 - 0.04 * s,
                    0.05 * Math.sin(s * Math.PI * 1.6) * s
                ));
            }
            return pts;
        }

        function tailWidth(n: number, base: number): number[] {
            const w = new Array<number>(n);
            for (let i = 0; i < n; i++) {
                const u = i / (n - 1);
                w[i] = base * (1 - 0.62 * u);
            }
            return w;
        }

        const tailPtsR = tailPoints(1, 0.62), tailPtsL = tailPoints(-1, 0.52);
        const meshTailR = buildFixedStrip(tailPtsR, tailWidth(tailPtsR.length, 0.22), SIDE_Z, bowMat);
        const meshTailL = buildFixedStrip(tailPtsL, tailWidth(tailPtsL.length, 0.20), SIDE_Z, bowMat);
        const tailGroupR = new THREE.Group();
        tailGroupR.add(meshTailR);
        tailGroupR.rotation.y = -0.35;
        const tailGroupL = new THREE.Group();
        tailGroupL.add(meshTailL);
        tailGroupL.rotation.y = 0.30;
        bow.add(tailGroupR, tailGroupL);

        interface BowPart {
            g: THREE.Group;
            kind: "loop" | "tail" | "knot";
            phase: number;
            twist: number;
            baseRotZ: number;
        }

        const bowParts: BowPart[] = [
            {g: loopGroupL, kind: "loop", phase: 0.00, twist: 1.0, baseRotZ: loopGroupL.rotation.z},
            {g: loopGroupR, kind: "loop", phase: 0.10, twist: -1.2, baseRotZ: loopGroupR.rotation.z},
            {g: tailGroupR, kind: "tail", phase: 0.18, twist: 0.7, baseRotZ: tailGroupR.rotation.z},
            {g: tailGroupL, kind: "tail", phase: 0.05, twist: -0.6, baseRotZ: tailGroupL.rotation.z},
            {g: knotGroup, kind: "knot", phase: 0.58, twist: 0.35, baseRotZ: knotGroup.rotation.z},
        ];

        // ── 폭죽/컨페티 ──────────────────────────────────────────
        const BGC = new THREE.Color(0xFDF1ED);
        const UPV = new THREE.Vector3(0, 1, 0);
        const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _v = new THREE.Vector3(),
            _sc = new THREE.Vector3(), _e = new THREE.Euler(), _c = new THREE.Color(), _dir = new THREE.Vector3();

        const N_SPK = 660;
        const spk = new THREE.InstancedMesh(new THREE.BoxGeometry(0.032, 0.20, 0.032), new THREE.MeshBasicMaterial(), N_SPK);
        spk.instanceMatrix.usage = THREE.DynamicDrawUsage;
        spk.frustumCulled = false;
        scene.add(spk);

        const N_FLK = 200;
        const flk = new THREE.InstancedMesh(
            new THREE.PlaneGeometry(0.17, 0.11),
            new THREE.MeshStandardMaterial({side: THREE.DoubleSide, roughness: 0.34, metalness: 0.10}), N_FLK);
        flk.instanceMatrix.usage = THREE.DynamicDrawUsage;
        flk.frustumCulled = false;
        scene.add(flk);

        interface Spark {
            pos: THREE.Vector3;
            vel: THREE.Vector3;
            base: THREE.Color;
            life: number;
            max: number;
            w: number;
            alive: boolean;
        }

        interface Flake {
            pos: THREE.Vector3;
            vel: THREE.Vector3;
            rot: THREE.Euler;
            spin: THREE.Vector3;
            seed: number;
            size: number;
            age: number;
            alive: boolean;
            exited: boolean;
        }

        const sparks: Spark[] = [], flakes: Flake[] = [];
        for (let i = 0; i < N_SPK; i++) sparks.push({
            pos: new THREE.Vector3(),
            vel: new THREE.Vector3(),
            base: new THREE.Color(),
            life: 0,
            max: 1,
            w: 1,
            alive: false
        });
        for (let i = 0; i < N_FLK; i++) flakes.push({
            pos: new THREE.Vector3(),
            vel: new THREE.Vector3(),
            rot: new THREE.Euler(),
            spin: new THREE.Vector3(),
            seed: 0,
            size: 1,
            age: 0,
            alive: false,
            exited: false
        });
        for (let i = 0; i < N_SPK; i++) spk.setColorAt(i, _c.setRGB(1, 1, 1));
        const FLK_COLORS = [0xFF2D78, 0x22D3EE, 0xFFE01B, 0xFF7A00, 0x4ADE80, 0x7C5CFF, 0x2563EB, 0xFF4D6D];
        for (let i = 0; i < N_FLK; i++) flk.setColorAt(i, _c.setHex(FLK_COLORS[i % FLK_COLORS.length]));

        const flash = new THREE.PointLight(0xFFE9C4, 0, 14, 2);
        flash.position.set(0, 3, 0);
        scene.add(flash);
        let flashI = 0;

        const MOUTH = BOX_W / 2 - WALL - 0.13;
        const LAUNCH = new THREE.Vector3(0, LIFT + 0.30, 0);
        const rocketGeo = new THREE.SphereGeometry(0.075, 10, 8);

        interface Shell {
            at: number;
            dur: number;
            apex: THREE.Vector3;
            hue: number[];
            n: number;
            spd: number;
            mesh: THREE.Mesh;
            fired: boolean;
            trail: number;
        }

        const SHELLS: Shell[] = [
            {
                at: 0.00,
                dur: 0.62,
                apex: new THREE.Vector3(0.05, 4.9, 0.10),
                hue: [0xFF2D78, 0xFFD93D, 0xFF7A00],
                n: 150,
                spd: 5.4,
                mesh: null!,
                fired: false,
                trail: 0
            },
            {
                at: 0.34,
                dur: 0.56,
                apex: new THREE.Vector3(-1.30, 4.0, -0.55),
                hue: [0x22D3EE, 0x7C5CFF, 0x4ADE80],
                n: 130,
                spd: 4.7,
                mesh: null!,
                fired: false,
                trail: 0
            },
            {
                at: 0.68,
                dur: 0.66,
                apex: new THREE.Vector3(1.35, 5.6, 0.45),
                hue: [0xFFE01B, 0xFF4D6D, 0xFFFFFF],
                n: 165,
                spd: 5.8,
                mesh: null!,
                fired: false,
                trail: 0
            },
        ];
        for (const sh of SHELLS) {
            sh.mesh = new THREE.Mesh(rocketGeo, new THREE.MeshBasicMaterial({color: sh.hue[0]}));
            sh.mesh.visible = false;
            scene.add(sh.mesh);
        }
        let burstT = 0;
        const BURST_LEN = 1.45;

        function getSpark(): Spark | null {
            for (let i = 0; i < N_SPK; i++) if (!sparks[i].alive) return sparks[i];
            return null;
        }

        function emitSpark(x: number, y: number, z: number, vx: number, vy: number, vz: number, hex: number, life: number, w: number) {
            const p = getSpark();
            if (!p) return;
            p.pos.set(x, y, z);
            p.vel.set(vx, vy, vz);
            p.base.setHex(hex);
            p.life = 1;
            p.max = life;
            p.w = w;
            p.alive = true;
        }

        function explode(sh: Shell) {
            for (let i = 0; i < sh.n; i++) {
                const u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2, r = Math.sqrt(1 - u * u);
                const s = sh.spd * (0.62 + Math.random() * 0.48);
                emitSpark(sh.apex.x, sh.apex.y, sh.apex.z, r * Math.cos(th) * s, u * s * 0.92 + 0.6, r * Math.sin(th) * s, sh.hue[(Math.random() * sh.hue.length) | 0], 1.05 + Math.random() * 0.85, 0.75 + Math.random() * 0.6);
            }
            flash.position.copy(sh.apex);
            flashI = 11;
        }

        function launchFlakes() {
            for (let i = 0; i < N_FLK; i++) {
                const p = flakes[i];
                const a = Math.random() * Math.PI * 2, r = Math.random() * MOUTH * 0.8;
                p.pos.set(Math.cos(a) * r, LIFT + 0.28, Math.sin(a) * r);
                p.vel.set((Math.random() - 0.5) * 3.4, 6.4 + Math.random() * 3.6, (Math.random() - 0.5) * 3.4);
                p.rot.set(Math.random() * 6.28, Math.random() * 6.28, Math.random() * 6.28);
                p.spin.set((Math.random() - 0.5) * 9, (Math.random() - 0.5) * 9, (Math.random() - 0.5) * 9);
                p.seed = Math.random() * 6.28;
                p.size = 0.7 + Math.random() * 0.7;
                p.age = 0;
                p.alive = true;
                p.exited = false;
            }
        }

        function clearConfetti() {
            _sc.set(0, 0, 0);
            for (let i = 0; i < N_SPK; i++) {
                sparks[i].alive = false;
                _m4.compose(_v.set(0, -99, 0), _q.identity(), _sc);
                spk.setMatrixAt(i, _m4);
            }
            for (let i = 0; i < N_FLK; i++) {
                flakes[i].alive = false;
                _m4.compose(_v.set(0, -99, 0), _q.identity(), _sc);
                flk.setMatrixAt(i, _m4);
            }
            spk.instanceMatrix.needsUpdate = true;
            flk.instanceMatrix.needsUpdate = true;
            for (const sh of SHELLS) {
                sh.fired = false;
                sh.trail = 0;
                sh.mesh.visible = false;
            }
            flashI = 0;
            flash.intensity = 0;
            burstT = 0;
        }

        clearConfetti();

        function updateBurst(dt: number) {
            burstT += dt;
            for (const sh of SHELLS) {
                if (sh.fired) continue;
                const lt = burstT - sh.at;
                if (lt < 0) continue;
                const u = lt / sh.dur;
                if (u < 1) {
                    sh.mesh.visible = true;
                    const ey = 1 - Math.pow(1 - u, 2);
                    sh.mesh.position.set(LAUNCH.x + (sh.apex.x - LAUNCH.x) * u, LAUNCH.y + (sh.apex.y - LAUNCH.y) * ey, LAUNCH.z + (sh.apex.z - LAUNCH.z) * u);
                    sh.mesh.scale.setScalar(1 - 0.35 * u);
                    sh.trail += dt;
                    if (sh.trail > 0.018) {
                        sh.trail = 0;
                        emitSpark(sh.mesh.position.x, sh.mesh.position.y, sh.mesh.position.z, (Math.random() - 0.5) * 0.7, -0.9 - Math.random() * 1.1, (Math.random() - 0.5) * 0.7, sh.hue[0], 0.30 + Math.random() * 0.2, 0.5);
                    }
                } else {
                    sh.mesh.visible = false;
                    sh.fired = true;
                    explode(sh);
                }
            }
        }

        function stepConfetti(dt: number, el: number) {
            let anyS = false;
            for (let i = 0; i < N_SPK; i++) {
                const p = sparks[i];
                if (!p.alive) continue;
                anyS = true;
                p.life -= dt / p.max;
                if (p.life <= 0) {
                    p.alive = false;
                    _m4.compose(_v.set(0, -99, 0), _q.identity(), _sc.set(0, 0, 0));
                    spk.setMatrixAt(i, _m4);
                    continue;
                }
                p.vel.y -= 6.4 * dt;
                const drag = 1 - 2.3 * dt;
                p.vel.x *= drag;
                p.vel.y *= drag;
                p.vel.z *= drag;
                p.pos.addScaledVector(p.vel, dt);
                const sp = p.vel.length();
                if (sp > 1e-4) {
                    _dir.copy(p.vel).multiplyScalar(1 / sp);
                    _q.setFromUnitVectors(UPV, _dir);
                }
                const fade = Math.min(1, p.life * 2.6);
                const tw = 0.75 + 0.25 * Math.sin(el * 38 + i * 1.7);
                _sc.set(p.w * fade * tw, (0.55 + sp * 0.16) * fade, p.w * fade * tw);
                _m4.compose(p.pos, _q, _sc);
                spk.setMatrixAt(i, _m4);
                spk.setColorAt(i, _c.copy(p.base).lerp(BGC, 1 - Math.min(1, p.life * 1.6)));
            }
            if (anyS) {
                spk.instanceMatrix.needsUpdate = true;
                if (spk.instanceColor) spk.instanceColor.needsUpdate = true;
            }

            let anyF = false;
            for (let i = 0; i < N_FLK; i++) {
                const p = flakes[i];
                if (!p.alive) continue;
                anyF = true;
                p.age += dt;
                p.vel.y -= 7.4 * dt;
                p.vel.x += Math.sin(p.age * 5.5 + p.seed) * 1.9 * dt;
                p.vel.z += Math.cos(p.age * 4.7 + p.seed) * 1.9 * dt;
                const d = 1 - 1.5 * dt;
                p.vel.x *= d;
                p.vel.z *= d;
                p.vel.y *= (1 - 0.9 * dt);
                p.pos.addScaledVector(p.vel, dt);
                if (!p.exited) {
                    if (p.pos.y >= BODY_TOP) {
                        p.exited = true;
                    } else {
                        p.pos.x = Math.max(-MOUTH, Math.min(MOUTH, p.pos.x));
                        p.pos.z = Math.max(-MOUTH, Math.min(MOUTH, p.pos.z));
                    }
                }
                p.rot.x += p.spin.x * dt;
                p.rot.y += p.spin.y * dt;
                p.rot.z += p.spin.z * dt;
                let s = p.size * Math.min(1, p.age * 8);
                if (p.pos.y < -1.6) {
                    p.alive = false;
                    s = 0;
                }
                _m4.compose(p.pos, _q.setFromEuler(_e.copy(p.rot)), _sc.set(s, s, s));
                flk.setMatrixAt(i, _m4);
            }
            if (anyF) flk.instanceMatrix.needsUpdate = true;

            if (flashI > 0.01) {
                flashI *= Math.pow(0.02, dt);
                flash.intensity = flashI;
            } else if (flash.intensity !== 0) {
                flashI = 0;
                flash.intensity = 0;
            }
        }

        // ── 스테이지 머신 ────────────────────────────────────────
        const S = {TIED: 0, UNTYING: 1, UNTIED: 2, OPENING: 3, OPENED: 4, BURSTING: 5, DONE: 6};
        let stage = S.TIED, t = 0;
        let ribbonSettle = -1, lidSettle = -1;
        const D_UNTIE = 1.55, D_OPEN = 1.35;
        const LAND = new THREE.Vector3(1.72, 0.06, -1.72);
        const RISE = LID_Y + 0.95;

        const advanceStage = () => {
            if (stage === S.TIED) {
                stage = S.UNTYING;
                t = 0;
            } else if (stage === S.UNTIED) {
                stage = S.OPENING;
                t = 0;
            }
        };

        // ── 포인터 이벤트 ────────────────────────────────────────
        let activePointer: number | null = null, downX = 0, downY = 0, moved = false;
        const TAP_TOL = 6;
        const onDown = (e: PointerEvent) => {
            if (activePointer !== null) return;
            activePointer = e.pointerId;
            downX = e.clientX;
            downY  = e.clientY;
            moved = false;
            try {
                canvas.setPointerCapture(e.pointerId);
            } catch {
            }
        };
        const onMove = (e: PointerEvent) => {
            if (e.pointerId !== activePointer) return;
            // lastX = e.clientX;
            // lastY = e.clientY;
            if (!moved && (Math.abs(e.clientX - downX) > TAP_TOL || Math.abs(e.clientY - downY) > TAP_TOL)) moved = true;
        };
        const endDrag = (e: PointerEvent) => {
            if (e.pointerId !== activePointer) return;
            activePointer = null;
            if (!moved) advanceStage();
        };
        canvas.addEventListener("pointerdown", onDown);
        canvas.addEventListener("pointermove", onMove);
        canvas.addEventListener("pointerup", endDrag);
        canvas.addEventListener("pointercancel", endDrag);

        // ── 리셋 ─────────────────────────────────────────────────
        const resetAll = () => {
            stage = S.TIED;
            t = 0;
            ribbonSettle = -1;
            lidSettle = -1;
            setRibbon(0, 0);
            bow.visible = true;
            for (const part of bowParts) {
                part.g.visible = true;
                part.g.scale.setScalar(1);
                part.g.rotation.z = part.baseRotZ;
            }
            bowMat.opacity = 1;
            bowMatShade.opacity = 1;
            lid.position.set(0, LID_Y, 0);
            lid.rotation.set(0, 0, 0);
            clearConfetti();
            camPosGoal.set(0, 2.6, 7.2);
            camTgtGoal.set(0, 0.95, 0);
            if (mountedRef.current) {
                setVeilShow(false);
                setCardShow(false);
            }
        };
        resetRef.current = resetAll;

        // ── 애니메이션 루프 ──────────────────────────────────────
        let raf = 0;
        let prevMs = performance.now(), el = 0;

        const tick = () => {
            if (!mountedRef.current) return;
            const now = performance.now();
            let dt = (now - prevMs) / 1000;
            prevMs = now;
            if (dt > 1 / 20) dt = 1 / 20;
            el += dt;
            t += dt;

            if (canvas.clientWidth !== lastW || canvas.clientHeight !== lastH) resize();

            if (stage === S.UNTYING) {
                const p = cl01(t / D_UNTIE);
                setRibbon(p, 0);
                const bp = cl01(t / 0.85);
                let anyVisible = false;
                for (const part of bowParts) {
                    const raw = cl01((bp - part.phase) / (1 - part.phase));
                    const u = easeInOutCubic(raw);
                    const pop = u < 0.18 ? easeOutBack(u / 0.18) : 1;
                    const shrink = u < 0.18 ? 0 : easeInOutCubic((u - 0.18) / 0.82);
                    const s = Math.max(0, (1 + 0.10 * pop * (1 - shrink)) * (1 - shrink));
                    part.g.scale.setScalar(Math.max(0.0001, s));
                    part.g.rotation.z = part.baseRotZ + shrink * part.twist;
                    part.g.visible = s > 0.004;
                    if (part.g.visible) anyVisible = true;
                    if (part.kind === "knot") {
                        const fade = 1 - Math.max(0, (u - 0.85) / 0.15);
                        bowMat.opacity = Math.min(bowMat.opacity, fade);
                        bowMatShade.opacity = Math.min(bowMatShade.opacity, fade);
                    }
                }
                if (!anyVisible) bow.visible = false;
                if (p >= 1) {
                    stage = S.UNTIED;
                    t = 0;
                    ribbonSettle = 0;
                }
            } else if (stage === S.OPENING) {
                const p = cl01(t / D_OPEN);
                const lift = easeInOutCubic(cl01(t / (D_OPEN * 0.34)));
                const sT = easeInOutCubic(cl01((t - D_OPEN * 0.30) / (D_OPEN * 0.38)));
                const dT = easeInOutCubic(cl01((t - D_OPEN * 0.68) / (D_OPEN * 0.32)));
                lid.position.x = LAND.x * sT;
                lid.position.z = LAND.z * sT;
                lid.position.y = (LID_Y + (RISE - LID_Y) * lift) * (1 - dT) + LAND.y * dT;
                lid.rotation.y = -0.34 * sT;
                lid.rotation.z = -0.12 * Math.sin(Math.PI * sT);
                if (p >= 1) {
                    stage = S.OPENED;
                    t = 0;
                    lidSettle = 0;
                }
            } else if (stage === S.BURSTING) {
                if (burstT < BURST_LEN) updateBurst(dt);
                if (t > 2.4) {
                    stage = S.DONE;
                    t = 0;
                    if (mountedRef.current) {
                        setVeilShow(true);
                        setCardShow(true);
                    }
                }
            }
            stepConfetti(dt, el);

            if (ribbonSettle >= 0) {
                ribbonSettle += dt;
                if (ribbonSettle < 2.4) {
                    setRibbon(1, ribbonSettle);
                } else {
                    setRibbon(1, 0);
                    ribbonSettle = -1;
                }
            }
            if (lidSettle >= 0) {
                lidSettle += dt;
                const a = Math.exp(-5.0 * lidSettle);
                if (lidSettle < 1.4) {
                    lid.position.y = LAND.y + 0.085 * a * Math.abs(Math.sin(lidSettle * 9.5));
                    lid.rotation.z = -0.05 * a * Math.sin(lidSettle * 8.0);
                    lid.rotation.x = 0.04 * a * Math.sin(lidSettle * 7.0);
                } else {
                    lid.position.y = LAND.y;
                    lid.rotation.z = 0;
                    lid.rotation.x = 0;
                    lidSettle = -1;
                    if (stage === S.OPENED) {
                        stage = S.BURSTING;
                        t = 0;
                        burstT = 0;
                        launchFlakes();
                        camPosGoal.set(0, 4.3, 10.6);
                        camTgtGoal.set(0, 3.1, 0);
                    }
                }
            }

            camPos.lerp(camPosGoal, 1 - Math.pow(0.001, dt));
            camTgt.lerp(camTgtGoal, 1 - Math.pow(0.001, dt));
            _camVec.subVectors(camPos, camTgt);
            const radius = _camVec.length();
            const baseTheta = Math.atan2(_camVec.x, _camVec.z);
            const basePhi = Math.acos(THREE.MathUtils.clamp(_camVec.y / radius, -1, 1));
            camera.position.set(
                camTgt.x + radius * Math.sin(basePhi) * Math.sin(baseTheta),
                camTgt.y + radius * Math.cos(basePhi),
                camTgt.z + radius * Math.sin(basePhi) * Math.cos(baseTheta),
            );
            camera.lookAt(camTgt);
            renderer.render(scene, camera);
            raf = requestAnimationFrame(tick);
        };

        resize();
        setRibbon(0, 0);
        tick();

        return () => {
            mountedRef.current = false;
            cancelAnimationFrame(raf);
            window.removeEventListener("resize", resize);
            try {
                ro.disconnect();
            } catch {
            }
            canvas.removeEventListener("pointerdown", onDown);
            canvas.removeEventListener("pointermove", onMove);
            canvas.removeEventListener("pointerup", endDrag);
            canvas.removeEventListener("pointercancel", endDrag);
            try {
                renderer.dispose();
            } catch {
            }
        };
    }, [boxColor, ribbonColor]);

    return (
        <div style={{
            position: "absolute", inset: 0, background: "#FDF1ED", overflow: "hidden",
            fontFamily: "-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Pretendard','Noto Sans KR',sans-serif",
            color: "#5A3B40", touchAction: "manipulation"
        }}
        >
            <canvas ref={canvasRef}
                    style={{display: "block", width: "100%", height: "100%", cursor: "pointer", touchAction: "none"}}/>

            {/* 베일 */}
            <div style={{
                position: "absolute", inset: 0, background: "rgba(90,59,64,.28)", backdropFilter: "blur(2px)",
                transition: "opacity .5s ease", opacity: veilShow ? 1 : 0, pointerEvents: veilShow ? "auto" : "none"
            }}/>

            {/* 카드 */}
            <div style={{
                position: "absolute", left: "50%", top: "50%", width: "95%",
                background: "#fff", borderRadius: 26, padding: "34px 28px 26px", textAlign: "center",
                boxShadow: "0 24px 60px -18px rgba(190,90,110,.45)",
                transition: "transform .5s cubic-bezier(.2,1.3,.4,1), opacity .4s ease",
                transform: cardShow ? "translate(-50%,-50%) scale(1)" : "translate(-50%,-46%) scale(0.86)",
                opacity: cardShow ? 1 : 0, pointerEvents: cardShow ? "auto" : "none"
            }}
            >
                <div style={{fontSize: 44, lineHeight: 1}}>{cardEmoji}</div>
                <h2 style={{
                    margin: "16px 0 10px",
                    fontSize: 20,
                    fontWeight: 700,
                    letterSpacing: "-.01em",
                    color: "#5A3B40"
                }}>{cardTitle}</h2>
                {cardImage && (
                    <img
                        src={cardImage}
                        alt=""
                        style={{
                            width: "100%",
                            borderRadius: 12,
                            marginBottom: 12,
                            objectFit: "cover",
                            maxHeight: 200,
                        }}
                    />
                )}
                <p style={{
                    margin: 0,
                    fontSize: 15,
                    lineHeight: 1.65,
                    color: "#8B6B71",
                    whiteSpace: "pre-line"
                }}>{cardMessage}</p>
                {/*<button onClick={() => resetRef.current?.()}*/}
                {/*        style={{*/}
                {/*            marginTop: 24,*/}
                {/*            width: "100%",*/}
                {/*            border: 0,*/}
                {/*            background: "#F0576C",*/}
                {/*            color: "#fff",*/}
                {/*            font: "inherit",*/}
                {/*            fontSize: 15,*/}
                {/*            fontWeight: 600,*/}
                {/*            padding: "14px 0",*/}
                {/*            borderRadius: 14,*/}
                {/*            cursor: "pointer"*/}
                {/*        }}>*/}
                {/*    다시 보기*/}
                {/*</button>*/}
            </div>

        </div>
    );
}
