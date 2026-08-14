import {
  Heart, Flower2, Star, Mail, Clock, Check,
  ArrowRight, Home, FileText, LayoutGrid, Settings,
  LogOut, Share2, Search, ArrowLeft, Play, Menu, Plus,
} from "lucide-react";
import type { LucideProps } from "lucide-react";
import type { ComponentType } from "react";

export type IconName =
  | "heart" | "flower" | "star" | "letter" | "clock" | "check"
  | "arrow" | "home" | "doc" | "grid" | "gear" | "logout" | "share"
  | "search" | "back" | "play" | "menu" | "plus" | "mail";

interface PixelIconProps {
  name: IconName;
  size?: number;
  fill?: string;
}

const iconMap: Record<IconName, ComponentType<LucideProps>> = {
  heart:  Heart,
  flower: Flower2,
  star:   Star,
  letter: Mail,
  clock:  Clock,
  check:  Check,
  arrow:  ArrowRight,
  home:   Home,
  doc:    FileText,
  grid:   LayoutGrid,
  gear:   Settings,
  logout: LogOut,
  share:  Share2,
  search: Search,
  back:   ArrowLeft,
  play:   Play,
  menu:   Menu,
  plus:   Plus,
  mail:   Mail,
};

export default function PixelIcon({ name, size = 24, fill = "#111" }: PixelIconProps) {
  const Icon = iconMap[name];
  if (!Icon) return null;
  return <Icon size={size} color={fill} strokeWidth={2.5} />;
}
