import { useEffect, useState } from 'react';
import type { AdminClient } from '../../api/adminClient';
import type { GiftConfigData } from '../../api/adminTypes';
import type { GiftContent } from '../../api/types';

interface Props {
  client: AdminClient;
}

const FIELDS: { key: keyof GiftContent; label: string; max: number; multiline?: boolean }[] = [
  { key: 'icon', label: '아이콘', max: 8 },
  { key: 'eyebrow', label: '작은 제목', max: 60 },
  { key: 'headline', label: '제목', max: 60 },
  { key: 'description', label: '안내 문구', max: 300, multiline: true },
  { key: 'purpose', label: '수집·이용 목적', max: 60 },
  { key: 'endNotice', label: '종료 화면 발송 안내', max: 60 },
];

export function GiftConfigPanel({ client }: Props) {
  const [config, setConfig] = useState<GiftConfigData | null>(null);
  const [enabled, setEnabled] = useState(true);
  const [content, setContent] = useState<GiftContent | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const apply = (data: GiftConfigData) => {
    setConfig(data);
    setEnabled(data.enabled);
    setContent(data.content);
  };

  useEffect(() => {
    client
      .giftConfig()
      .then(apply)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : '불러오기 실패'));
  }, [client]);

  if (error && !config) return <div className="admin-error"><p>{error}</p></div>;
  if (!config || !content) return <div className="admin-loading">불러오는 중…</div>;

  const dirty =
    enabled !== config.enabled || FIELDS.some(({ key }) => content[key] !== config.content[key]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      apply(await client.saveGiftConfig(enabled, content));
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장 실패');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="gift-config" aria-labelledby="gift-config-title">
      <div className="gift-config__head">
        <h2 id="gift-config-title" className="gift-config__title">이벤트 화면 설정</h2>
        <label className="gift-config__switch">
          <input
            type="checkbox"
            role="switch"
            checked={enabled}
            onChange={(e) => {
              setEnabled(e.target.checked);
              setSaved(false);
            }}
          />
          <span>{enabled ? '이벤트 진행 중' : '이벤트 꺼짐'}</span>
        </label>
      </div>

      {!enabled && (
        <p className="gift-config__notice">
          꺼두면 참여자는 번호 입력 없이 바로 설문에 참여하고, 번호 기준 중복 참여 확인도 하지 않습니다.
          이미 수집한 번호와 아래 발송 목록은 그대로 유지됩니다.
        </p>
      )}

      <div className="gift-config__fields">
        {FIELDS.map(({ key, label, max, multiline }) => (
          <div key={key} className="gift-config__field">
            <label htmlFor={`gift-${key}`}>{label}</label>
            {multiline ? (
              <textarea
                id={`gift-${key}`}
                rows={3}
                maxLength={max}
                value={content[key]}
                onChange={(e) => {
                  setContent({ ...content, [key]: e.target.value });
                  setSaved(false);
                }}
              />
            ) : (
              <input
                id={`gift-${key}`}
                type="text"
                maxLength={max}
                value={content[key]}
                onChange={(e) => {
                  setContent({ ...content, [key]: e.target.value });
                  setSaved(false);
                }}
              />
            )}
          </div>
        ))}
      </div>

      {error && <p className="gift-config__error" role="alert">{error}</p>}

      <div className="gift-config__actions">
        <button type="button" className="btn-primary" onClick={handleSave} disabled={saving || !dirty}>
          {saving ? '저장 중…' : '저장'}
        </button>
        <button
          type="button"
          className="admin-retry-btn"
          onClick={() => {
            setContent(config.defaults);
            setSaved(false);
          }}
          disabled={saving}
        >
          기본 문구로 되돌리기
        </button>
        {saved && <span className="gift-config__saved" role="status">저장했어요</span>}
      </div>
    </section>
  );
}
