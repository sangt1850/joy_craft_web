import type { ComponentType as FC } from "react";

// componentRef -> React 컴포넌트 매핑
// 슬라이드 컴포넌트가 구현되면 여기에 등록한다
const registry: Record<string, FC> = {};

export function registerSlide(componentRef: string, component: FC): void {
  registry[componentRef] = component;
}

export function resolveSlide(componentRef: string): FC | undefined {
  return registry[componentRef];
}
