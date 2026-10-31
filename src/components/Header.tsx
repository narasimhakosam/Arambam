import { useState } from 'react';
import { planReadiness } from '../engine';
import type { Plan } from '../schemas';
import { shareHash } from '../state/share';
import { BrandMark, Icon } from './Icon';
import { useTheme } from '../lib/theme';
import { BRANDING } from '../lib/branding';
import { Confirm } from './ui';

export function Header({
  plan,
  onReset,
  onToggleSidebar,
  activeTabLabel,
}: {
  plan: Plan | null;
  onReset: () => void;
  onToggleSidebar?: () => void;
  activeTabLabel?: string;
}) {
  const [confirmReset, setConfirmReset] = useState(false);
  const [share, setShare] = useState<{ status: 'copied' | 'manual'; url: string } | null>(null);
  const readiness = plan ? planReadiness(plan) : null;
  const { theme, toggle } = useTheme();

  async function copyLink(current: Plan) {
    const url = `${window.location.origin}${window.location.pathname}${shareHash(current)}`;
    try {
      await navigator.clipboard.writeText(url);
      setShare({ status: 'copied', url });
    } catch {
      setShare({ status: 'manual', url });
    }
  }

  return (
    <header className="no-print sticky top-0 z-30 border-b border-line/80 bg-card/90 shadow-sm backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5 px-4 py-2.5 sm:px-6">
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              aria-label="Toggle navigation sidebar"
              title="Toggle sidebar"
              className="rounded-lg p-2 text-ink-soft hover:bg-paper hover:text-ink lg:hidden"
            >
              <Icon name="menu" className="h-5 w-5" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <BrandMark className="h-7 w-7 shrink-0 lg:hidden" />
            <span className="font-display text-base font-bold tracking-tight text-ink">
              {BRANDING.PRODUCT_NAME}
            </span>
            {activeTabLabel && (
              <>
                <span className="text-ink-soft/40">/</span>
                <span className="text-sm font-semibold text-accent">{activeTabLabel}</span>
              </>
            )}
          </div>
        </div>

        {readiness && (
          <div className="order-last w-full sm:order-none sm:w-64" aria-label="Plan readiness">
            <p className="flex items-baseline justify-between text-xs font-semibold">
              <span className="text-ink">Plan readiness {readiness.percent}%</span>
              <span className="font-normal text-ink-soft">
                {readiness.tasksDone}/{readiness.tasksTotal} tasks · {readiness.quotesVerified}/
                {readiness.quotesTotal} vendors
              </span>
            </p>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-line/80 p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent to-accent-dark transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, readiness.percent))}%` }}
              />
              <progress
                className="sr-only"
                max={100}
                value={readiness.percent}
                aria-label="Plan readiness percent"
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            className="btn-secondary !min-h-10 !min-w-10 !px-3"
            onClick={toggle}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} className="h-4 w-4" />
          </button>
          {plan && (
            <>
              <button
                type="button"
                className="btn-secondary !min-h-10 !px-3.5"
                onClick={() => void copyLink(plan)}
                title="Share link"
              >
                <Icon name="link" className="h-4 w-4" />
                <span className="sr-only sm:not-sr-only text-xs">Share link</span>
              </button>
              <button
                type="button"
                className="btn-secondary !min-h-10 !px-3.5"
                onClick={() => window.print()}
                title="Print summary"
              >
                <Icon name="printer" className="h-4 w-4" />
                <span className="sr-only sm:not-sr-only text-xs">Print summary</span>
              </button>
              <button
                type="button"
                className="btn-secondary !min-h-10 !px-3.5 hover:border-warn/50 hover:text-warn"
                onClick={() => setConfirmReset(true)}
                title="Reset plan"
              >
                <Icon name="reset" className="h-4 w-4" />
                <span className="sr-only sm:not-sr-only text-xs">Reset</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6" aria-live="polite">
        {share?.status === 'copied' && (
          <div className="mb-3 flex items-center gap-2 rounded-xl border border-ok/20 bg-ok-soft px-3 py-2 text-sm font-medium text-ok shadow-sm">
            <Icon name="check" className="h-4 w-4 shrink-0" />
            <span>
              Link copied to clipboard! Anyone with this link can view this celebration plan.
            </span>
          </div>
        )}
        {share?.status === 'manual' && (
          <div className="mb-3 rounded-xl border border-line bg-paper p-3 shadow-sm">
            <label htmlFor="share-url" className="label text-xs">
              Copy this link
            </label>
            <input
              id="share-url"
              readOnly
              className="input font-mono text-xs"
              value={share.url}
              onFocus={(e) => e.currentTarget.select()}
            />
          </div>
        )}
        {confirmReset && (
          <div className="mb-3">
            <Confirm
              prompt="Reset the whole plan? Your budget, timeline and quotations will be cleared from this browser."
              confirmLabel="Yes, reset"
              onCancel={() => setConfirmReset(false)}
              onConfirm={() => {
                setConfirmReset(false);
                setShare(null);
                onReset();
              }}
            />
          </div>
        )}
      </div>
    </header>
  );
}
