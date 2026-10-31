import { useState } from 'react';
import { categoryLabel } from '../engine';
import {
  CategorySchema,
  CATEGORIES,
  MAX_QUOTES_PER_CATEGORY,
  type Category,
  type Plan,
  type Quote,
} from '../schemas';
import { extractQuote, type RequestOptions } from '../lib/api';
import { newId } from '../lib/id';
import { useAiCall } from '../lib/useAiCall';
import type { Action } from '../state/planStore';
import { Icon } from './Icon';
import { QuoteResult } from './QuoteResult';
import { AnswerMeta } from './ThinkingTrace';
import { AiError, AiLoading } from './ui';

const QUOTE_CATEGORIES = CATEGORIES.filter((c) => c !== 'contingency');

export function QuoteAnalyzer({
  plan,
  dispatch,
}: {
  plan: Plan;
  dispatch: (action: Action) => void;
}) {
  const [category, setCategory] = useState<Category>('catering');
  const [pasted, setPasted] = useState('');
  const [saved, setSaved] = useState<string | null>(null);
  const ai = useAiCall((options: RequestOptions, text: string, category: Category) =>
    extractQuote(text, category, options),
  );

  const result = ai.state.status === 'done' ? { ...ai.state.data, category } : null;
  const full = plan.quotes.filter((q) => q.category === category).length >= MAX_QUOTES_PER_CATEGORY;

  const analyze = () => {
    setSaved(null);
    return ai.run(pasted, category);
  };

  function save(quote: Quote, accept: boolean) {
    dispatch({ type: 'addQuote', quote, id: newId(), accept });
    setSaved(
      accept
        ? 'Quotation accepted. This category now shows a verified quotation.'
        : 'Saved for comparison.',
    );
    ai.reset();
    setPasted('');
  }

  return (
    <section className="card border-line/80 shadow-card" aria-labelledby="analyze-h">
      <div className="flex items-center gap-2 border-b border-line/60 pb-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-soft text-accent">
          <Icon name="file" className="h-4 w-4" />
        </span>
        <div>
          <h2 id="analyze-h" className="font-display text-lg font-bold text-ink sm:text-xl">
            Paste a vendor quotation
          </h2>
          <p className="hint text-xs">
            Copy the message or PDF text your vendor sent. We pull out the details and flag the fine
            print.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-4">
        <div>
          <label htmlFor="quote-cat" className="label text-xs sm:text-sm">
            What is this quotation for?
          </label>
          <select
            id="quote-cat"
            className="input font-medium"
            value={category}
            onChange={(e) => {
              const picked = CategorySchema.safeParse(e.target.value);
              if (picked.success) setCategory(picked.data);
            }}
          >
            {QUOTE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {categoryLabel(plan.occasion, c)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="quote-text" className="label text-xs sm:text-sm">
            Quotation text
          </label>
          <textarea
            id="quote-text"
            className="input min-h-36 font-sans text-sm leading-relaxed"
            maxLength={6000}
            value={pasted}
            onChange={(e) => setPasted(e.target.value)}
            placeholder="Paste the vendor's message, WhatsApp quote, or email text here…"
          />
          <p className="hint text-xs text-ink-soft">{pasted.length}/6000 characters</p>
        </div>
        <div>
          <button
            type="button"
            className="btn-primary w-full sm:w-auto text-xs sm:text-sm font-bold shadow-soft"
            disabled={pasted.trim() === '' || ai.state.status === 'loading'}
            onClick={() => void analyze()}
          >
            <Icon name="sparkle" className="h-4 w-4" />
            Analyze quotation
          </button>
        </div>
      </div>

      <div aria-live="polite" className="mt-4">
        {ai.state.status === 'loading' && (
          <AiLoading label="Gemini is reading the quotation…" progress={ai.progress} />
        )}
        {ai.state.status === 'error' && (
          <AiError message={ai.state.message} onRetry={() => void analyze()} />
        )}
        {ai.state.status === 'done' && <AnswerMeta progress={ai.progress} />}
        {saved && (
          <div className="rounded-xl border border-ok/25 bg-ok-soft p-3 text-xs sm:text-sm font-semibold text-ok shadow-sm">
            <p className="flex items-center gap-2">
              <Icon name="check" className="h-4 w-4 shrink-0" />
              {saved}
            </p>
          </div>
        )}
      </div>

      {result && (
        <QuoteResult
          quote={result}
          plan={plan}
          full={full}
          onSave={(accept) => save(result, accept)}
        />
      )}
    </section>
  );
}
