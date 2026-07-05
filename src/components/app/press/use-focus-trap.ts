import { useEffect, useRef } from 'react';

// Accessible dialog behaviour for a modal container:
//  • traps Tab focus inside the dialog,
//  • closes on Escape,
//  • moves focus into the dialog on open and restores it to the previously
//    focused element on close.
// Attach the returned ref to the dialog's outermost element and give that
// element role="dialog" aria-modal="true".
export function useFocusTrap<T extends HTMLElement = HTMLDivElement>(onClose?: () => void) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const prevFocus = (typeof document !== 'undefined' ? document.activeElement : null) as HTMLElement | null;

    const focusables = () =>
      Array.from(
        node.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);

    // Move focus into the dialog.
    const first = focusables()[0];
    (first ?? node).focus?.();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose?.(); return; }
      if (e.key !== 'Tab') return;
      const items = focusables();
      if (!items.length) { e.preventDefault(); return; }
      const firstEl = items[0]!;
      const lastEl = items[items.length - 1]!;
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && (active === firstEl || !node.contains(active))) { e.preventDefault(); lastEl.focus(); }
      else if (!e.shiftKey && active === lastEl) { e.preventDefault(); firstEl.focus(); }
    };

    node.addEventListener('keydown', onKey);
    return () => {
      node.removeEventListener('keydown', onKey);
      // Restore focus to what opened the dialog.
      prevFocus?.focus?.();
    };
  }, [onClose]);

  return ref;
}
