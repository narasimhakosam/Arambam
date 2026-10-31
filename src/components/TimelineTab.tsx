import { useMemo } from 'react';
import {
  affectedByDelays,
  buildSchedule,
  compressTasks,
  scheduleCompression,
  diffDays,
  phaseFor,
  timelineToIcs,
  ScheduleError,
  type ScheduledTask,
} from '../engine';
import type { Plan } from '../schemas';
import { downloadText } from '../lib/download';
import { formatDate } from '../lib/format';
import type { Action } from '../state/planStore';
import { Icon } from './Icon';
import { RunSheet } from './RunSheet';
import { TaskRow } from './TaskRow';

const EMPTY: ScheduledTask[] = [];

export function TimelineTab({
  plan,
  today,
  dispatch,
}: {
  plan: Plan;
  today: string;
  dispatch: (action: Action) => void;
}) {
  const result = useMemo(() => {
    try {
      return { schedule: buildSchedule(plan.tasks, plan.eventDate, today), error: null };
    } catch (error) {
      return {
        schedule: EMPTY,
        error: error instanceof ScheduleError ? error.message : 'The timeline could not be built.',
      };
    }
  }, [plan.tasks, plan.eventDate, today]);
  const affected = useMemo(() => {
    try {
      return affectedByDelays(compressTasks(plan.tasks, plan.eventDate, today));
    } catch {
      return {};
    }
  }, [plan.tasks, plan.eventDate, today]);
  const compression = useMemo(
    () => scheduleCompression(plan.tasks, plan.eventDate, today),
    [plan.tasks, plan.eventDate, today],
  );
  const titles = useMemo(
    () => Object.fromEntries(plan.tasks.map((t) => [t.id, t.title])),
    [plan.tasks],
  );

  const groups = useMemo(() => {
    const map = new Map<number, { label: string; tasks: ScheduledTask[] }>();
    for (const task of result.schedule) {
      const phase = phaseFor(task.leadDays);
      const group = map.get(phase.order) ?? { label: phase.label, tasks: [] };
      group.tasks.push(task);
      map.set(phase.order, group);
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]).map(([order, g]) => ({ order, ...g }));
  }, [result.schedule]);

  const daysToEvent = diffDays(today, plan.eventDate);
  const problems = result.schedule.filter(
    (t) => t.status !== 'done' && (t.flags.atRisk || t.flags.overdue || t.flags.impossible),
  ).length;

  if (result.error) {
    return (
      <div role="alert" className="card border-warn/40 bg-warn-soft/90 text-warn shadow-card">
        <p className="flex items-center gap-2.5 font-bold">
          <Icon name="alert" className="h-5 w-5" />
          {result.error}
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <section className="card shadow-card" aria-labelledby="tl-h">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/60 pb-3">
          <div>
            <h2 id="tl-h" className="font-display text-lg font-bold text-ink sm:text-xl">
              Your timeline
            </h2>
            <p className="mt-0.5 text-xs text-ink-soft sm:text-sm">
              Event on <strong>{formatDate(plan.eventDate)}</strong>
              {daysToEvent > 0
                ? ` · ${daysToEvent} days to go`
                : daysToEvent === 0
                  ? ' · today'
                  : ' · this date has passed'}
            </p>
          </div>
          <div
            role="status"
            aria-live="polite"
            className="text-xs font-bold uppercase tracking-wider [&>span]:flex [&>span]:items-center [&>span]:gap-1.5"
          >
            {problems > 0 ? (
              <span className="rounded-full border border-warn/30 bg-warn-soft px-3 py-1 text-warn shadow-sm">
                <Icon name="alert" className="h-3.5 w-3.5" />
                {problems} {problems === 1 ? 'task needs' : 'tasks need'} attention
              </span>
            ) : (
              <span className="rounded-full border border-ok/30 bg-ok-soft px-3 py-1 text-ok shadow-sm">
                <Icon name="check" className="h-3.5 w-3.5" />
                On track
              </span>
            )}
          </div>
        </div>
        <p className="hint text-xs">
          Delay a task and everything that depends on it moves automatically through the DAG
          scheduler.
        </p>
        {compression.compressed && (
          <p
            className="mt-3 flex items-start gap-2.5 rounded-2xl border border-accent/25 bg-accent-soft/80 p-3.5 text-xs text-ink sm:text-sm"
            data-testid="compressed-note"
          >
            <Icon name="clock" className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <span className="leading-relaxed">
              Your event is {compression.availableDays} days away, sooner than the usual{' '}
              {compression.spanDays}-day plan, so every task has been pulled closer in the same
              order. Dates are tighter than usual.
            </span>
          </p>
        )}
        <div className="mt-4 pt-3 border-t border-line/60">
          <button
            type="button"
            className="btn-secondary text-xs sm:text-sm"
            onClick={() =>
              downloadText(
                `arambam-${plan.occasion}-${plan.eventDate}.ics`,
                timelineToIcs(plan, result.schedule, today),
                'text/calendar;charset=utf-8',
              )
            }
          >
            <Icon name="calendar" className="h-4 w-4 text-accent" />
            Add timeline to calendar (.ics)
          </button>
        </div>
      </section>

      {groups.map((g) => (
        <section key={g.order} aria-labelledby={`phase-${g.order}`}>
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-soft text-xs font-bold text-accent">
              {g.order}
            </span>
            <h3
              id={`phase-${g.order}`}
              className="font-display text-lg font-bold tracking-tight text-ink sm:text-xl"
            >
              {g.label}
            </h3>
            <span className="ml-auto text-xs font-semibold text-ink-soft">
              {g.tasks.length} {g.tasks.length === 1 ? 'task' : 'tasks'}
            </span>
          </div>
          <ul className="relative before:absolute before:bottom-3 before:left-[11px] before:top-3 before:w-0.5 before:bg-line/80 before:content-['']">
            {g.tasks.map((task) => {
              const cause = affected[task.id];
              return (
                <TaskRow
                  key={task.id}
                  task={task}
                  occasion={plan.occasion}
                  titles={titles}
                  pushedBy={cause ? (titles[cause] ?? null) : null}
                  onStatus={(id, status) => dispatch({ type: 'setTaskStatus', id, status })}
                  onDelay={(id, days) => dispatch({ type: 'setDelay', id, days })}
                  onAssignee={(id, assignee) => dispatch({ type: 'setAssignee', id, assignee })}
                />
              );
            })}
          </ul>
        </section>
      ))}

      <RunSheet occasion={plan.occasion} />
    </div>
  );
}
