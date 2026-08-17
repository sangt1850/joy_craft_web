import type { SlideSchema } from "../SlideProps";

const DEFAULT_TRACKS = JSON.stringify([
  { title: "Our Song", artist: "너와 나의 플레이리스트", dur: 42, root: 261.63, scale: [0, 2, 4, 7, 9], tempo: 300 },
  { title: "첫 데이트", artist: "JoyCraft Mixtape", dur: 38, root: 293.66, scale: [0, 3, 5, 7, 10], tempo: 340 },
  { title: "늦은 밤 드라이브", artist: "JoyCraft Mixtape", dur: 46, root: 220.0, scale: [0, 2, 3, 7, 8], tempo: 380 },
]);

export const schema: SlideSchema = {
  fields: [
    {
      key: "tracks",
      label: "트랙 목록",
      type: "array",
      itemLabel: "트랙",
      default: DEFAULT_TRACKS,
      // root / scale / tempo는 멜로디 생성용 음악 파라미터라 편집 UI에 노출하지 않는다.
      // 기존 트랙의 값은 그대로 보존되고, 새 트랙에는 아래 기본 골격이 깔린다.
      itemDefaults: { root: 261.63, scale: [0, 2, 4, 7, 9], tempo: 300 },
      itemFields: [
        { key: "title", label: "곡 제목", type: "text", default: "새 트랙", required: true },
        { key: "artist", label: "아티스트", type: "text", default: "JoyCraft Mixtape" },
        { key: "dur", label: "길이 (초)", type: "number", default: 40, min: 5, max: 600, step: 1 },
      ],
    },
    { key: "note", label: "하단 안내", type: "text", default: "실제 재생되는 로파이 멜로디예요 🎧\n(브라우저 사운드로 생성)" },
    { key: "tapeColor", label: "테이프 색상", type: "color", default: "#f0e6d0" },
    { key: "backgroundColor", label: "배경 색상", type: "color", default: "#3a2e2a" },
  ],
};

export const defaultValues: Record<string, unknown> = Object.fromEntries(
  schema.fields.map((f) => [f.key, f.default])
);
