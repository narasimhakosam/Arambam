import { categoryLabel } from '../engine';
import { CATEGORIES, type Category, type Occasion } from '../schemas';
import { Field } from './ui';

const PRIORITY_CATEGORIES = CATEGORIES.filter((c) => c !== 'contingency');

/** The optional part of the intake: style and the categories that matter most. */
export function PlanExtras({
  occasion,
  vibe,
  priorities,
  onVibe,
  onPriorities,
}: {
  occasion: Occasion;
  vibe: string;
  priorities: Category[];
  onVibe: (vibe: string) => void;
  onPriorities: (priorities: Category[]) => void;
}) {
  function toggle(category: Category) {
    onPriorities(
      priorities.includes(category)
        ? priorities.filter((c) => c !== category)
        : [...priorities, category],
    );
  }

  return (
    <details className="group rounded-2xl border border-line/80 bg-card p-5 shadow-sm transition-all duration-200">
      <summary className="flex min-h-11 cursor-pointer select-none items-center justify-between font-semibold text-ink hover:text-accent">
        <span>Make it yours (optional)</span>
        <span className="text-xs font-normal text-ink-soft group-open:rotate-180 transition-transform">
          ▼
        </span>
      </summary>
      <div className="mt-4 space-y-5 border-t border-line/60 pt-4">
        <Field label="Style or vibe" hint="For example: traditional, minimal, fun for kids.">
          {(p) => (
            <input
              {...p}
              className="input"
              maxLength={200}
              placeholder="e.g. Royal Marwari with modern floral accents"
              value={vibe}
              onChange={(e) => onVibe(e.target.value)}
            />
          )}
        </Field>
        <fieldset>
          <legend className="label mb-2">
            What matters most? We give these categories more of the budget.
          </legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {PRIORITY_CATEGORIES.map((c) => (
              <label
                key={c}
                className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border p-2.5 text-sm font-medium transition-colors ${
                  priorities.includes(c)
                    ? 'border-accent/40 bg-accent-soft/70 text-accent font-semibold'
                    : 'border-line/70 hover:bg-paper'
                }`}
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded accent-accent"
                  checked={priorities.includes(c)}
                  onChange={() => toggle(c)}
                />
                <span>{categoryLabel(occasion, c)}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>
    </details>
  );
}
