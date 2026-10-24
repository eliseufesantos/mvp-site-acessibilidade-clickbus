import { useEffect, useState } from 'react';

interface ReadingAidsProps {
  guide: boolean;
  mask: boolean;
}

export function ReadingAids({ guide, mask }: ReadingAidsProps) {
  const [top, setTop] = useState(() => Math.round(window.innerHeight / 2));

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => setTop(event.clientY);
    const onFocus = (event: FocusEvent) => {
      const element = event.target as HTMLElement;
      const rect = element.getBoundingClientRect();
      if (rect.height > 0) setTop(Math.round(rect.top + rect.height / 2));
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('focusin', onFocus);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('focusin', onFocus);
    };
  }, []);

  return (
    <div className="reading-aids" aria-hidden="true">
      {mask ? <><div className="reading-mask reading-mask--top" style={{ height: Math.max(0, top - 34) }} /><div className="reading-mask reading-mask--bottom" style={{ top: top + 34 }} /></> : null}
      {guide ? <div className="reading-guide" style={{ top }} /> : null}
    </div>
  );
}

export const ReadingGuide = ReadingAids;
