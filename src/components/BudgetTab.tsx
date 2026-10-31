import { useCallback, useMemo, useRef } from 'react';
import {
  budgetStatus,
  categoryNeeds,
  formatINR,
  generateOverBudgetOptions,
  OCCASION_LABELS,
  toLakh,
} from '../engine';
import { type Category, type Plan } from '../schemas';
import type { Action } from '../state/planStore';
import { AllocationBar, SWATCH_CLASS } from './AllocationBar';
import { BudgetControls } from './BudgetControls';
import { CategoryRow } from './CategoryRow';
import { Icon } from './Icon';
import { TradeoffPanel } from './TradeoffPanel';

export function BudgetTab({ plan, dispatch }: { plan: Plan; dispatch: (action: Action) => void }) {
  const status = useMemo(() => budgetStatus(plan), [plan]);
  const needs = useMemo(() => categoryNeeds(plan), [plan]);
  const options = useMemo(() => generateOverBudgetOptions(plan), [plan]);

  const onChange = useCallback(
    (category: Category, amount: number) => dispatch({ type: 'setAmount', category, amount }),
    [dispatch],
  );
  const onToggleLock = useCallback(
    (category: Category) => dispatch({ type: 'toggleLock', category }),
    [dispatch],
  );

  const over = status.overBy > 0;
  const optionsRef = useRef<HTMLDivElement>(null);
  const showOptions = () => {
    optionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    optionsRef.current?.focus({ preventScroll: true });
  };

  return (
    <div className="space-y-6">
      <section className="card shadow-card" aria-labelledby="summary-h">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/60 pb-3">
          <h2 id="summary-h" className="font-display text-lg font-bold text-ink sm:text-xl">
            Budget at a glance
          </h2>
          <span className="text-xs font-semibold uppercase tracking-wider text-accent">
            Deterministic Engine Allocation
          </span>
        </div>
        <dl className="mt-4 grid grid-cols-1 divide-y divide-line/70 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="py-3 sm:py-0 sm:pr-6">
            <dt className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
              Total budget
            </dt>
            <dd className="tabular mt-1 font-display text-3xl font-extrabold text-ink">
              {formatINR(status.total)}
            </dd>
            <dd className="mt-0.5 text-xs font-medium text-accent">{toLakh(status.total)}</dd>
          </div>
          <div className="py-3 sm:px-6 sm:py-0">
            <dt className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
              Committed (verified quotations)
            </dt>
            <dd className="tabular mt-1 font-display text-3xl font-extrabold text-ok">
              {formatINR(status.committed)}
            </dd>
            <dd className="mt-0.5 text-xs text-ink-soft">Locked by approved quotes</dd>
          </div>
          <div className="py-3 sm:py-0 sm:pl-6">
            <dt className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
              Estimated (not yet quoted)
            </dt>
            <dd className="tabular mt-1 font-display text-3xl font-extrabold text-ink">
              {formatINR(status.estimated)}
            </dd>
            <dd className="mt-0.5 text-xs text-ink-soft">Subject to vendor quotes</dd>
          </div>
        </dl>
        <div className="mt-6 border-t border-line/60 pt-4">
          <AllocationBar plan={plan} />
        </div>
      </section>

      <div
        role="status"
        aria-live="polite"
        data-testid="over-budget-region"
        className="sticky top-20 z-20"
      >
        {over ? (
          <div className="flex h-[4.5rem] items-center gap-3 rounded-2xl border border-warn/40 bg-warn-soft px-4 text-warn shadow-soft backdrop-blur-md">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-warn/15">
              <Icon name="alert" className="h-5 w-5 text-warn" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold sm:text-base">
                Over budget by {formatINR(status.overBy)}
              </p>
              <p className="truncate text-xs text-warn/90 sm:text-sm">
                {status.overByPct}% of your total. Nothing was changed automatically.
              </p>
            </div>
            <button
              type="button"
              className="btn-secondary !min-h-9 shrink-0 !px-3.5 text-xs font-bold"
              onClick={showOptions}
            >
              Options
            </button>
          </div>
        ) : (
          <div className="flex h-[4.5rem] items-center gap-3 rounded-2xl border border-ok/25 bg-card/95 px-4 text-ink-soft shadow-soft backdrop-blur-md">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ok-soft text-ok">
              <Icon name="check" className="h-5 w-5 text-ok" />
            </div>
            <p className="truncate text-sm font-semibold text-ink">
              Within budget. Everything adds up to {formatINR(status.total)}.
            </p>
          </div>
        )}
      </div>

      <section aria-labelledby="cats-h">
        <h2 id="cats-h" className="font-display text-lg font-bold text-ink sm:text-xl">
          Where the money goes
        </h2>
        <p className="mb-4 mt-1 text-sm text-ink-soft">
          Move one slider and the others adjust to keep the total the same. Lock a category to
          protect it.
        </p>
        <div className="card divide-y divide-line/70 !p-0 shadow-card">
          {needs.map((need) => (
            <CategoryRow
              key={need.category}
              occasion={plan.occasion}
              category={need.category}
              amount={plan.allocation[need.category]}
              total={plan.totalBudget}
              locked={plan.locked.includes(need.category)}
              need={need}
              swatchClass={SWATCH_CLASS[need.category]}
              onChange={onChange}
              onToggleLock={onToggleLock}
            />
          ))}
        </div>
        <p className="mt-3 text-xs text-ink-soft">
          Splits start from typical presets for a {OCCASION_LABELS[plan.occasion].toLowerCase()} and
          stay estimates until you accept a vendor quotation.
        </p>
      </section>

      <BudgetControls plan={plan} dispatch={dispatch} />

      {over && (
        <div id="tradeoffs" ref={optionsRef} tabIndex={-1} className="outline-none">
          <TradeoffPanel
            plan={plan}
            options={options}
            overBy={status.overBy}
            onApply={(option) => dispatch({ type: 'applyOption', option })}
          />
        </div>
      )}
    </div>
  );
}
