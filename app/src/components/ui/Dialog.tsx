import { X } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import { focusAfterRender } from '../../utils/focus';

interface DialogProps {
  children: ReactNode;
  label: string;
  onClose: () => void;
}

const focusableSelector =
  'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

export function Dialog({ children, label, onClose }: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    const firstFocusable = dialog?.querySelector<HTMLElement>(focusableSelector);
    focusAfterRender(() => firstFocusable);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !dialog) return;
      const focusables = Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector));
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.classList.add('dialog-open');
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.classList.remove('dialog-open');
      focusAfterRender(() => previousFocusRef.current);
    };
  }, [onClose]);

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="dialog" role="dialog" aria-modal="true" aria-label={label} ref={dialogRef}>
        <button className="dialog__close" type="button" aria-label={`Fechar ${label}`} onClick={onClose}>
          <X aria-hidden="true" />
        </button>
        {children}
      </div>
    </div>
  );
}
