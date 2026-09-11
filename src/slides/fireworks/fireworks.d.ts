export interface FireworksOptions { loop?: boolean; autoplay?: boolean; density?: number; speed?: number; onComplete?: () => void; }
export interface FireworksEngine {
  canvas: HTMLCanvasElement; duration: number; readonly speed: number; readonly time: number; readonly playing: boolean;
  setSpeed(speed: number): void; play(): void; pause(): void; restart(): void; seek(seconds: number): void; dispose(): void;
}
export function createFireworks(container: HTMLElement, options?: FireworksOptions): FireworksEngine;
