import { useMemo } from 'react';
import { vendorChecklist, VENDOR_STATUS_LABELS, type VendorStatus } from '../engine';
import type { Plan } from '../schemas';
import { Icon, type IconName } from './Icon';
import type { Action } from '../state/planStore';

const ICON: Record<VendorStatus, IconName> = {
  not_started: 'circle',
  contacted: 'mail',
  quote_received: 'file',
  quote_accepted: 'check',
};

export function VendorChecklist({
  plan,
  dispatch,
}: {
  plan: Plan;
  dispatch: (action: Action) => void;
}) {
  const items = useMemo(() => vendorChecklist(plan), [plan]);
  const confirmed = items.filter((i) => i.status === 'quote_accepted').length;
  const progressPct = Math.round((confirmed / (items.length || 1)) * 100);

  return (
    <section className="card border-line/80 shadow-card" aria-labelledby="checklist-h">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/60 pb-3">
        <div>
          <h2 id="checklist-h" className="font-display text-lg font-bold text-ink sm:text-xl">
            Vendor checklist
          </h2>
          <p className="hint text-xs">
            Tick &quot;Contacted&quot; when you reach out. Saving or accepting a quotation below
            updates the status.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs font-bold text-ink">
              {confirmed} of {items.length} vendors confirmed
            </span>
            <div className="mt-1 h-2 w-32 overflow-hidden rounded-full bg-line/80">
              <div
                className="h-full rounded-full bg-ok transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <ul className="mt-4 divide-y divide-line/60 rounded-xl border border-line/60 bg-card">
        {items.map((item) => (
          <li
            key={item.category}
            className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-paper/50"
          >
            <div className="min-w-0 flex-1">
              <p className="font-bold text-ink text-sm sm:text-base">{item.label}</p>
              <p className="text-xs text-ink-soft">{item.hint}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={item.status === 'quote_accepted' ? 'badge-verified' : 'badge-estimate'}
              >
                <Icon name={ICON[item.status]} className="h-3 w-3" />{' '}
                {VENDOR_STATUS_LABELS[item.status]}
              </span>
              <label className="flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-line bg-paper px-3 text-xs font-semibold text-ink shadow-xs transition-colors hover:bg-card">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded accent-accent"
                  checked={item.status !== 'not_started'}
                  disabled={item.quotes > 0}
                  onChange={() => dispatch({ type: 'toggleContacted', category: item.category })}
                  aria-label={`Contacted ${item.label} vendor`}
                />
                Contacted
              </label>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
