import type { SlideSchema } from "../SlideProps";

export const schema: SlideSchema = {
  fields: [
    { key: "clearText", label: "완성 메시지", type: "textarea", default: "우리 처음 만난 날\n기억나?" },
    { key: "puzzleImage", label: "퍼즐 이미지 URL", type: "image", default: null },
    { key: "gridSize", label: "격자 크기", type: "number", default: 3, min: 2, max: 4, step: 1 },
  ],
};

export const defaultValues: Record<string, unknown> = Object.fromEntries(
  schema.fields.map((f) => [f.key, f.default])
);
