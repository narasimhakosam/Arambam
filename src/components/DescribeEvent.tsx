import { useState, type KeyboardEvent } from 'react';
import type { IntakeParse } from '../schemas';
import { parseIntake, type RequestOptions } from '../lib/api';
import { useAiCall } from '../lib/useAiCall';
import { Icon } from './Icon';
import { AnswerMeta } from './ThinkingTrace';
import { AiError, AiLoading } from './ui';

export const EXAMPLE_EVENT =
  'Shaadi in Pune, 200 guests, 8 lakh budget, mid-Feb, simple ceremony but premium food';

/**
 * Free-text intake. Gemini reads the description; the parent decides which fields to fill and
 * returns their names so we can tell the user exactly what changed.
 */
export function DescribeEvent({ onParsed }: { onParsed: (result: IntakeParse) => string[] }) {
  const [description, setDescription] = useState('');
  const [filled, setFilled] = useState<string | null>(null);
  const ai = useAiCall((options: RequestOptions, text: string) => parseIntake(text, options));

  /** Tab on an empty box accepts the example, like ghost-text autocomplete in an editor. */
  function acceptExample(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== 'Tab' || event.shiftKey || description !== '') return;
    event.preventDefault();
    setDescription(EXAMPLE_EVENT);
  }

  async function fill() {
    setFilled(null);
    const result = await ai.run(description);
    if (!result) return;
    const found = onParsed(result);
    setFilled(
      found.length
        ? `Filled ${found.join(', ')}. Please check the details before creating your plan.`
        : 'We could not find event details in that text. You can fill the form below by hand.',
    );
  }

  return (
    <section
      className="card border-line/80 shadow-card lg:sticky lg:top-20"
      aria-labelledby="describe-h"
    >
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-soft text-accent">
          <Icon name="sparkle" className="h-4 w-4" />
        </span>
        <h2 id="describe-h" className="font-display text-lg font-bold tracking-tight text-ink">
          Describe your event
        </h2>
      </div>
      <p className="hint text-xs">
        Write it the way you would tell a friend. We will extract numbers and fill the form for you.
      </p>
      <label htmlFor="describe" className="sr-only">
        Event description
      </label>
      <div className="relative mt-3">
        <textarea
          id="describe"
          className="input min-h-28 text-sm leading-relaxed"
          maxLength={1000}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={EXAMPLE_EVENT}
          aria-describedby={description === '' ? 'describe-tab-hint' : undefined}
          onKeyDown={acceptExample}
        />
      </div>
      {description === '' && (
        <p id="describe-tab-hint" className="hint text-xs">
          Press{' '}
          <kbd className="rounded-md border border-line bg-card px-1.5 py-0.5 text-[11px] font-semibold text-ink shadow-sm">
            Tab
          </kbd>{' '}
          to use this example.
        </p>
      )}
      <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          className="btn-primary w-full sm:w-auto text-xs sm:text-sm"
          onClick={() => void fill()}
          disabled={description.trim() === '' || ai.state.status === 'loading'}
        >
          <Icon name="sparkle" className="h-4 w-4" />
          Fill form from description
        </button>
        <span className="text-[11px] font-medium text-ink-soft">
          {description.length}/1000 · AI suggestion
        </span>
      </div>
      <div className="mt-3" aria-live="polite">
        {ai.state.status === 'loading' && (
          <AiLoading label="Gemini is reading your description…" progress={ai.progress} />
        )}
        {ai.state.status === 'error' && (
          <AiError message={ai.state.message} onRetry={() => void fill()} />
        )}
        {filled && ai.state.status === 'done' && (
          <div className="rounded-xl border border-accent/25 bg-accent-soft/70 p-3.5 shadow-sm">
            <p className="text-xs font-semibold text-accent sm:text-sm">{filled}</p>
            <AnswerMeta progress={ai.progress} />
          </div>
        )}
      </div>
    </section>
  );
}
