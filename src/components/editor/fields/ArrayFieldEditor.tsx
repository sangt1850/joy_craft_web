// 범용 배열 필드 에디터 — 8종(quiz/roulette/story-book/ending-credits/
// balloon-pop/cassette-player/flashlight/rolling-paper)이 공유한다.
//
// 저장 형태는 JSON 문자열(= V7 시드와 동일). 자세한 근거는 slides/arrayFieldValue.ts 참고.
// 편집 UI에 노출하지 않는 키(예: cassette 트랙의 scale)는 항목에 그대로 보존된다.
//
// JSON이 깨져 있어도 에디터가 죽으면 안 되므로 raw(원본 텍스트) 편집 폴백을 제공한다.
import { useRef, useState } from "react";
import type { SchemaFieldDef } from "../../../slides/SlideProps";
import {
  parseArrayValue,
  serializeArrayValue,
  makeArrayItem,
  setItemValue,
  moveArrayItem,
  summarizeItem,
} from "../../../slides/arrayFieldValue";
import FieldWidget from "./FieldWidget";
import NeoCard from "../../ui/NeoCard";
import NeoButton from "../../ui/NeoButton";
import DashedButton from "../../ui/DashedButton";
import StatusBadge from "../../ui/StatusBadge";

const LABEL_CLASS = "font-sub text-[12px] text-ink block";
const HINT_CLASS = "font-body text-[10px] text-black/50 leading-snug";

interface ArrayFieldEditorProps {
  field: SchemaFieldDef;
  value: unknown;
  onChange: (value: unknown) => void;
  /**
   * "기본값으로 되돌리기"가 쓸 값.
   * 이 슬라이드 템플릿의 `defaultValues[field.key]`(= 서버 정본)를 넘긴다.
   * 없으면 로컬 스키마의 `field.default`로 떨어진다.
   */
  resetValue?: unknown;
}

export default function ArrayFieldEditor({
  field,
  value,
  onChange,
  resetValue,
}: ArrayFieldEditorProps) {
  const [textMode, setTextMode] = useState(false);
  const [localText, setLocalText] = useState('');

  const parsed = parseArrayValue(value);
  const itemFields = field.itemFields ?? [];
  const itemLabel = field.itemLabel ?? "항목";

  // 구조화 편집이 불가능한 조건: 값이 깨졌거나, 항목 필드 정의가 없는 경우
  const useRaw = !parsed.ok || itemFields.length === 0;

  // role + name 키가 모두 있을 때만 텍스트 모드 지원
  const supportsTextMode = !useRaw
    && itemFields.some(f => f.key === 'role')
    && itemFields.some(f => f.key === 'name');

  function itemsToText(items: ArrayItem[]): string {
    return items.map(item => {
      const role = String(item.role ?? '');
      const name = String(item.name ?? '');
      return role ? `${role}|${name}` : name;
    }).join('\n');
  }

  function textToItems(text: string): ArrayItem[] {
    return text.split('\n').filter(line => line.trim()).map(line => {
      const idx = line.indexOf('|');
      return idx < 0
        ? { role: '', name: line.trim() }
        : { role: line.slice(0, idx).trim(), name: line.slice(idx + 1).trim() };
    });
  }

  function handleEnterTextMode() {
    setLocalText(itemsToText(parsed.items));
    setTextMode(true);
  }

  function handleTextChange(text: string) {
    setLocalText(text);
    commit(textToItems(text));
  }

  const commit = (items: Record<string, unknown>[]) => onChange(serializeArrayValue(items));

  // 항상 최신 parsed.items 를 참조하기 위한 ref (oEmbed 비동기 콜백에서 사용)
  const parsedRef = useRef(parsed);
  parsedRef.current = parsed;

  // itemFields 안에 'title' 키가 있으면 youtubeUrl 변경 시 자동 채우기 활성화
  const hasTitleField = itemFields.some((f) => f.key === "title");

  function handleItemFieldChange(idx: number, fieldKey: string, v: unknown) {
    const newItems = parsed.items.map((it, i) =>
      i === idx ? setItemValue(it, fieldKey, v) : it
    );
    commit(newItems);

    if (fieldKey === "youtubeUrl" && hasTitleField && typeof v === "string") {
      const vid = extractYouTubeVideoId(v);
      if (vid) {
        fetch(
          `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${vid}&format=json`
        )
          .then((r) => r.json())
          .then((d: { title?: string }) => {
            if (d.title) {
              const latest = parsedRef.current;
              if (latest.ok) {
                commit(
                  latest.items.map((it, i) =>
                    i === idx ? setItemValue(it, "title", d.title!) : it
                  )
                );
              }
            }
          })
          .catch(() => {});
      }
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className={LABEL_CLASS}>
          {field.label}
          {field.required && <span className="text-primary"> *</span>}
        </span>
        {supportsTextMode && (
          <button
            type="button"
            onClick={() => textMode ? setTextMode(false) : handleEnterTextMode()}
            className="font-body text-[11px] text-ink border border-black/40 rounded px-2 py-0.5 shrink-0 cursor-pointer bg-white hover:bg-black/10"
          >
            {textMode ? '목록으로' : '텍스트로'}
          </button>
        )}
      </div>

      {field.hint && <p className={HINT_CLASS}>{field.hint}</p>}

      {!useRaw && textMode ? (
        <div className="flex flex-col gap-2">
          <p className={HINT_CLASS}>한 줄에 하나씩 · 역할|이름 (역할 생략 시 이름만)</p>
          <textarea
            value={localText}
            onChange={(e) => handleTextChange(e.target.value)}
            rows={10}
            spellCheck={false}
            placeholder={"주연|너 그리고 나\n감독|운명\n각본|매일의 대화"}
            className="neo-input font-body text-[12px] resize-y leading-relaxed"
          />
        </div>
      ) : useRaw ? (
        <RawEditor
          value={typeof value === "string" ? value : parsed.raw}
          broken={!parsed.ok}
          onChange={onChange}
          // 로컬 스키마 기본값이 아니라 이 템플릿의 정본(defaultValues)으로 되돌린다
          onReset={() => onChange(resetValue !== undefined ? resetValue : field.default)}
        />
      ) : (
        <>
          {parsed.items.map((item, idx) => (
            <NeoCard key={idx} bg="var(--color-bg)" pad={10} shadow={3} border={2}>
              <div className="flex items-center gap-1.5 mb-2">
                <StatusBadge variant="default">
                  {itemLabel} {idx + 1}
                </StatusBadge>
                <span className="font-body text-[10px] text-black/50 truncate flex-1">
                  {summarizeItem(item, itemFields)}
                </span>
              </div>

              <div className="flex flex-col gap-2.5">
                {itemFields.map((f) => (
                  <FieldWidget
                    key={f.key}
                    field={f}
                    value={item[f.key]}
                    compact
                    inArrayItem
                    onChange={(v) => handleItemFieldChange(idx, f.key, v)}
                  />
                ))}
              </div>

              <div className="flex gap-1.5 mt-2.5">
                <NeoButton
                  bg="var(--color-bg)"
                  size="sm"
                  shadow={2}
                  disabled={idx === 0}
                  onClick={() => commit(moveArrayItem(parsed.items, idx, idx - 1))}
                >
                  ↑
                </NeoButton>
                <NeoButton
                  bg="var(--color-bg)"
                  size="sm"
                  shadow={2}
                  disabled={idx === parsed.items.length - 1}
                  onClick={() => commit(moveArrayItem(parsed.items, idx, idx + 1))}
                >
                  ↓
                </NeoButton>
                <NeoButton
                  bg="var(--color-surface)"
                  size="sm"
                  shadow={2}
                  onClick={() => commit(parsed.items.filter((_, i) => i !== idx))}
                >
                  삭제
                </NeoButton>
              </div>
            </NeoCard>
          ))}

          {parsed.items.length === 0 && (
            <p className={HINT_CLASS}>아직 {itemLabel}이(가) 없습니다.</p>
          )}

          <DashedButton onClick={() => commit([...parsed.items, makeArrayItem(field)])}>
            {itemLabel} 추가
          </DashedButton>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 유틸 — YouTube 동영상 ID 추출
// ─────────────────────────────────────────────────────────────────────────────
function extractYouTubeVideoId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1).split("?")[0];
    if (u.pathname.startsWith("/shorts/")) return u.pathname.split("/")[2];
    if (u.pathname.startsWith("/embed/")) return u.pathname.split("/")[2];
    return u.searchParams.get("v");
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 폴백 — 원본 텍스트 편집
// ─────────────────────────────────────────────────────────────────────────────
function RawEditor({
  value,
  broken,
  onChange,
  onReset,
}: {
  value: string;
  broken: boolean;
  onChange: (v: unknown) => void;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {broken && (
        <NeoCard bg="var(--color-surface)" pad={10} shadow={3} border={2}>
          <p className="font-body text-[11px] leading-snug">
            목록 형식이 아니어서 목록 편집기를 열 수 없습니다. 아래에서 직접 고치거나 기본값으로
            되돌려 주세요.
          </p>
        </NeoCard>
      )}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={8}
        spellCheck={false}
        className="neo-input font-pixel text-[10px] resize-y leading-snug"
      />
      <NeoButton bg="var(--color-secondary)" size="sm" shadow={3} block onClick={onReset}>
        기본값으로 되돌리기
      </NeoButton>
    </div>
  );
}
