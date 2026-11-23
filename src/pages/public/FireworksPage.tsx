// @ts-nocheck
/* eslint-disable */
import { useEffect, useRef } from 'react';

// 픽셀 불꽃놀이 엔진 (프레임워크 무관)
function createPixelFireworks(canvas, opts) {
  opts = opts || {};
  const W = 320, H = 180, WATER = 113, G = 0.035;
  const SPEED = opts.speed || 0.75; // 시뮬레이션 속도 배율
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  let seed = 20261123;
  const srand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];
  const mk = (w, h) => {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const x = c.getContext('2d'); x.imageSmoothingEnabled = false; return [c, x];
  };
  const px = (g, x, y, col) => { g.fillStyle = col; g.fillRect(x | 0, y | 0, 1, 1); };

  // ---------- 하늘 (베이어 디더링 그라데이션 + 별) ----------
  const [skyC, sky] = mk(W, WATER);
  const bayer = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
  const skyCols = ['#04050b', '#070913', '#0b0e1c', '#121427', '#1a1a2e'];
  for (let y = 0; y < WATER; y++) {
    const f = (y / WATER) * (skyCols.length - 1);
    const base = Math.floor(f), frac = f - base;
    for (let x = 0; x < W; x++) {
      const i = frac * 16 > bayer[y & 3][x & 3] ? Math.min(base + 1, skyCols.length - 1) : base;
      px(sky, x, y, skyCols[i]);
    }
  }
  for (let i = 0; i < 45; i++) px(sky, srand() * W, srand() * 70, srand() < 0.3 ? '#6a6f8c' : '#2c3048');

  // ---------- 강 건너 스카이라인 ----------
  const [cityC, city] = mk(W, WATER);
  const twinkles = [];
  for (let x = 0; x < W; x++) {
    const h = Math.round(9 + Math.sin(x * 0.03) * 3 + Math.sin(x * 0.011 + 1) * 4);
    city.fillStyle = '#0a0c19'; city.fillRect(x, WATER - h, 1, h);
  }
  for (let x = 0; x < W;) {
    const bw = 3 + Math.floor(srand() * 8);
    const tall = srand() < 0.12;
    const bh = tall ? 16 + Math.floor(srand() * 12) : 4 + Math.floor(srand() * 12);
    city.fillStyle = '#05060d'; city.fillRect(x, WATER - bh, bw, bh);
    for (let yy = WATER - bh + 1; yy < WATER - 1; yy += 2)
      for (let xx = x + 1; xx < x + bw - 1; xx += 2)
        if (srand() < 0.28) {
          const col = pick(['#5a4a2a', '#7a6534', '#3a3a50', '#9a7a40', '#c8a050']);
          px(city, xx, yy, col);
          if (srand() < 0.08) twinkles.push({ x: xx, y: yy, col, on: true });
        }
    if (tall) twinkles.push({ x: x + (bw >> 1), y: WATER - bh - 1, col: '#ff3030', on: true, blink: true });
    x += bw + (srand() < 0.3 ? 1 : 0);
  }
  for (let x = 0; x < W; x += 2 + ((srand() * 3) | 0)) px(city, x, WATER - 1, srand() < 0.7 ? '#c8822e' : '#e8e0c0');

  // ---------- 가까운 강변 + 타워 + 다리 ----------
  const [nearC, near] = mk(W, H);
  const landTop = (x) => (x < 55 ? 134 : 134 + Math.pow((x - 55) / 95, 2) * 50);
  for (let x = 0; x < W; x++) {
    const t = Math.round(landTop(x));
    if (t < H) { near.fillStyle = '#04050a'; near.fillRect(x, t, 1, H - t); }
  }
  // 강변도로 가로등
  for (let x = 0; x < 150; x += 3) {
    const y = Math.round(landTop(x)) + 3;
    if (y < H) px(near, x, y, x % 9 === 0 ? '#f0e6c8' : '#d98b2b');
  }
  for (let i = 0; i < 40; i++) {
    const x = srand() * 120, y = landTop(x) + 6 + srand() * 30;
    if (y < H) px(near, x, y, pick(['#c87a2a', '#8a6a3a', '#3a4060']));
  }
  // 타워 그리기
  const tower = (x0, w, top, crown) => {
    near.fillStyle = '#080a13'; near.fillRect(x0, top, w, H - top);
    near.fillStyle = '#121828'; near.fillRect(x0 + w - 1, top, 1, H - top);
    for (let y = top + 6; y < H; y += 3)
      for (let x = x0 + 1; x < x0 + w - 1; x += 2) {
        const r = srand();
        if (r < 0.55) px(near, x, y, r < 0.08 ? '#4a5a7a' : '#161c2e');
      }
    if (crown) {
      near.fillStyle = '#161c2e'; near.fillRect(x0, top, w, 8);
      // 3x5 픽셀 폰트로 간판 글자
      // 소형 픽셀 폰트 (아래 정렬)
      const FONT = {
        H: ['101', '101', '111', '101', '101'],
        h: ['100', '100', '110', '101', '101'],
        a: ['011', '101', '011'],
        n: ['110', '101', '101'],
        w: ['10101', '10101', '01010'],
      };
      const text = crown, base = top + 6;
      const tw = [...text].reduce((n, ch) => n + FONT[ch][0].length + 1, -1);
      // 글자 왼쪽 주황 동그라미
      const start = x0 + Math.floor((w - (4 + 2 + tw)) / 2);
      near.fillStyle = '#ff8a3d';
      ['0110', '1111', '1111', '0110'].forEach((row, ry) => [...row].forEach((bit, rx) => {
        if (bit === '1') near.fillRect(start + rx, top + 3 + ry, 1, 1);
      }));
      let cx = start + 6;
      for (const ch of text) {
        const g = FONT[ch];
        g.forEach((row, ry) => [...row].forEach((bit, rx) => {
          if (bit === '1') px(near, cx + rx, base - g.length + 1 + ry, '#f4efe6');
        }));
        cx += g[0].length + 1;
      }
    }
  };
  tower(3, 14, 84, false);
  tower(20, 33, 50, 'hanwha');
  // 다리
  const BX0 = 50, BY0 = 147, BY1 = 125;
  const bridgeY = (x) => Math.round(BY0 + ((x - BX0) * (BY1 - BY0)) / (W - BX0));
  for (let x = BX0; x < W; x++) {
    const y = bridgeY(x);
    if (x % 26 === 0) { near.fillStyle = '#141a30'; near.fillRect(x, y + 3, 2, 9); } // 교각
    px(near, x, y - 1, '#4a5680');                                        // 난간 하이라이트
    near.fillStyle = '#232b4a'; near.fillRect(x, y, 1, 2);                // 상판
    px(near, x, y + 2, '#10142a');                                        // 하부
    if (x % 4 === 0) px(near, x, y + 3, '#5a7ac0');                       // 하부 조명
    if (x % 8 === 0) {                                                    // 가로등
      near.fillStyle = '#3a4466'; near.fillRect(x, y - 3, 1, 2);
      px(near, x, y - 4, '#ffe6a0');
      px(near, x - 1, y - 4, '#a8763a'); px(near, x + 1, y - 4, '#a8763a');
    }
  }

  // 소등용 실루엣 (불빛 없는 버전)
  const silhouette = (src, col) => {
    const [c, g] = mk(src.width, src.height);
    g.drawImage(src, 0, 0); g.globalCompositeOperation = 'source-atop';
    g.fillStyle = col; g.fillRect(0, 0, c.width, c.height); return c;
  };
  const cityDarkC = silhouette(cityC, '#05060d');
  const nearDarkC = silhouette(nearC, '#04050a');

  // ---------- 메시지 (글자를 픽셀 좌표로) ----------
  const MESSAGE = opts.message || '사랑해';
  const HEART = opts.heart !== false;
  const MESSAGE_AT = opts.messageAt || 10; // 초
  function messagePoints() {
    const [c, g] = mk(W, 70);
    g.fillStyle = '#fff'; g.textBaseline = 'middle';
    g.font = 'bold 28px "Malgun Gothic","Apple SD Gothic Neo","Noto Sans KR","Noto Sans CJK KR",sans-serif';
    const tw = g.measureText(MESSAGE).width, hs = HEART ? 26 : 0, gap = HEART ? 10 : 0;
    const x0 = Math.round((W - (tw + gap + hs)) / 2);
    g.fillText(MESSAGE, x0, 35);
    const hx = x0 + tw + gap; // 하트 시작 x
    if (HEART) {
      const cx = hx + hs / 2, top = 35 - hs / 2 + 3;
      g.beginPath();
      g.moveTo(cx, top + hs * 0.3);
      g.bezierCurveTo(cx, top, cx - hs / 2, top, cx - hs / 2, top + hs * 0.3);
      g.bezierCurveTo(cx - hs / 2, top + hs * 0.6, cx, top + hs * 0.8, cx, top + hs);
      g.bezierCurveTo(cx, top + hs * 0.8, cx + hs / 2, top + hs * 0.6, cx + hs / 2, top + hs * 0.3);
      g.bezierCurveTo(cx + hs / 2, top, cx, top, cx, top + hs * 0.3);
      g.fill();
    }
    const d = g.getImageData(0, 0, W, 70).data, pts = [];
    for (let y = 0; y < 70; y += 2)
      for (let x = (y / 2) % 2; x < W; x += 2)
        if (d[(y * W + x) * 4 + 3] > 140) pts.push({ x, y: y + 8, pal: HEART && x >= hx - 1 ? PAL.red : PAL.pink });
    return pts;
  }

  // ---------- 상태 ----------
  const [fxC, fx] = mk(W, H);
  const PAL = {
    pink: ['#ffffff', '#ff9ad8', '#ff2d95', '#6a0f3f'],
    gold: ['#fffbe0', '#ffd45a', '#e08a1e', '#5a2a08'],
    green: ['#f0ffe0', '#9dff7a', '#2fd04a', '#0d4a1a'],
    blue: ['#e8f4ff', '#7ac8ff', '#2f6dff', '#101a5a'],
    red: ['#fff0e0', '#ff7a5a', '#e0222a', '#4a0a0a'],
    white: ['#ffffff', '#eef0ff', '#a8b0d0', '#3a3f5a'],
    purple: ['#fbe8ff', '#d08aff', '#8a3aff', '#2a0a5a'],
  };
  const PAL_KEYS = Object.keys(PAL);
  const rockets = [], parts = [], smoke = [], queue = [];
  const flash = { v: 0, col: '#fff' };
  let auto = !!opts.auto, timer = 20, t = 0;
  const finaleEvery = (opts.finaleSeconds || 5) * 60; // 프레임 단위(60fps 기준)
  let finaleTimer = 0;
  // 쇼 진행: normal → dark(소등) → msg(글자) → normal 반복
  let phase = 'normal', phaseT = 0, dark = 0;
  const cars = [];
  for (let i = 0; i < 26; i++) cars.push({ x: rand(BX0, W), lane: i % 2, v: (i % 2 ? -1 : 1) * rand(0.25, 0.45) });

  const addP = (x, y, vx, vy, pal, life, o) => {
    o = o || {};
    parts.push({ x, y, vx, vy, pal, life, max: life, floor: o.floor || WATER, drag: o.drag || 0.965, g: o.g == null ? 0.018 : o.g, trail: !!o.trail, strobe: !!o.strobe });
  };

  function burst(r) {
    const { x, y } = r, S = rand(1.1, 1.7), A = PAL[r.a], B = PAL[r.b];
    if (r.pts) {
      for (const q of r.pts)
        parts.push({ x, y, sx: x, sy: y, tx: q.x, ty: q.y, k: 0, dur: rand(35, 50), vx: 0, vy: 0, pal: q.pal || PAL.pink,
          life: 330, max: 330, floor: H, drag: 1, g: 0, tgt: true });
      for (let i = 0; i < 6; i++) addP(x, y, rand(-0.3, 0.3), rand(-0.3, 0.3), PAL.white, 4, { g: 0 });
      flash.v = 1; flash.col = PAL.pink[2];
      return;
    }
    for (let i = 0; i < 6; i++) addP(x, y, rand(-0.3, 0.3), rand(-0.3, 0.3), PAL.white, 4, { g: 0 });
    switch (r.type) {
      case 'peony': {
        const n = 80;
        for (let i = 0; i < n; i++) {
          const ang = (i / n) * Math.PI * 2 + rand(-0.05, 0.05), inner = i % 3 === 0;
          const s = S * (inner ? rand(0.3, 0.5) : rand(0.85, 1));
          addP(x, y, Math.cos(ang) * s, Math.sin(ang) * s, inner ? A : B, rand(50, 80));
        }
        break;
      }
      case 'chrys': {
        for (let i = 0; i < 64; i++) {
          const ang = (i / 64) * Math.PI * 2, s = S * rand(0.9, 1.05);
          addP(x, y, Math.cos(ang) * s, Math.sin(ang) * s, B, rand(55, 75), { trail: true });
        }
        for (let i = 0; i < 24; i++) {
          const ang = rand(0, Math.PI * 2), s = S * rand(0.1, 0.4);
          addP(x, y, Math.cos(ang) * s, Math.sin(ang) * s, A, rand(40, 60));
        }
        break;
      }
      case 'ring': {
        const tilt = rand(0.35, 0.8), rot = rand(0, Math.PI);
        for (let i = 0; i < 48; i++) {
          const ang = (i / 48) * Math.PI * 2;
          let vx = Math.cos(ang) * S, vy = Math.sin(ang) * S * tilt;
          addP(x, y, vx * Math.cos(rot) - vy * Math.sin(rot), vx * Math.sin(rot) + vy * Math.cos(rot), A, rand(50, 65));
        }
        for (let i = 0; i < 10; i++) addP(x, y, rand(-0.3, 0.3), rand(-0.3, 0.3), B, rand(30, 50));
        break;
      }
      case 'willow': {
        for (let i = 0; i < 60; i++) {
          const ang = rand(0, Math.PI * 2), s = S * rand(0.6, 1);
          addP(x, y, Math.cos(ang) * s, Math.sin(ang) * s, PAL.gold, rand(110, 160), { drag: 0.975, g: 0.012, trail: true });
        }
        break;
      }
      case 'strobe': {
        for (let i = 0; i < 70; i++) {
          const ang = rand(0, Math.PI * 2), s = S * Math.sqrt(Math.random());
          addP(x, y, Math.cos(ang) * s, Math.sin(ang) * s, A, rand(60, 90), { strobe: true, g: 0.01 });
        }
        break;
      }
    }
    for (let i = 0; i < 5; i++)
      smoke.push({ x: x + rand(-14, 14), y: y + rand(-10, 10), r: rand(4, 9), a: rand(0.05, 0.09), col: B[3] });
    flash.v = 1; flash.col = B[2];
  }

  function launch(x, ty, type, a, b) {
    x = Math.max(62, Math.min(x == null ? rand(62, 310) : x, 314));
    ty = Math.max(12, Math.min(ty == null ? rand(22, 65) : ty, WATER - 25));
    // 강 위 (건너편 강변과 다리 사이)에서 발사
    const y0 = Math.round(rand(WATER + 2, Math.max(WATER + 3, bridgeY(Math.round(x)) - 3)));
    const dy = y0 - ty;
    rockets.push({
      x, y: y0, y0, vx: rand(-0.08, 0.08), vy: -Math.sqrt(2 * G * dy),
      type: type || pick(['peony', 'peony', 'chrys', 'ring', 'willow', 'strobe']),
      a: a || pick(PAL_KEYS), b: b || pick(PAL_KEYS),
    });
  }

  function finale() {
    for (let i = 0; i < 28; i++) queue.push({ at: t + i * rand(5, 9), x: rand(50, 310) });
  }

  // ---------- 업데이트 ----------
  function step(dt) {
    t += dt;
    if (auto) {
      timer -= dt;
      if (timer <= 0) {
        launch();
        if (Math.random() < 0.3) launch();
        timer = rand(25, 70);
      }
    }
    const rdt = dt / SPEED; // 실제 시간 기준 프레임
    phaseT += rdt / 60;
    if (phase === 'normal') {
      dark = Math.max(0, dark - rdt / 60);
      finaleTimer -= rdt; // 피날레 간격은 실제 시간 기준 유지
      if (finaleTimer <= 0) { finale(); finaleTimer = finaleEvery; }
      if (phaseT >= MESSAGE_AT) {
        phase = 'dark'; phaseT = 0;
        queue.length = 0; rockets.length = 0;
        for (const p of parts) p.life = Math.min(p.life, 15);
      }
    } else if (phase === 'dark') {
      dark = Math.min(1, dark + rdt / 30);
      if (phaseT >= 1) {
        phase = 'msg'; phaseT = 0;
        const pts = messagePoints(), N = 12;
        const minX = Math.min(...pts.map((q) => q.x)), maxX = Math.max(...pts.map((q) => q.x)) + 1;
        const bins = Array.from({ length: N }, () => []);
        for (const q of pts) bins[Math.min(N - 1, Math.floor(((q.x - minX) / (maxX - minX)) * N))].push(q);
        bins.forEach((b, i) => {
          const bx = minX + ((i + 0.5) * (maxX - minX)) / N;
          const y0 = Math.round(Math.max(WATER + 3, bridgeY(Math.round(Math.max(BX0, bx))) - 4));
          const ty = 42;
          rockets.push({ x: bx, y: y0 + i * 2.2, y0: y0 + i * 2.2, vx: 0, vy: -Math.sqrt(2 * G * (y0 + i * 2.2 - ty)), pts: b, a: 'pink', b: 'pink' });
        });
      }
    } else if (phase === 'msg') {
      dark = 1;
      if (phaseT > 2 && rockets.length === 0 && !parts.some((p) => p.tgt)) {
        phase = 'normal'; phaseT = 0; finaleTimer = 60;
      }
    }
    for (let i = queue.length - 1; i >= 0; i--) if (queue[i].at <= t) { launch(queue[i].x); queue.splice(i, 1); }

    for (let i = rockets.length - 1; i >= 0; i--) {
      const r = rockets[i];
      r.vy += G * dt; r.x += r.vx * dt; r.y += r.vy * dt;
      if (Math.random() < 0.8) addP(r.x + rand(-0.4, 0.4), r.y + 1, rand(-0.05, 0.05), rand(0, 0.15), PAL.gold, rand(8, 14), { g: 0.01, floor: r.y0 + 1 });
      if (r.vy >= -0.15) { burst(r); rockets.splice(i, 1); }
    }
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      if (p.tgt) {
        p.k = Math.min(1, p.k + dt / p.dur); p.life -= dt;
        const e = 1 - Math.pow(1 - p.k, 3);
        p.x = p.sx + (p.tx - p.sx) * e; p.y = p.sy + (p.ty - p.sy) * e;
        if (p.life < 60) { p.ty += 0.05 * dt; p.tx += Math.sin(p.ty) * 0.02; } // 끝날 때 살짝 흘러내림
        if (p.life <= 0) parts.splice(i, 1);
        continue;
      }
      const d = Math.pow(p.drag, dt);
      p.vx *= d; p.vy = p.vy * d + p.g * dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
      if (p.trail && Math.random() < 0.35 * dt) addP(p.x, p.y, 0, 0.05, p.pal, 12, { g: 0.005 });
      if (p.life <= 0 || p.y >= p.floor || p.x < -5 || p.x > W + 5) parts.splice(i, 1);
    }
    for (let i = smoke.length - 1; i >= 0; i--) {
      const s = smoke[i];
      s.x -= 0.06 * dt; s.y -= 0.01 * dt; s.r += 0.02 * dt; s.a -= 0.0004 * dt;
      if (s.a <= 0) smoke.splice(i, 1);
    }
    flash.v = Math.max(0, flash.v - 0.06 * dt);
    for (const c of cars) {
      c.x += c.v * dt;
      if (c.x > W) c.x = BX0; if (c.x < BX0) c.x = W - 1;
    }
    if (Math.random() < 0.05) { const tw = pick(twinkles); if (tw && !tw.blink) tw.on = !tw.on; }
  }

  // ---------- 렌더 ----------
  function render() {
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(skyC, 0, 0);
    if (flash.v > 0) {
      ctx.globalAlpha = flash.v * 0.07; ctx.fillStyle = flash.col; ctx.fillRect(0, 0, W, WATER); ctx.globalAlpha = 1;
    }
    for (const s of smoke) {
      ctx.globalAlpha = s.a; ctx.fillStyle = s.col;
      const R = Math.round(s.r), cx = Math.round(s.x), cy = Math.round(s.y);
      for (let dy = -R; dy <= R; dy++) {
        const w = Math.floor(Math.sqrt(R * R - dy * dy));
        ctx.fillRect(cx - w, cy + dy, w * 2 + 1, 1);
      }
    }
    ctx.globalAlpha = 1;
    if (dark > 0) { ctx.globalAlpha = dark * 0.5; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, WATER); ctx.globalAlpha = 1; }

    // 불꽃 레이어 (잔상)
    fx.globalCompositeOperation = 'destination-out';
    fx.fillStyle = 'rgba(0,0,0,0.3)'; fx.fillRect(0, 0, W, H);
    fx.globalCompositeOperation = 'source-over';
    for (const p of parts) {
      const k = p.life / p.max;
      if (p.tgt) {
        let col;
        if (p.k < 1) col = p.pal[0];
        else if (p.life > 60) col = Math.random() < 0.12 ? '#ffffff' : Math.random() < 0.5 ? p.pal[1] : p.pal[2];
        else { if (Math.random() < 0.4) continue; col = p.life > 30 ? p.pal[2] : p.pal[3]; }
        px(fx, Math.round(p.x), Math.round(p.y), col);
        continue;
      }
      if (k < 0.15 && Math.random() < 0.5) continue;
      if (p.strobe && k < 0.6 && Math.random() < 0.6) continue;
      const col = p.strobe && k < 0.6 ? p.pal[0] : k > 0.85 ? p.pal[0] : k > 0.5 ? p.pal[1] : k > 0.22 ? p.pal[2] : p.pal[3];
      px(fx, Math.round(p.x), Math.round(p.y), col);
    }
    for (const r of rockets) px(fx, Math.round(r.x), Math.round(r.y), '#fff8e0');

    ctx.globalAlpha = 1 - dark; ctx.drawImage(cityC, 0, 0);
    for (const tw of twinkles) {
      const on = tw.blink ? Math.floor(t / 40) % 2 === 0 : tw.on;
      px(ctx, tw.x, tw.y, on ? tw.col : '#05060d');
    }
    ctx.globalAlpha = dark; ctx.drawImage(cityDarkC, 0, 0); ctx.globalAlpha = 1;

    // 불꽃은 건너편 스카이라인 앞에 그림
    ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(fxC, 0, 0, W, WATER, 0, 0, W, WATER);
    ctx.globalCompositeOperation = 'source-over';

    // 강물 + 반사
    ctx.fillStyle = '#03050c'; ctx.fillRect(0, WATER, W, H - WATER);
    const depth = H - WATER;
    for (let y = WATER; y < H; y++) {
      const d = y - WATER, src = WATER - 1 - Math.floor(d * 0.95);
      if (src < 0) break;
      const off = Math.round(Math.sin(t * 0.06 + y * 0.8) * (0.6 + d * 0.04));
      ctx.globalAlpha = 0.55 * (1 - (d / depth) * 0.75);
      ctx.drawImage(canvas, 0, src, W, 1, off, y, W, 1);
    }
    ctx.globalAlpha = 1;
    for (let i = 0; i < 25; i++) px(ctx, rand(0, W), rand(WATER + 2, H), '#111a2e');

    // 수면 위 발사 지점의 로켓 (다리 뒤)
    ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(fxC, 0, WATER, W, H - WATER, 0, WATER, W, H - WATER);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1 - dark; ctx.drawImage(nearC, 0, 0);
    for (const c of cars) {
      const x = Math.round(c.x), y = bridgeY(x) + c.lane;
      if (c.lane) { px(ctx, x, y, '#ff3a3a'); px(ctx, x + 1, y, '#8a1a1a'); }   // 후미등
      else { px(ctx, x, y, '#ffffff'); px(ctx, x - 1, y, '#fff0b0'); px(ctx, x + 1, y, '#8a8060'); } // 전조등
    }
    const on = Math.floor(t / 45) % 2 === 0;
    px(ctx, 20, 49, on ? '#ff2a2a' : '#3a0808');
    px(ctx, 52, 49, on ? '#ff2a2a' : '#3a0808');
    ctx.globalAlpha = dark; ctx.drawImage(nearDarkC, 0, 0); ctx.globalAlpha = 1;
  }

  // ---------- 루프 / 입력 ----------
  let last = performance.now(), raf = 0;
  const frame = (now) => {
    const dt = Math.min((now - last) / 16.667, 3); last = now;
    step(dt * SPEED); render();
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);

  const onDown = (e) => {
    const rc = canvas.getBoundingClientRect();
    // object-fit: cover 로 잘린 영역을 감안해 좌표 변환
    const sc = Math.max(rc.width / W, rc.height / H);
    const x = (e.clientX - rc.left - (rc.width - W * sc) / 2) / sc;
    const y = (e.clientY - rc.top - (rc.height - H * sc) / 2) / sc;
    launch(x, y < WATER - 20 ? y : undefined);
  };
  canvas.addEventListener('pointerdown', onDown);

  return {
    launch, finale,
    setAuto: (v) => { auto = !!v; },
    destroy: () => { cancelAnimationFrame(raf); canvas.removeEventListener('pointerdown', onDown); },
  };
}

function PixelFireworks({ finaleSeconds = 5, speed = 0.75, message = '사랑해', heart = true, messageAt = 10 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const fw = createPixelFireworks(canvasRef.current, { finaleSeconds, speed, message, heart, messageAt });
    return () => fw.destroy();
  }, [finaleSeconds, speed, message, heart, messageAt]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '100%', objectFit: 'cover', imageRendering: 'pixelated', display: 'block', background: '#000', cursor: 'crosshair' }}
    />
  );
}

export default function FireworksPage() {
  return (
    <div style={{ position: 'fixed', inset: 0, width: '100vw', height: '100dvh', background: '#000', overflow: 'hidden' }}>
      <PixelFireworks />
    </div>
  );
}
