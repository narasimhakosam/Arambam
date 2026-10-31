import { useEffect } from 'react';
import type { Occasion } from '../schemas';
import { describeChanges } from '../lib/format';
import type { ToastData } from '../state/planStore';
import { Icon } from './Icon';

/** Shows what moved after a budget change. Always mounted so screen readers announce updates. */
export function Toast({
  toast,
  occasion,
  onDismiss,
}: {
  toast: ToastData | null;
  occasion: Occasion;
  onDismiss: () => void;
}) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(onDismiss, 8000);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  const text = toast
    ? [describeChanges(occasion, toast.changes), toast.note].filter(Boolean).join(' ')
    : '';
  return (
    <div
      aria-live="polite"
      role="status"
      className="no-print pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4"
    >
      {toast && text && (
        <div className="pointer-events-auto flex max-w-xl items-center gap-3 rounded-2xl border border-line bg-card/95 px-5 py-3.5 text-sm font-medium text-ink shadow-elevated backdrop-blur-md">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
            <Icon name="sparkle" className="h-4 w-4" />
          </div>
          <p className="flex-1 leading-snug">{text}</p>
          <button
            type="button"
            className="btn-quiet !min-h-8 shrink-0 rounded-lg !px-2.5 text-xs font-semibold text-accent"
            onClick={onDismiss}
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
