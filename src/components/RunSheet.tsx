import { RUN_SHEETS } from '../engine';
import type { Occasion } from '../schemas';

/** The day itself, in order. Suggested times only; families adjust them to their muhurat. */
export function RunSheet({ occasion }: { occasion: Occasion }) {
  return (
    <section className="card border-line/80 shadow-card" aria-labelledby="runsheet-h">
      <div className="border-b border-line/60 pb-3">
        <h3
          id="runsheet-h"
          className="font-display text-lg font-bold tracking-tight text-ink sm:text-xl"
        >
          On the day: suggested run sheet
        </h3>
        <p className="hint text-xs">
          Typical timings to share with family and vendors. Adjust them to your muhurat and venue
          slot.
        </p>
      </div>
      <ol className="mt-4 divide-y divide-line/60 rounded-xl border border-line/60 bg-card">
        {RUN_SHEETS[occasion].map((item) => (
          <li
            key={item.time}
            className="flex items-center gap-4 px-4 py-3 text-xs sm:text-sm transition-colors hover:bg-paper/50"
          >
            <time className="tabular flex w-20 shrink-0 items-center justify-center rounded-lg border border-accent/20 bg-accent-soft px-2.5 py-1 text-xs font-bold text-accent">
              {item.time}
            </time>
            <span className="font-medium text-ink">{item.title}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
