import { useEffect, useRef } from 'react';
import { planReadiness, vendorChecklist, VENDOR_STATUS_LABELS } from '../engine';
import type { Plan } from '../schemas';
import { Icon } from './Icon';

const TASK_LABEL = { todo: 'To do', done: 'Done', delayed: 'Delayed' } as const;

function Tick({ done, warn = false }: { done: boolean; warn?: boolean }) {
  return done ? (
    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ok text-on-accent shadow-xs">
      <Icon name="check" className="h-3 w-3" />
    </div>
  ) : (
    <div
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
        warn ? 'border-warn bg-warn-soft text-warn' : 'border-line text-ink-soft'
      }`}
    >
      <Icon name={warn ? 'alert' : 'circle'} className="h-3 w-3" />
    </div>
  );
}

/**
 * Everything still open, in one place: timeline tasks and vendor quotations, each with a text
 * status (never colour alone). A drawer the family can open from any tab and hide again.
 */
export function ProgressPanel({
  plan,
  open,
  onToggle,
  onNavigate,
}: {
  plan: Plan;
  open: boolean;
  onToggle: () => void;
  onNavigate: (tab: 'timeline' | 'vendors') => void;
}) {
  const readiness = planReadiness(plan);
  const vendors = vendorChecklist(plan);
  const tasks = [...plan.tasks].sort(
    (a, b) => Number(a.status === 'done') - Number(b.status === 'done'),
  );
  const toggleRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onToggle();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onToggle]);

  useEffect(() => {
    if (open) closeRef.current?.focus();
    else if (wasOpen.current) toggleRef.current?.focus();
    wasOpen.current = open;
  }, [open]);

  return (
    <>
      <button
        ref={toggleRef}
        type="button"
        className="no-print fixed bottom-6 left-6 z-40 flex min-h-11 items-center gap-2.5 rounded-full border border-line/80 bg-card/95 px-5 py-2.5 text-xs sm:text-sm font-bold text-ink shadow-elevated backdrop-blur-md transition-all duration-150 hover:border-accent/40 hover:shadow-soft active:scale-95"
        aria-expanded={open}
        aria-controls="progress-panel"
        onClick={onToggle}
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-soft text-accent">
          <Icon name="route" className="h-3.5 w-3.5" />
        </span>
        <span>Progress {readiness.percent}%</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-ink/20 backdrop-blur-xs transition-opacity"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}

      <aside
        id="progress-panel"
        aria-label="Plan progress"
        hidden={!open}
        className={`no-print fixed inset-y-0 left-0 z-50 ${open ? 'flex' : 'hidden'} w-[min(24rem,100vw)] flex-col border-r border-line/80 bg-card shadow-2xl transition-transform duration-200`}
      >
        <div className="flex items-center justify-between gap-2 border-b border-line/70 px-5 py-4 bg-paper/40">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent-soft text-accent">
              <Icon name="route" className="h-3.5 w-3.5" />
            </span>
            <h2 className="font-display text-lg font-bold text-ink">Plan progress</h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="btn-secondary !min-h-9 !px-3 text-xs"
            onClick={onToggle}
          >
            <Icon name="x" className="h-3.5 w-3.5" />
            Hide
          </button>
        </div>
        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          <div className="rounded-2xl border border-line/80 bg-paper/60 p-4 shadow-xs">
            <p className="text-sm font-semibold text-ink">
              <strong>{readiness.percent}% ready.</strong>
            </p>
            <p className="mt-0.5 text-xs text-ink-soft">
              {readiness.tasksDone} of {readiness.tasksTotal} tasks done, {readiness.quotesVerified}{' '}
              of {readiness.quotesTotal} vendors confirmed.
            </p>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-line/80">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent to-accent-dark transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, readiness.percent))}%` }}
              />
            </div>
          </div>

          <section aria-labelledby="progress-vendors">
            <div className="flex items-center justify-between gap-2 border-b border-line/60 pb-2">
              <h3 id="progress-vendors" className="font-display text-sm font-bold text-ink">
                Vendors and quotations
              </h3>
              <button
                type="button"
                className="btn-quiet text-xs font-semibold"
                onClick={() => onNavigate('vendors')}
              >
                Open
              </button>
            </div>
            <ul className="mt-3 space-y-2.5">
              {vendors.map((item) => (
                <li
                  key={item.category}
                  className="flex items-start gap-2.5 rounded-xl border border-line/60 bg-paper/30 p-2.5 text-xs transition-colors hover:bg-paper/70"
                >
                  <Tick done={item.status === 'quote_accepted'} />
                  <span className="min-w-0 flex-1">
                    <span className="font-semibold text-ink">{item.label}</span>
                    <span className="block text-[11px] text-ink-soft">
                      {VENDOR_STATUS_LABELS[item.status]}
                      {item.quotes > 0 && ` · ${item.quotes} saved`}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="progress-tasks">
            <div className="flex items-center justify-between gap-2 border-b border-line/60 pb-2">
              <h3 id="progress-tasks" className="font-display text-sm font-bold text-ink">
                Timeline tasks
              </h3>
              <button
                type="button"
                className="btn-quiet text-xs font-semibold"
                onClick={() => onNavigate('timeline')}
              >
                Open
              </button>
            </div>
            <ul className="mt-3 space-y-2.5">
              {tasks.map((task) => (
                <li
                  key={task.id}
                  className="flex items-start gap-2.5 rounded-xl border border-line/60 bg-paper/30 p-2.5 text-xs transition-colors hover:bg-paper/70"
                >
                  <Tick done={task.status === 'done'} warn={task.status === 'delayed'} />
                  <span className="min-w-0 flex-1">
                    <span
                      className={`font-semibold ${task.status === 'done' ? 'text-ink-soft line-through' : 'text-ink'}`}
                    >
                      {task.title}
                    </span>
                    <span className="block text-[11px] text-ink-soft">
                      {TASK_LABEL[task.status]}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </aside>
    </>
  );
}
