import { useState } from 'react';
import { categoryLabel, type ScheduledTask } from '../engine';
import type { Occasion } from '../schemas';
import { formatDate } from '../lib/format';
import { Icon, type IconName } from './Icon';
import { Field } from './ui';

export interface TaskRowProps {
  task: ScheduledTask;
  occasion: Occasion;
  titles: Record<string, string>;
  pushedBy: string | null;
  onStatus: (id: string, status: 'todo' | 'done') => void;
  onDelay: (id: string, days: number) => void;
  onAssignee: (id: string, assignee: string) => void;
}

function Flag({ icon, text }: { icon: IconName; text: string }) {
  return (
    <span className="badge-warn">
      <Icon name={icon} className="h-3 w-3 shrink-0" /> {text}
    </span>
  );
}

export function TaskRow({
  task,
  occasion,
  titles,
  pushedBy,
  onStatus,
  onDelay,
  onAssignee,
}: TaskRowProps) {
  const [editing, setEditing] = useState(false);
  const [days, setDays] = useState(String(task.delayDays ?? 7));
  const done = task.status === 'done';
  const delayed = task.status === 'delayed';
  const shifted = task.effectiveDate !== task.dueDate;
  const problem =
    !done &&
    (task.flags.atRisk || task.flags.overdue || task.flags.impossible || task.flags.tooLate);
  const dayCount = Number(days);
  const daysValid = Number.isInteger(dayCount) && dayCount >= 1 && dayCount <= 365;
  const flagged = Boolean(pushedBy) || problem;

  return (
    <li
      className="relative pb-6 pl-9 last:pb-0"
      data-testid={`task-${task.id}`}
      data-affected={pushedBy ? 'true' : undefined}
    >
      <span
        aria-hidden="true"
        className={`absolute left-0 top-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 bg-card shadow-sm transition-colors ${
          done
            ? 'border-ok bg-ok text-on-accent'
            : flagged
              ? 'border-warn bg-warn-soft text-warn'
              : 'border-line text-ink-soft'
        }`}
      >
        {done ? (
          <Icon name="check" className="h-3.5 w-3.5" />
        ) : (
          <span className="h-1.5 w-1.5 rounded-full bg-ink-soft/40" />
        )}
      </span>

      <div
        className={`rounded-2xl border p-4 sm:p-5 transition-all duration-200 shadow-sm ${
          flagged
            ? 'border-warn/40 bg-warn-soft/40'
            : done
              ? 'border-line/60 bg-paper/40 opacity-80 hover:opacity-100'
              : 'border-line/80 bg-card hover:shadow-soft'
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h4
              className={`text-base font-bold ${done ? 'text-ink-soft line-through' : 'text-ink'}`}
            >
              {task.title}
            </h4>
            <p className="tabular mt-0.5 text-xs text-ink-soft sm:text-sm">
              <span className="font-medium text-ink">{categoryLabel(occasion, task.category)}</span>{' '}
              · Due {formatDate(task.dueDate)}
              {shifted && !done && (
                <span className="font-semibold text-warn">
                  {' '}
                  · Now expected {formatDate(task.effectiveDate)}
                </span>
              )}
            </p>
          </div>
          <span className={done ? 'badge-verified' : 'badge-estimate'}>
            {done && <Icon name="check" className="h-3 w-3" />}
            {done ? 'Done' : delayed ? `Delayed ${task.delayDays} days` : 'To do'}
          </span>
        </div>

        {flagged && (
          <div className="mt-2.5 flex flex-wrap gap-2">
            {pushedBy && <Flag icon="alert" text={`Pushed by delay in "${pushedBy}"`} />}
            {task.flags.overdue && !done && <Flag icon="clock" text="Overdue" />}
            {task.flags.tooLate && !task.flags.overdue && !done && (
              <Flag icon="clock" text="Due date already passed" />
            )}
            {task.flags.atRisk && !pushedBy && !done && <Flag icon="alert" text="At risk" />}
            {task.flags.impossible && !done && (
              <Flag icon="stop" text="Cannot finish before the event" />
            )}
          </div>
        )}

        {task.dependsOn.length > 0 && (
          <p className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-ink-soft">Needs:</span>
            {task.dependsOn.map((d) => (
              <span
                key={d}
                className="rounded-full border border-line bg-paper px-2.5 py-0.5 text-xs font-medium text-ink shadow-xs"
              >
                {titles[d] ?? d}
              </span>
            ))}
          </p>
        )}

        <div className="mt-3.5 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end border-t border-line/50 pt-3">
          <Field label="Assignee">
            {(p) => (
              <input
                {...p}
                className="input !min-h-9 !py-1.5 text-xs"
                maxLength={60}
                placeholder="Who is handling this?"
                value={task.assignee ?? ''}
                onChange={(e) => onAssignee(task.id, e.target.value)}
              />
            )}
          </Field>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={`btn-secondary !min-h-9 !px-3 text-xs font-semibold ${done ? 'bg-paper text-ink-soft' : ''}`}
              aria-pressed={done}
              onClick={() => onStatus(task.id, done ? 'todo' : 'done')}
            >
              {done ? 'Mark as to do' : 'Done'}
            </button>
            {!done && !editing && (
              <button
                type="button"
                className="btn-secondary !min-h-9 !px-3 text-xs font-semibold"
                onClick={() => setEditing(true)}
              >
                {delayed ? 'Change delay' : 'Mark delayed'}
              </button>
            )}
          </div>
        </div>

        {editing && !done && (
          <div className="mt-3 flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-paper p-4 shadow-sm">
            <Field label="Delayed by (days)" error={daysValid ? null : 'Enter 1 to 365 days.'}>
              {(p) => (
                <input
                  {...p}
                  className="input !min-h-9 w-32 font-bold"
                  type="number"
                  min={1}
                  max={365}
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                />
              )}
            </Field>
            <button
              type="button"
              className="btn-primary !min-h-9 text-xs"
              disabled={!daysValid}
              onClick={() => {
                onDelay(task.id, dayCount);
                setEditing(false);
              }}
            >
              Apply delay
            </button>
            {delayed && (
              <button
                type="button"
                className="btn-secondary !min-h-9 text-xs"
                onClick={() => {
                  onDelay(task.id, 0);
                  setEditing(false);
                }}
              >
                Clear delay
              </button>
            )}
            <button
              type="button"
              className="btn-quiet !min-h-9 text-xs"
              onClick={() => setEditing(false)}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </li>
  );
}
