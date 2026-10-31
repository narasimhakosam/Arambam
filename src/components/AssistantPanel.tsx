import { useMemo, useState } from 'react';
import {
  diffDays,
  planInsights,
  type Insight,
  type InsightSeverity,
  type InsightTab,
} from '../engine';
import type { Plan } from '../schemas';
import { reviewPlan, type RequestOptions } from '../lib/api';
import { useAiCall } from '../lib/useAiCall';
import { AskPlanner } from './AskPlanner';
import { Icon, type IconName } from './Icon';
import { AnswerMeta } from './ThinkingTrace';
import { AiError, AiLoading } from './ui';

const SEVERITY: Record<
  InsightSeverity,
  { label: string; icon: IconName; tone: string; bg: string }
> = {
  critical: {
    label: 'Urgent',
    icon: 'alert',
    tone: 'text-warn',
    bg: 'bg-warn-soft/90 border-warn/30',
  },
  warning: {
    label: 'Needs attention',
    icon: 'clock',
    tone: 'text-warn',
    bg: 'bg-warn-soft/60 border-warn/25',
  },
  suggestion: {
    label: 'Suggestion',
    icon: 'sparkle',
    tone: 'text-accent',
    bg: 'bg-accent-soft/70 border-accent/25',
  },
};

const TAB_LABEL: Record<InsightTab, string> = {
  budget: 'Budget',
  timeline: 'Timeline',
  vendors: 'Vendors',
};

const COLLAPSED = 3;

function InsightRow({
  insight,
  onNavigate,
}: {
  insight: Insight;
  onNavigate: (tab: InsightTab) => void;
}) {
  const s = SEVERITY[insight.severity];
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-xl p-3 transition-colors hover:bg-paper/70">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div
          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${s.bg}`}
        >
          <Icon name={s.icon} className={`h-4 w-4 ${s.tone}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-ink">
            <span
              className={`mr-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${s.bg} ${s.tone}`}
            >
              {s.label}
            </span>
            {insight.title}
          </p>
          <p className="mt-0.5 text-xs text-ink-soft sm:text-sm">{insight.detail}</p>
        </div>
      </div>
      <button
        type="button"
        className="btn-quiet shrink-0 !px-3 text-xs font-semibold"
        onClick={() => onNavigate(insight.tab)}
      >
        Open {TAB_LABEL[insight.tab]}
      </button>
    </li>
  );
}

/**
 * The planning assistant. The engine decides what needs attention (deterministic, instant, works
 * offline); Gemini can then turn those facts into a short, prioritised review on request.
 */
export function AssistantPanel({
  plan,
  today,
  onNavigate,
}: {
  plan: Plan;
  today: string;
  onNavigate: (tab: InsightTab) => void;
}) {
  const insights = useMemo(() => planInsights(plan, today), [plan, today]);
  const [expanded, setExpanded] = useState(false);
  const ai = useAiCall((options: RequestOptions, request: Parameters<typeof reviewPlan>[0]) =>
    reviewPlan(request, options),
  );
  const shown = expanded ? insights : insights.slice(0, COLLAPSED);
  const urgent = insights.filter((i) => i.severity !== 'suggestion').length;

  const askAi = () =>
    ai.run({
      occasion: plan.occasion,
      guests: plan.guests,
      totalBudget: plan.totalBudget,
      daysToEvent: diffDays(today, plan.eventDate),
      vibe: plan.vibe,
      insights: insights
        .slice(0, 10)
        .map(({ severity, title, detail }) => ({ severity, title, detail })),
    });

  return (
    <section className="card mb-6 shadow-card" aria-labelledby="assistant-h">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2
            id="assistant-h"
            className="flex items-center gap-2 font-display text-lg font-bold tracking-tight text-ink sm:text-xl"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-soft text-accent">
              <Icon name="sparkle" className="h-4 w-4" />
            </span>
            Your planning assistant
          </h2>
          <p className="hint text-xs sm:text-sm" aria-live="polite">
            {urgent > 0
              ? `${urgent} ${urgent === 1 ? 'thing needs' : 'things need'} your attention.`
              : 'Nothing urgent. Here is what to do next.'}
          </p>
        </div>
        <button
          type="button"
          className="btn-secondary text-xs sm:text-sm"
          onClick={() => void askAi()}
          disabled={insights.length === 0 || ai.state.status === 'loading'}
        >
          <Icon name="sparkle" className="h-4 w-4 text-accent" />
          {ai.state.status === 'done' ? 'Refresh AI review' : 'Ask AI for a plan review'}
        </button>
      </div>

      {insights.length === 0 ? (
        <p className="mt-3 flex items-center gap-2 text-sm font-medium text-ok">
          <Icon name="check" />
          Everything is on track.
        </p>
      ) : (
        <ul
          className="mt-3 divide-y divide-line/60 rounded-xl border border-line/60 bg-card"
          aria-label="What needs attention"
        >
          {shown.map((insight) => (
            <InsightRow key={insight.id} insight={insight} onNavigate={onNavigate} />
          ))}
        </ul>
      )}
      {insights.length > COLLAPSED && (
        <button
          type="button"
          className="btn-quiet mt-2 text-xs font-semibold"
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? 'Show less' : `Show all ${insights.length}`}
        </button>
      )}

      <div aria-live="polite" className="mt-3">
        {ai.state.status === 'loading' && (
          <AiLoading label="Gemini is reviewing your plan…" progress={ai.progress} />
        )}
        {ai.state.status === 'error' && (
          <AiError message={ai.state.message} onRetry={() => void askAi()} />
        )}
        {ai.state.status === 'done' && (
          <div
            className="rounded-2xl border border-accent/25 bg-accent-soft/70 p-5 shadow-sm"
            data-testid="ai-review"
          >
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent">
              <Icon name="sparkle" className="h-3.5 w-3.5" />
              Executive AI Plan Synthesis
            </div>
            <p className="mt-2 text-sm font-medium leading-relaxed text-ink">
              {ai.state.data.summary}
            </p>
            <ol className="mt-4 list-decimal space-y-2.5 pl-5 text-sm text-ink">
              {ai.state.data.steps.map((step) => (
                <li key={step.title} className="leading-relaxed">
                  <span className="font-bold text-ink">{step.title}.</span>{' '}
                  <span className="text-ink-soft">{step.why}</span>
                </li>
              ))}
            </ol>
            <p className="mt-4 border-t border-accent/20 pt-2 text-xs text-ink-soft">
              AI review of the facts above. It never adds prices, dates or vendors.
            </p>
            <AnswerMeta progress={ai.progress} />
          </div>
        )}
      </div>
      <AskPlanner plan={plan} today={today} />
    </section>
  );
}
