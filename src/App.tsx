import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { AssistantPanel } from './components/AssistantPanel';
import { BudgetTab } from './components/BudgetTab';
import { Header } from './components/Header';
import { Icon } from './components/Icon';
import { PlanMasthead } from './components/PlanMasthead';
import { PlanSetup } from './components/PlanSetup';
import { ProgressPanel } from './components/ProgressPanel';
import { PrintSummary } from './components/PrintSummary';
import { Sidebar } from './components/Sidebar';
import { TimelineTab } from './components/TimelineTab';
import { Toast } from './components/Toast';
import { EmptyState } from './components/ui';
import { TABS, type TabId } from './lib/tabs';
import { todayISO } from './lib/today';
import type { Plan } from './schemas';
import { loadInitial, safeStorage, usePlanStore, type InitialLoad } from './state/planStore';

const VendorsTab = lazy(() => import('./components/VendorsTab'));
const IdeasPanel = lazy(() => import('./components/IdeasPanel'));

function readInitial(): InitialLoad {
  return loadInitial(window.location.hash, safeStorage());
}

export default function App({
  initial,
  today: todayProp,
}: {
  initial?: InitialLoad;
  today?: string;
}) {
  const [boot] = useState<InitialLoad>(() => initial ?? readInitial());
  const [today] = useState(() => todayProp ?? todayISO());
  const { state, dispatch } = usePlanStore(boot);
  const [tab, setTab] = useState<TabId>(boot.plan ? 'budget' : 'setup');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [notice, setNotice] = useState(boot.notice);
  const [progressOpen, setProgressOpen] = useState(false);
  const [grabbed, setGrabbed] = useState<Plan | null>(null);
  const dismissToast = useCallback(() => dispatch({ type: 'dismissToast' }), [dispatch]);
  const plan = state.plan;

  useEffect(() => {
    if (!grabbed) return;
    const release = () => setGrabbed(null);
    document.addEventListener('pointerup', release);
    document.addEventListener('pointercancel', release);
    return () => {
      document.removeEventListener('pointerup', release);
      document.removeEventListener('pointercancel', release);
    };
  }, [grabbed]);

  const focusTitleNext = useRef(false);
  useEffect(() => {
    if (!focusTitleNext.current || !plan) return;
    focusTitleNext.current = false;
    document.getElementById('plan-title')?.focus();
  }, [plan]);

  const needPlan = (
    <EmptyState
      title="Create your celebration plan first to unlock this section."
      action="Go to Plan setup"
      onAction={() => setTab('setup')}
    />
  );

  const activeTabDef = TABS.find((t) => t.id === tab);

  return (
    <div className="min-h-screen bg-paper text-ink transition-colors duration-200 lg:flex">
      <a
        href="#main"
        className="sr-only-focusable no-print fixed left-3 top-3 z-50 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-on-accent shadow-elevated"
      >
        Skip to main content
      </a>

      <Sidebar
        tab={tab}
        onTabChange={setTab}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        plan={plan}
        onOpenProgress={() => setProgressOpen(true)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          plan={plan}
          activeTabLabel={activeTabDef?.label}
          onToggleSidebar={() => setMobileSidebarOpen((v) => !v)}
          onReset={() => {
            dispatch({ type: 'reset' });
            setTab('setup');
            if (window.location.hash)
              window.history.replaceState(null, '', window.location.pathname);
          }}
        />

        <main
          id="main"
          className="no-print mx-auto w-full max-w-5xl flex-1 px-4 pb-28 pt-6 sm:px-6 sm:pt-8"
          onPointerDownCapture={(event) => {
            if (plan && event.target instanceof HTMLInputElement && event.target.type === 'range') {
              setGrabbed(plan);
            }
          }}
        >
          {notice && (
            <div
              role="status"
              className={`mb-6 flex items-start justify-between gap-3 rounded-2xl border p-4 text-sm shadow-sm ${notice.kind === 'bad_link' ? 'border-warn/40 bg-warn-soft/90 text-warn' : 'border-line bg-accent-soft/80'}`}
            >
              <p className="flex items-center gap-2 font-medium">
                {notice.kind === 'bad_link' && (
                  <Icon name="alert" className="h-4 w-4 shrink-0 text-warn" />
                )}
                {notice.message}
              </p>
              <button
                type="button"
                className="btn-quiet shrink-0 text-xs"
                onClick={() => setNotice(null)}
              >
                Dismiss
              </button>
            </div>
          )}

          {plan && <PlanMasthead plan={plan} today={today} />}
          {plan && <AssistantPanel plan={grabbed ?? plan} today={today} onNavigate={setTab} />}

          <div
            role="tabpanel"
            id={`panel-${tab}`}
            aria-labelledby={`tab-${tab}`}
            tabIndex={0}
            className="panel-enter outline-none"
            key={tab}
          >
            {tab === 'setup' && (
              <div className="space-y-6">
                <PlanSetup
                  key={plan ? 'existing' : 'new'}
                  today={today}
                  existing={plan}
                  onCreate={(created) => {
                    focusTitleNext.current = true;
                    dispatch({ type: 'create', plan: created });
                    setTab('budget');
                  }}
                />
                {plan && (
                  <Suspense
                    fallback={
                      <p role="status" className="p-4 text-sm text-ink-soft">
                        Loading ideas…
                      </p>
                    }
                  >
                    <IdeasPanel plan={plan} />
                  </Suspense>
                )}
              </div>
            )}
            {tab === 'budget' && (plan ? <BudgetTab plan={plan} dispatch={dispatch} /> : needPlan)}
            {tab === 'timeline' &&
              (plan ? <TimelineTab plan={plan} today={today} dispatch={dispatch} /> : needPlan)}
            {tab === 'vendors' &&
              (plan ? (
                <Suspense
                  fallback={
                    <p role="status" className="p-4 text-sm text-ink-soft">
                      Loading vendors…
                    </p>
                  }
                >
                  <VendorsTab plan={plan} dispatch={dispatch} />
                </Suspense>
              ) : (
                needPlan
              ))}
          </div>
        </main>
      </div>

      {plan && (
        <ProgressPanel
          plan={plan}
          open={progressOpen}
          onToggle={() => setProgressOpen((v) => !v)}
          onNavigate={(next) => {
            setTab(next);
            setProgressOpen(false);
          }}
        />
      )}
      {plan && <PrintSummary plan={plan} today={today} />}
      <Toast toast={state.toast} occasion={plan?.occasion ?? 'wedding'} onDismiss={dismissToast} />
    </div>
  );
}
