// 슬라이드 썸네일 동시 활성 수를 모듈 레벨에서 추적한다.
// 2D: 한 화면에 동시 6개까지, 3D(Three.js WebGL): 동시 1개까지 제한.
let active2DCount = 0;
let active3DCount = 0;

const MAX_2D = 20;

export function can2DActivate(): boolean {
  return active2DCount < MAX_2D;
}

export function register2D(): void {
  active2DCount++;
}

export function unregister2D(): void {
  active2DCount = Math.max(0, active2DCount - 1);
}

export function can3DActivate(): boolean {
  return active3DCount < 1;
}

export function register3D(): void {
  active3DCount++;
}

export function unregister3D(): void {
  active3DCount = Math.max(0, active3DCount - 1);
}
