import LoginModal from "./LoginModal";

interface RegisterModalProps {
  onClose: () => void;
  onSwitchToLogin?: () => void;
  redirectPath?: string;
}

// 회원가입도 카카오 로그인으로 통합 — LoginModal을 register 변형으로 표시
export default function RegisterModal({ onClose, redirectPath }: RegisterModalProps) {
  return <LoginModal onClose={onClose} variant="register" redirectPath={redirectPath} />;
}
