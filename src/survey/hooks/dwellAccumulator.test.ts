import { describe, expect, it } from 'vitest';
import { DwellAccumulator } from './dwellAccumulator';

function setup() {
  let t = 1000;
  const acc = new DwellAccumulator(() => t);
  return { acc, advance: (ms: number) => { t += ms; } };
}

describe('DwellAccumulator', () => {
  it('보이는 동안만 활성 시간으로 센다', () => {
    const { acc, advance } = setup();
    acc.start(true);
    advance(3000);
    expect(acc.read()).toBe(3000);
  });

  it('탭이 숨겨진 구간은 빼고 hidden 횟수를 센다', () => {
    const { acc, advance } = setup();
    acc.start(true);
    advance(2000);
    acc.onVisibilityChange(false); // 숨김
    advance(10_000); // 다른 탭에 있던 시간
    acc.onVisibilityChange(true); // 복귀
    advance(1000);
    expect(acc.read()).toBe(3000);
    expect(acc.hidden).toBe(1);
  });

  it('숨겨진 채 시작하면 보이기 전까지 세지 않는다', () => {
    const { acc, advance } = setup();
    acc.start(false);
    advance(5000);
    expect(acc.read()).toBe(0);
    acc.onVisibilityChange(true);
    advance(1500);
    expect(acc.read()).toBe(1500);
  });

  it('blur는 시간에 영향 없이 횟수만 센다', () => {
    const { acc, advance } = setup();
    acc.start(true);
    acc.onBlur();
    acc.onBlur();
    advance(1000);
    expect(acc.blur).toBe(2);
    expect(acc.read()).toBe(1000);
  });

  it('stop 이후에는 시간이 더 쌓이지 않고 누적값은 유지된다', () => {
    const { acc, advance } = setup();
    acc.start(true);
    advance(2000);
    acc.stop();
    advance(9000);
    expect(acc.read()).toBe(2000);
  });

  it('숨김이 연속으로 와도 이중으로 빼지 않는다', () => {
    const { acc, advance } = setup();
    acc.start(true);
    advance(1000);
    acc.onVisibilityChange(false);
    acc.onVisibilityChange(false);
    advance(4000);
    acc.onVisibilityChange(true);
    acc.onVisibilityChange(true); // 이미 보이는 중이면 기준점을 다시 잡지 않는다
    advance(500);
    expect(acc.read()).toBe(1500);
    expect(acc.hidden).toBe(2);
  });
});
