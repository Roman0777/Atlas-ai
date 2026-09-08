import { useCallback } from "react";

/**
 * Material-design ripple effect — attach to click handlers.
 * Returns props to spread onto a container with `ripple-container` class.
 */
export function useRipple() {
  const createRipple = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      const container = e.currentTarget;
      const rect = container.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      const ripple = document.createElement("span");
      ripple.className = "ripple";
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;

      container.appendChild(ripple);
      ripple.addEventListener("animationend", () => ripple.remove());
    },
    [],
  );

  return { onClick: createRipple };
}
