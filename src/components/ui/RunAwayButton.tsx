import { useState } from "react";
import { motion } from "framer-motion";
import NeoButton from "./NeoButton";

interface RunAwayButtonProps {
  children: React.ReactNode;
  bg?: string;
  color?: string;
  size?: "sm" | "md" | "lg";
}

export default function RunAwayButton({ children, bg, color, size }: RunAwayButtonProps) {
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const flee = () => {
    setPos({
      x: (Math.random() - 0.5) * 260,
      y: (Math.random() - 0.5) * 140,
    });
  };

  return (
    <motion.div
      animate={pos}
      transition={{ type: "spring", stiffness: 500, damping: 22 }}
      onMouseEnter={flee}
      style={{ display: "inline-block", cursor: "default" }}
    >
      <NeoButton bg={bg} color={color} size={size}>
        {children}
      </NeoButton>
    </motion.div>
  );
}
