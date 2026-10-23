interface ConfirmModalProps {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirming?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  title,
  description,
  confirmLabel = "확인",
  cancelLabel = "취소",
  confirming = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: "rgba(48,44,58,.38)", backdropFilter: "blur(4px)" }}
      onClick={() => !confirming && onCancel()}
    >
      <div
        className="w-[360px] max-w-[calc(100vw-32px)] rounded-2xl border border-border bg-surface p-7 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="m-0 mb-2 text-center text-[18px] font-semibold text-heading">
          {title}
        </h3>
        <p className="m-0 mb-6 text-center text-[13px] leading-relaxed text-muted">
          {description}
        </p>
        <div className="flex justify-center gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={confirming}
            className="jc-button h-9 rounded-lg bg-bg px-5 text-[13px] text-heading"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={confirming}
            className="jc-button h-9 rounded-lg bg-danger px-5 text-[13px] text-white"
          >
            {confirming ? "처리 중…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
