import { categoryLabel, compareQuote, effectiveCost, formatINR } from '../engine';
import { CATEGORIES, type Category, type Plan, type StoredQuote } from '../schemas';
import type { Action } from '../state/planStore';
import { Icon } from './Icon';
import { EstimateBadge } from './ui';

function CategoryTable({
  plan,
  category,
  quotes,
  dispatch,
}: {
  plan: Plan;
  category: Category;
  quotes: StoredQuote[];
  dispatch: (a: Action) => void;
}) {
  const label = categoryLabel(plan.occasion, category);
  const budget = plan.allocation[category];
  const cols = quotes.map((s) => {
    const cost = effectiveCost(s.quote, plan.guests);
    return { s, cost, flags: compareQuote(s.quote, plan) };
  });
  const cell = (render: (c: (typeof cols)[number]) => React.ReactNode) =>
    cols.map((c) => (
      <td key={c.s.id} className="px-3.5 py-3 align-top text-xs sm:text-sm">
        {render(c)}
      </td>
    ));

  return (
    <section
      className="card overflow-x-auto border-line/80 shadow-card"
      aria-labelledby={`cmp-${category}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/60 pb-3">
        <h3 id={`cmp-${category}`} className="font-display text-base font-bold text-ink sm:text-lg">
          {label}: compare quotations
        </h3>
        <EstimateBadge verified={quotes.some((q) => q.accepted)} />
      </div>
      <p className="hint text-xs">
        Budget for this category: <strong className="text-ink">{formatINR(budget)}</strong>
      </p>
      <div className="mt-3 overflow-hidden rounded-xl border border-line/70 bg-card">
        <table className="min-w-[28rem] w-full text-left">
          <caption className="sr-only">Side-by-side quotations for {label}</caption>
          <thead>
            <tr className="border-b border-line/80 bg-paper/60">
              <th
                scope="col"
                className="px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider text-ink-soft"
              >
                <span className="sr-only">Detail</span>
              </th>
              {cols.map((c, i) => (
                <th key={c.s.id} scope="col" className="px-3.5 py-2.5 text-sm font-bold text-ink">
                  {c.s.quote.vendorName ?? `Quotation ${i + 1}`}
                  {c.s.accepted && (
                    <span className="badge-verified ml-2">
                      <Icon name="check" className="h-3 w-3" /> Accepted
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line/60">
            <tr>
              <th scope="row" className="px-3.5 py-3 text-xs font-semibold text-ink-soft">
                Effective cost for {plan.guests} guests
              </th>
              {cell((c) =>
                c.cost === null ? (
                  'Not stated'
                ) : (
                  <strong className="font-bold text-accent">{formatINR(c.cost)}</strong>
                ),
              )}
            </tr>
            <tr>
              <th scope="row" className="px-3.5 py-3 text-xs font-semibold text-ink-soft">
                Against budget
              </th>
              {cell((c) =>
                c.cost === null ? (
                  '-'
                ) : c.cost > budget ? (
                  <span className="inline-flex items-center gap-1 font-bold text-warn">
                    <Icon name="alert" className="h-3.5 w-3.5 shrink-0" />
                    {formatINR(c.cost - budget)} over
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-bold text-ok">
                    <Icon name="check" className="h-3.5 w-3.5 shrink-0" />
                    {formatINR(budget - c.cost)} under
                  </span>
                ),
              )}
            </tr>
            <tr>
              <th scope="row" className="px-3.5 py-3 text-xs font-semibold text-ink-soft">
                Per plate
              </th>
              {cell((c) =>
                c.s.quote.pricePerPlate === null ? '-' : formatINR(c.s.quote.pricePerPlate),
              )}
            </tr>
            <tr>
              <th scope="row" className="px-3.5 py-3 text-xs font-semibold text-ink-soft">
                Guest minimum
              </th>
              {cell((c) => c.s.quote.guestMinimum ?? '-')}
            </tr>
            <tr>
              <th scope="row" className="px-3.5 py-3 text-xs font-semibold text-ink-soft">
                Advance
              </th>
              {cell((c) =>
                c.s.quote.advancePercent === null ? '-' : `${c.s.quote.advancePercent}%`,
              )}
            </tr>
            <tr>
              <th scope="row" className="px-3.5 py-3 text-xs font-semibold text-ink-soft">
                Tax
              </th>
              {cell((c) =>
                c.s.quote.taxIncluded === null
                  ? 'Not stated'
                  : c.s.quote.taxIncluded
                    ? 'Included'
                    : 'Extra',
              )}
            </tr>
            <tr>
              <th scope="row" className="px-3.5 py-3 text-xs font-semibold text-ink-soft">
                Things to check
              </th>
              {cell((c) =>
                c.flags.length === 0 ? (
                  <span className="inline-flex items-center gap-1 font-medium text-ok">
                    <Icon name="check" className="h-3.5 w-3.5" />
                    None
                  </span>
                ) : (
                  <ul className="space-y-1">
                    {c.flags.map((f) => (
                      <li key={f.code} className="text-warn text-xs font-medium">
                        <Icon name="alert" className="mr-1 inline h-3.5 w-3.5 shrink-0" />
                        {f.message}
                      </li>
                    ))}
                  </ul>
                ),
              )}
            </tr>
            <tr>
              <th scope="row" className="px-3.5 py-3 text-xs font-semibold text-ink-soft">
                Actions
              </th>
              {cell((c) => (
                <div className="flex flex-wrap gap-2">
                  {!c.s.accepted && (
                    <button
                      type="button"
                      className="btn-primary !min-h-8 !px-3 text-xs"
                      disabled={c.cost === null}
                      onClick={() => dispatch({ type: 'acceptQuote', id: c.s.id })}
                    >
                      Accept
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-secondary !min-h-8 !px-3 text-xs"
                    onClick={() => dispatch({ type: 'removeQuote', id: c.s.id })}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function QuoteComparison({ plan, dispatch }: { plan: Plan; dispatch: (a: Action) => void }) {
  const groups = CATEGORIES.map((c) => ({
    c,
    quotes: plan.quotes.filter((q) => q.category === c),
  })).filter((g) => g.quotes.length > 0);
  if (groups.length === 0) {
    return (
      <div className="card border-line/80 p-6 text-sm text-ink-soft shadow-card">
        No quotations saved yet. Analyze a quotation above and save it to compare up to three
        vendors per category.
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {groups.map((g) => (
        <CategoryTable key={g.c} plan={plan} category={g.c} quotes={g.quotes} dispatch={dispatch} />
      ))}
    </div>
  );
}
