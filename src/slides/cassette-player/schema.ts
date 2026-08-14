import type { SlideSchema } from "../SlideProps";

const DEFAULT_TRACKS = JSON.stringify([
  { title: "Our Song", artist: "너와 나의 플레이리스트", dur: 42, root: 261.63, scale: [0, 2, 4, 7, 9], tempo: 300 },
  { title: "첫 데이트", artist: "JoyCraft Mixtape", dur: 38, root: 293.66, scale: [0, 3, 5, 7, 10], tempo: 340 },
  { title: "늦은 밤 드라이브", artist: "JoyCraft Mixtape", dur: 46, root: 220.0, scale: [0, 2, 3, 7, 8], tempo: 380 },
]);

export const schema: SlideSchema = {
  fields: [
    { key: "tracks", label: "트랙 목록 (JSON)", type: "textarea", default: DEFAULT_TRACKS },
    { key: "note", label: "하단 안내", type: "text", default: "실제 재생되는 로파이 멜로디예요 🎧\n(브라우저 사운드로 생성)" },
    { key: "tapeColor", label: "테이프 색상", type: "color", default: "#f0e6d0" },
    { key: "backgroundColor", label: "배경 색상", type: "color", default: "#3a2e2a" },
  ],
};

export const defaultValues: Record<string, unknown> = Object.fromEntries(
  schema.fields.map((f) => [f.key, f.default])
);
