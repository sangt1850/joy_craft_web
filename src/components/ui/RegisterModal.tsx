import LoginModal from "./LoginModal";

interface RegisterModalProps {
  onClose: () => void;
  onSuccess: () => void;
  onSwitchToLogin?: () => void;
}

// 회원가입도 카카오 로그인으로 통합 — LoginModal 재사용
export default function RegisterModal({ onClose, onSuccess }: RegisterModalProps) {
  return <LoginModal onClose={onClose} onSuccess={onSuccess} />;
}
