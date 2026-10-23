/** "2026년 10월 16일" 형식 */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** "2026-10-16" 형식 */
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
