import { useEffect, useRef } from 'react';
import { Icon } from './Icon';

export interface FieldError {
  /** Id of the input the message belongs to. */
  fieldId: string;
  message: string;
}

/**
 * GOV.UK-style error summary: after a failed submit it takes focus, says how many things need
 * fixing, and links straight to each field. `attempt` changes on every failed submit.
 */
export function ErrorSummary({ errors, attempt }: { errors: FieldError[]; attempt: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (attempt > 0) ref.current?.focus();
  }, [attempt]);

  if (attempt === 0 || errors.length === 0) return null;
  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="alert"
      aria-labelledby="error-summary-h"
      className="rounded-2xl border border-warn/40 bg-warn-soft/90 p-5 text-warn shadow-sm outline-none"
    >
      <h3 id="error-summary-h" className="flex items-center gap-2.5 text-base font-bold text-warn">
        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-warn/15">
          <Icon name="alert" className="h-4 w-4" />
        </span>
        Please fix {errors.length} {errors.length === 1 ? 'thing' : 'things'} to create your plan
      </h3>
      <ul className="mt-3 list-disc space-y-1.5 pl-6 text-sm">
        {errors.map((error) => (
          <li key={error.fieldId}>
            <a
              href={`#${error.fieldId}`}
              className="font-semibold underline underline-offset-2 transition-opacity hover:opacity-80"
              onClick={(event) => {
                event.preventDefault();
                document.getElementById(error.fieldId)?.focus();
              }}
            >
              {error.message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
