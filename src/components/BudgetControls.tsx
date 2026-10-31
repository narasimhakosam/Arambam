import { useSyncedText } from '../lib/useSyncedText';
import { formatINR, parseGuests, parseINR, scaleGuests } from '../engine';
import { MAX_GUESTS, type Plan } from '../schemas';
import type { Action } from '../state/planStore';
import { Icon } from './Icon';
import { Field } from './ui';

export function BudgetControls({
  plan,
  dispatch,
}: {
  plan: Plan;
  dispatch: (action: Action) => void;
}) {
  const impact = scaleGuests(plan, plan.guests);
  const [guestsText, setGuestsText] = useSyncedText(String(plan.guests));
  const [budgetText, setBudgetText] = useSyncedText(String(plan.totalBudget));
  const [perPlateText, setPerPlateText] = useSyncedText(String(Math.round(plan.perPlate)));

  function commitGuests(value: string) {
    const guests = parseGuests(value);
    if (guests === null) setGuestsText(String(plan.guests));
    else dispatch({ type: 'setGuests', guests });
  }

  function commitBudget() {
    const parsed = parseINR(budgetText);
    if (parsed === null) setBudgetText(String(plan.totalBudget));
    else dispatch({ type: 'setTotal', total: parsed });
  }

  function commitPerPlate() {
    const parsed = perPlateText.trim() === '0' ? 0 : parseINR(perPlateText);
    if (parsed === null) setPerPlateText(String(Math.round(plan.perPlate)));
    else dispatch({ type: 'setPerPlate', perPlate: parsed });
  }

  return (
    <section className="card shadow-card" aria-labelledby="controls-h">
      <h2 id="controls-h" className="font-display text-lg font-bold text-ink sm:text-xl">
        Guests and totals
      </h2>
      <div className="mt-4 grid gap-5 sm:grid-cols-3">
        <Field label="Number of guests">
          {(p) => (
            <input
              {...p}
              className="input"
              type="number"
              inputMode="numeric"
              min={1}
              max={MAX_GUESTS}
              value={guestsText}
              onChange={(e) => {
                setGuestsText(e.target.value);
                const guests = parseGuests(e.target.value);
                if (guests !== null) dispatch({ type: 'setGuests', guests });
              }}
              onBlur={(e) => commitGuests(e.target.value)}
            />
          )}
        </Field>
        <Field label="Total budget (₹)" hint="Try 8 lakh or 8,00,000">
          {(p) => (
            <input
              {...p}
              className="input font-semibold"
              value={budgetText}
              onChange={(e) => setBudgetText(e.target.value)}
              onBlur={commitBudget}
              onKeyDown={(e) => e.key === 'Enter' && commitBudget()}
            />
          )}
        </Field>
        <Field
          label="Catering cost per plate (₹)"
          hint="Starts from your catering share. Edit if you know better."
        >
          {(p) => (
            <input
              {...p}
              className="input font-semibold"
              value={perPlateText}
              onChange={(e) => setPerPlateText(e.target.value)}
              onBlur={commitPerPlate}
              onKeyDown={(e) => e.key === 'Enter' && commitPerPlate()}
            />
          )}
        </Field>
      </div>
      <div className="mt-4 rounded-xl border border-line bg-paper/80 p-3.5">
        <p
          className="tabular text-xs sm:text-sm text-ink leading-relaxed"
          data-testid="guest-impact"
        >
          {plan.guests} guests × {formatINR(Math.round(impact.perPlate))} per plate needs{' '}
          <strong>{formatINR(impact.requiredCatering)}</strong> for catering. You have budgeted{' '}
          <strong>{formatINR(impact.currentCatering)}</strong>
          {impact.overBy > 0 ? (
            <>
              :{' '}
              <span className="inline-flex items-center gap-1 font-bold text-warn">
                <Icon name="alert" className="h-3.5 w-3.5" />
                {formatINR(impact.overBy)} short.
              </span>
            </>
          ) : (
            '. That covers it.'
          )}
        </p>
      </div>
    </section>
  );
}
