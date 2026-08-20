// 스키마 필드 1개 → 편집 위젯 1개.
// SchemaFieldDef.type을 보고 위젯을 고른다. 배열(type: "array")은 ArrayFieldEditor가 맡는다.
//
// 기존 컴포넌트 재사용 원칙:
//   color   → ColorPicker
//   boolean → ToggleSwitch
//   text    → neo-input
import { useRef, useState } from "react";
import type { SchemaFieldDef } from "../../../slides/SlideProps";
import ColorPicker from "../../ui/ColorPicker";
import ToggleSwitch from "../../ui/ToggleSwitch";
import { cn } from "../../../utils/cn";
import { commitNumberInput, resolveArrayItemNumberBlur } from "./numberField";

const LABEL_CLASS = "font-sub text-[12px] text-ink block mb-1.5";
const HINT_CLASS = "font-body text-[10px] text-black/50 leading-snug mt-1";

/** 색상 필드 프리셋 — 브랜드 팔레트 7색. 현재 값/스키마 기본값은 앞에 자동으로 덧붙는다 */
const PALETTE = ["#ffc93c", "#ff57a6", "#7fe0bb", "#9fd3f5", "#ffb784", "#fff7e6", "#111111"];

/** font 필드 선택지 — docs/DESIGN_SYSTEM.md의 4종 */
const FONT_OPTIONS: { label: string; value: string }[] = [
  { label: "헤드라인", value: "var(--font-headline)" },
  { label: "서브", value: "var(--font-sub)" },
  { label: "본문", value: "var(--font-body)" },
  { label: "픽셀", value: "var(--font-pixel)" },
];

const HEX6 = /^#[0-9a-f]{6}$/i;
const HEX3 = /^#[0-9a-f]{3}$/i;

/** <input type="color">는 #rrggbb만 받는다. 아니면 표시용 대체값을 준다 */
function toColorInputValue(v: string): string {
  if (HEX6.test(v)) return v.toLowerCase();
  if (HEX3.test(v)) return ("#" + v.slice(1).split("").map((c) => c + c).join("")).toLowerCase();
  return "#111111";
}

export interface FieldWidgetProps {
  field: SchemaFieldDef;
  value: unknown;
  onChange: (value: unknown) => void;
  /** 배열 항목 내부처럼 좁은 폭에서 쓸 때 */
  compact?: boolean;
  /**
   * 배열 항목(ArrayFieldEditor) 안에서 쓰는가.
   * 항목 안에서는 값을 비우면 키가 삭제돼 슬라이드 계산이 NaN이 되므로
   * number 위젯이 빈 값을 커밋하지 않는다. (numberField.ts 참고)
   */
  inArrayItem?: boolean;
}

export default function FieldWidget({
  field,
  value,
  onChange,
  compact = false,
  inArrayItem = false,
}: FieldWidgetProps) {
  // boolean은 ToggleSwitch가 라벨을 직접 그린다
  if (field.type === "boolean") {
    return (
      <div>
        <ToggleSwitch
          label={field.label}
          checked={Boolean(value ?? field.default)}
          onChange={onChange}
        />
        {field.hint && <p className={HINT_CLASS}>{field.hint}</p>}
      </div>
    );
  }

  return (
    <div>
      <label className={LABEL_CLASS}>
        {field.label}
        {field.required && <span className="text-pink"> *</span>}
      </label>
      <FieldControl
        field={field}
        value={value}
        onChange={onChange}
        compact={compact}
        inArrayItem={inArrayItem}
      />
      {field.hint && <p className={HINT_CLASS}>{field.hint}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
function FieldControl({ field, value, onChange, compact, inArrayItem }: FieldWidgetProps) {
  // text 위젯이 편집 중 input↔textarea로 바뀌면 포커스가 날아간다.
  // 그래서 "현재 값에 개행이 있는가"로 매번 판정하지 않고, 한 번 여러 줄로 판정되면 유지한다.
  // (값이 나중에 도착하는 경우를 위해 승격만 허용하고 강등은 하지 않는다)
  const multilineRef = useRef(field.type === "textarea");
  if (!multilineRef.current && asText(value).includes("\n")) multilineRef.current = true;

  switch (field.type) {
    case "color":
      return <ColorControl field={field} value={value} onChange={onChange} />;

    case "number":
      return (
        <NumberControl
          field={field}
          value={value}
          onChange={onChange}
          inArrayItem={inArrayItem}
        />
      );

    case "select":
      return <SelectControl options={field.options ?? []} value={value} onChange={onChange} />;

    case "font":
      return <SelectControl options={FONT_OPTIONS} value={value} onChange={onChange} />;

    case "image":
      return <ImageControl field={field} value={value} onChange={onChange} />;

    case "textlist":
      return <TextListControl field={field} value={value} onChange={onChange} compact={compact} />;

    case "imagelist":
      return <ImageListControl value={value} onChange={onChange} />;

    case "textarea":
      return (
        <textarea
          value={asText(value)}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          rows={compact ? 2 : 3}
          className="neo-input resize-y leading-snug"
        />
      );

    default: {
      // text — 값에 줄바꿈이 있으면 <input>이 이를 지워버려 데이터가 조용히 깨진다.
      // (예: cassette-player의 note 기본값에 \n이 들어 있다) → 그럴 때는 textarea로 그린다.
      // 판정은 multilineRef가 맡는다(= 편집 중에 엘리먼트 종류가 바뀌지 않는다).
      const text = asText(value);
      if (multilineRef.current) {
        return (
          <textarea
            value={text}
            placeholder={field.placeholder}
            onChange={(e) => onChange(e.target.value)}
            rows={compact ? 2 : 3}
            className="neo-input resize-y leading-snug"
          />
        );
      }
      return (
        <input
          value={text}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="neo-input"
        />
      );
    }
  }
}

function asText(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  return String(v);
}

// ─────────────────────────────────────────────────────────────────────────────
// color — 팔레트 스와치(ColorPicker) + 임의 색상(네이티브 피커)
// ─────────────────────────────────────────────────────────────────────────────
function ColorControl({ field, value, onChange }: Omit<FieldWidgetProps, "compact">) {
  // NumberControl과 같은 로컬 버퍼 패턴.
  // (기존 버그: 값이 빈 문자열이면 입력창이 기본값을 표시해 놓고, 거기서 이어 타이핑하면
  //  "#FFF8F0#ff0000" 같은 값이 저장됐다 — 입력창은 항상 **저장값 그대로**를 보여야 한다)
  const canonical = asText(value);

  const [text, setText] = useState(canonical);
  const sentRef = useRef(canonical);
  const prevRef = useRef(canonical);
  if (canonical !== prevRef.current) {
    prevRef.current = canonical;
    if (canonical !== sentRef.current) setText(canonical);
  }

  const emit = (v: string) => {
    setText(v);
    sentRef.current = v;
    onChange(v);
  };

  // 스와치/네이티브 피커가 보여줄 색 — 값이 비었을 때만 기본값으로 대신한다
  const effective = text.trim() === "" ? asText(field.default) : text;
  const swatches = Array.from(
    new Set([effective, asText(field.default), ...PALETTE].filter((c) => c !== ""))
  );

  return (
    <div className="flex flex-col gap-2">
      <ColorPicker colors={swatches} value={effective} onChange={emit} swatchSize={24} />
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={toColorInputValue(effective)}
          onChange={(e) => emit(e.target.value)}
          aria-label={`${field.label} 직접 선택`}
          className="w-9 h-8 neo-border bg-transparent p-0 cursor-pointer shrink-0"
        />
        <input
          value={text}
          onChange={(e) => emit(e.target.value)}
          aria-label={`${field.label} 색상 코드`}
          className="neo-input font-pixel text-[10px]"
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// number — 입력 중간 상태("2.", "")를 위해 로컬 버퍼를 둔다
// ─────────────────────────────────────────────────────────────────────────────
function NumberControl({
  field,
  value,
  onChange,
  inArrayItem = false,
}: Omit<FieldWidgetProps, "compact">) {
  const canonical = value === null || value === undefined || value === "" ? "" : String(value);

  const [text, setText] = useState(canonical);
  // 우리가 방금 내보낸 값이면 되돌려 받아도 로컬 버퍼를 건드리지 않는다.
  // 그래야 "2." 같은 입력 중간 상태가 지워지지 않는다.
  const sentRef = useRef(canonical);
  const prevRef = useRef(canonical);
  if (canonical !== prevRef.current) {
    prevRef.current = canonical;
    if (canonical !== sentRef.current) setText(canonical);
  }

  const handle = (raw: string) => {
    setText(raw);
    // 배열 항목 안에서는 빈 값을 커밋하지 않는다 (키가 지워져 슬라이드가 NaN이 된다)
    const commit = commitNumberInput(raw, inArrayItem);
    if (!commit.emit) return;
    sentRef.current = commit.value === undefined ? "" : String(commit.value);
    onChange(commit.value);
  };

  // 배열 항목: 비운 채 포커스를 잃으면 저장값(없으면 스키마 기본값)으로 되돌린다
  const handleBlur = () => {
    if (!inArrayItem) return;
    const { text: next, commit } = resolveArrayItemNumberBlur(text, value, field);
    setText(next);
    if (commit !== null) {
      sentRef.current = String(commit);
      onChange(commit);
    }
  };

  return (
    <input
      type="number"
      value={text}
      min={field.min}
      max={field.max}
      step={field.step}
      placeholder={field.placeholder}
      onChange={(e) => handle(e.target.value)}
      onBlur={handleBlur}
      className="neo-input"
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// select / font
// ─────────────────────────────────────────────────────────────────────────────
function SelectControl({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: string }[];
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const current = asText(value);
  // 저장된 값이 선택지에 없으면 잃어버리지 않도록 선택지에 끼워 넣는다
  const list =
    current !== "" && !options.some((o) => o.value === current)
      ? [{ label: current, value: current }, ...options]
      : options;

  return (
    <select value={current} onChange={(e) => onChange(e.target.value)} className="neo-input cursor-pointer">
      {current === "" && <option value="">선택하세요</option>}
      {list.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// image — 베타 범위: 업로드 없이 URL 직접 입력 (백엔드 asset 컨트롤러 부재)
// ─────────────────────────────────────────────────────────────────────────────
function ImageControl({ field, value, onChange }: Omit<FieldWidgetProps, "compact">) {
  const url = asText(value);
  return (
    <div className="flex flex-col gap-2">
      <input
        value={url}
        placeholder={field.placeholder ?? "https://... 이미지 주소를 붙여넣으세요"}
        onChange={(e) => onChange(e.target.value === "" ? null : e.target.value)}
        className="neo-input"
      />
      {url !== "" && (
        <img
          src={url}
          alt=""
          className="w-full h-[90px] object-cover neo-border bg-black/5"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// imagelist — URL 입력 + 파일 업로드(→ base64). 값은 string[].
// DB 저장 전략:
//   · URL 입력  → 그대로 URL 문자열 저장 (권장: Supabase Storage / Cloudinary 등 CDN)
//   · 파일 업로드 → FileReader로 base64 data URL 변환 후 저장 (소용량 데모에 적합)
//   · 프로덕션에서는 /api/assets 업로드 엔드포인트로 CDN URL을 받아 저장하는 방식 권장
// ─────────────────────────────────────────────────────────────────────────────
function ImageListControl({
  value,
  onChange,
}: {
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const [urlInput, setUrlInput] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const list: string[] = Array.isArray(value)
    ? (value as unknown[]).filter((v) => typeof v === "string") as string[]
    : [];

  const add = (urls: string[]) => {
    const trimmed = urls.map((u) => u.trim()).filter(Boolean);
    if (!trimmed.length) return;
    onChange([...list, ...trimmed]);
  };

  const remove = (i: number) => onChange(list.filter((_, idx) => idx !== i));

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") add([reader.result]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  return (
    <div className="flex flex-col gap-2">
      {list.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {list.map((url, i) => (
            <div key={i} className="relative shrink-0">
              <img
                src={url}
                alt=""
                className="w-14 h-14 object-cover neo-border bg-black/10"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = "0.3"; }}
              />
              <button
                onClick={() => remove(i)}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-ink text-cream rounded-full flex items-center justify-center font-pixel text-[9px] leading-none"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { add([urlInput]); setUrlInput(""); }
          }}
          placeholder="이미지 URL 입력 후 Enter"
          className="neo-input flex-1 text-[12px]"
        />
        <button
          onClick={() => fileRef.current?.click()}
          className="neo-border px-2.5 py-1 font-sub text-[11px] shrink-0 bg-cream hover:bg-mustard/20"
        >
          파일
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          onChange={onFile}
          className="hidden"
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// textlist — string[]을 줄 단위로 편집.
// split("\n") ↔ join("\n")은 완전한 항등 변환이라 커서가 튀지 않는다.
// ─────────────────────────────────────────────────────────────────────────────
function TextListControl({ field, value, onChange, compact }: FieldWidgetProps) {
  const list = Array.isArray(value)
    ? value.map((v) => (typeof v === "string" ? v : String(v ?? "")))
    : asText(value) === ""
      ? []
      : [asText(value)];

  return (
    <textarea
      value={list.join("\n")}
      placeholder={field.placeholder}
      onChange={(e) => onChange(e.target.value === "" ? [] : e.target.value.split("\n"))}
      rows={compact ? 4 : 5}
      className={cn("neo-input resize-y leading-snug")}
    />
  );
}
