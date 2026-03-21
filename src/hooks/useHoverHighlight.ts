import { useState } from "react";

/**
 * useHoverHighlight
 * Pievieno spīdēšanas (emissive) efektu objektiem, kad lietotājs uz tiem uzbrauc ar peli.
 */
export function useHoverHighlight() {
  const [hovered, setHovered] = useState<any>(null);

  return {
    hovered,
    onPointerOver: (e: any) => {
      e.stopPropagation();
      // Iestatām mazu spīdumu
      if (e.object.material && e.object.material.emissive) {
        e.object.material.emissive.set("#222222");
      }
      setHovered(e.object);
      document.body.style.cursor = 'pointer';
    },
    onPointerOut: (e: any) => {
      if (e.object.material && e.object.material.emissive) {
        e.object.material.emissive.set("#000000");
      }
      setHovered(null);
      document.body.style.cursor = 'auto';
    }
  };
}
