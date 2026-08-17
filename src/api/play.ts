import { publicApi } from "./client";
import type { FlowPolicy, FlowPolicyInput, PlaySnapshot } from "../types/api";

/**
 * 발행된 사이트의 스냅샷을 가져온다.
 *
 * 주의: 이 엔드포인트만 ApiResponse<T> 봉투가 없다.
 * PublicationController.getBySlug가 publication.getSnapshot()을 그대로 반환한다.
 * 인증 불필요(permit-all)이므로 publicApi를 쓴다.
 */
export async function fetchPlaySnapshot(slug: string): Promise<PlaySnapshot> {
  return publicApi.get<PlaySnapshot>(`/play/${encodeURIComponent(slug)}`);
}

/** flowPolicy가 없거나 알 수 없는 값일 때 쓰는 안전한 기본값 */
export const DEFAULT_FLOW_POLICY: FlowPolicy = {
  mode: "gated",
  showProgress: true,
  escapeAfter: 120,
};

/** 서버에서 온 부분 flowPolicy를 완전한 형태로 정규화한다 */
export function normalizeFlowPolicy(input: FlowPolicyInput | null | undefined): FlowPolicy {
  const mode = input?.mode === "free" || input?.mode === "gated" ? input.mode : DEFAULT_FLOW_POLICY.mode;

  const showProgress =
    typeof input?.showProgress === "boolean" ? input.showProgress : DEFAULT_FLOW_POLICY.showProgress;

  const escapeAfter =
    typeof input?.escapeAfter === "number" && Number.isFinite(input.escapeAfter)
      ? input.escapeAfter
      : input?.escapeAfter === null
        ? null
        : DEFAULT_FLOW_POLICY.escapeAfter;

  return { mode, showProgress, escapeAfter };
}
