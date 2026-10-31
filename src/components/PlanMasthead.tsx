import { diffDays, OCCASION_LABELS, toLakh } from '../engine';
import type { Plan } from '../schemas';
import { formatDate } from '../lib/format';
import { Icon } from './Icon';

function countdown(days: number): string {
  if (days > 1) return `${days} days to go`;
  if (days === 1) return 'Tomorrow';
  if (days === 0) return 'Today';
  return 'This date has passed';
}

/** The event at a glance, shown above every tab so the plan always feels like one connected thing. */
export function PlanMasthead({ plan, today }: { plan: Plan; today: string }) {
  const days = diffDays(today, plan.eventDate);
  return (
    <section
      aria-label="Plan summary"
      className="card mb-6 border-line/80 bg-gradient-to-br from-card via-card to-accent-soft/30 p-5 shadow-card sm:p-7"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/25 bg-accent-soft px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-accent">
              <Icon name="sparkle" className="h-3 w-3" /> Active Celebration Plan
            </span>
          </div>
          <h2
            id="plan-title"
            tabIndex={-1}
            className="font-display text-2xl font-extrabold tracking-tight text-ink outline-none sm:text-3xl md:text-4xl"
          >
            {OCCASION_LABELS[plan.occasion]}
            <span className="block font-medium text-ink-soft sm:inline">
              <span className="hidden sm:inline"> · </span>
              {formatDate(plan.eventDate)}
            </span>
          </h2>
          {plan.vibe && (
            <p className="mt-1.5 text-sm font-medium italic text-ink-soft sm:text-base">
              &ldquo;{plan.vibe}&rdquo;
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-line bg-paper px-3.5 py-2 text-xs font-semibold text-ink shadow-sm">
            <Icon name="users" className="h-4 w-4 text-accent" />
            <span>{plan.guests} guests</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-line bg-paper px-3.5 py-2 text-xs font-semibold text-ink shadow-sm">
            <Icon name="wallet" className="h-4 w-4 text-ok" />
            <span>{toLakh(plan.totalBudget)} budget</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-line bg-paper px-3.5 py-2 text-xs font-semibold text-ink shadow-sm">
            <Icon name="calendar" className="h-4 w-4 text-accent" />
            <span>{countdown(days)}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
