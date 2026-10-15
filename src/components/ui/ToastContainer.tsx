import { useToastStore } from "../../store/toastStore";

const VARIANT_STYLES: Record<string, string> = {
  default: "bg-surface border-border text-ink",
  success: "bg-surface border-border text-ink",
  error:   "bg-surface border-[#e7cbd1] text-danger",
};

const ICON: Record<string, string> = {
  default: "✓",
  success: "✓",
  error:   "✕",
};

const ICON_COLOR: Record<string, string> = {
  default: "text-success",
  success: "text-success",
  error:   "text-danger",
};

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex flex-col items-center gap-2 pointer-events-none">
      {toasts.map((t) => {
        const variant = t.variant ?? "default";
        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-3 rounded-[12px] border px-4 py-3 shadow-[0_8px_24px_rgba(48,44,58,.14)] ${VARIANT_STYLES[variant]}`}
            style={{ minWidth: 220, maxWidth: "min(420px, calc(100vw - 32px)" }}
          >
            <span className={`text-[15px] leading-none shrink-0 ${ICON_COLOR[variant]}`}>
              {ICON[variant]}
            </span>
            <span className="font-body text-[13px] leading-snug flex-1">{t.message}</span>
            <button
              onClick={() => removeToast(t.id)}
              aria-label="닫기"
              className="shrink-0 text-muted hover:text-heading text-[14px] leading-none bg-transparent border-0 cursor-pointer p-0 ml-1"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}
