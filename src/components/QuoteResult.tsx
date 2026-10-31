import { useState } from 'react';
import {
  categoryLabel,
  compareQuote,
  effectiveCost,
  formatINR,
  inquiryDraft,
  missingFields,
} from '../engine';
import { MAX_QUOTES_PER_CATEGORY, type Plan, type Quote } from '../schemas';
import { Icon } from './Icon';
import { QuoteFacts } from './QuoteFacts';

/** One analysed quote: facts, engine flags, cost against budget, inquiry draft and actions. */
export function QuoteResult({
  quote,
  plan,
  full,
  onSave,
}: {
  quote: Quote;
  plan: Plan;
  full: boolean;
  onSave: (accept: boolean) => void;
}) {
  const [copied, setCopied] = useState<'done' | 'failed' | null>(null);
  const flags = compareQuote(quote, plan);
  const missing = missingFields(quote);
  const cost = effectiveCost(quote, plan.guests);
  const draft = inquiryDraft(quote, plan);

  async function copyDraft() {
    try {
      await navigator.clipboard.writeText(draft);
      setCopied('done');
    } catch {
      setCopied('failed');
    }
  }

  return (
    <div
      className="mt-5 space-y-4 rounded-2xl border border-line/80 bg-paper/40 p-5 shadow-xs"
      data-testid="quote-result"
    >
      <div className="border-b border-line/60 pb-2">
        <h3 className="font-display text-base font-bold text-ink">
          What we found (AI extraction, please verify)
        </h3>
        <p className="text-xs text-ink-soft">
          Review structured facts before comparing or accepting.
        </p>
      </div>
      <QuoteFacts quote={quote} guests={plan.guests} />

      {cost !== null && (
        <div className="rounded-xl border border-accent/20 bg-accent-soft/50 p-3 text-xs sm:text-sm font-medium text-ink">
          Effective cost <strong className="font-bold text-accent">{formatINR(cost)}</strong>{' '}
          against a {categoryLabel(plan.occasion, quote.category)} budget of{' '}
          <strong>{formatINR(plan.allocation[quote.category])}</strong>.
        </div>
      )}

      <div
        role="status"
        aria-live="polite"
        className="rounded-xl border border-line bg-card p-3.5 shadow-xs"
      >
        <h4 className="text-xs font-bold uppercase tracking-wider text-ink-soft">
          Things to check
        </h4>
        {flags.length === 0 ? (
          <p className="mt-1 flex items-center gap-2 text-xs sm:text-sm font-semibold text-ok">
            <Icon name="check" className="h-4 w-4 shrink-0" />
            Nothing worrying found.
          </p>
        ) : (
          <ul className="mt-2 space-y-1.5 text-xs sm:text-sm">
            {flags.map((f) => (
              <li key={f.code} className="flex items-start gap-2 font-medium text-warn">
                <Icon name="alert" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{f.message}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {missing.length > 0 && (
        <p className="text-xs font-medium text-ink-soft">
          {missing.length} details are missing. Copy the message below to ask for exactly those.
        </p>
      )}

      <div className="flex flex-wrap gap-2.5 pt-2">
        <button
          type="button"
          className="btn-secondary text-xs sm:text-sm"
          onClick={() => void copyDraft()}
        >
          <Icon name="mail" className="h-4 w-4" />
          Copy inquiry message
        </button>
        <button
          type="button"
          className="btn-secondary text-xs sm:text-sm"
          disabled={full}
          onClick={() => onSave(false)}
        >
          Save for comparison
        </button>
        <button
          type="button"
          className="btn-primary text-xs sm:text-sm font-bold shadow-soft"
          disabled={full || cost === null}
          onClick={() => onSave(true)}
        >
          <Icon name="check" className="h-4 w-4" />
          Accept quotation
        </button>
      </div>
      {full && (
        <p className="text-xs text-ink-soft">
          You already have {MAX_QUOTES_PER_CATEGORY} quotations for this category. Remove one below
          to add another.
        </p>
      )}
      {cost === null && (
        <p className="text-xs text-ink-soft">
          A quotation needs a price before it can be accepted.
        </p>
      )}
      <div aria-live="polite">
        {copied === 'done' && (
          <div className="flex items-center gap-2 rounded-xl border border-ok/25 bg-ok-soft p-3 text-xs sm:text-sm font-semibold text-ok">
            <Icon name="check" className="h-4 w-4" />
            Message copied.
          </div>
        )}
        {copied === 'failed' && (
          <div className="rounded-xl border border-line bg-paper p-3 text-xs">
            <p className="font-semibold text-ink">
              Copy was blocked. Select the message below and copy it:
            </p>
            <textarea
              readOnly
              aria-label="Inquiry message"
              className="input mt-2 min-h-32 font-mono text-xs"
              value={draft}
            />
          </div>
        )}
      </div>
    </div>
  );
}
