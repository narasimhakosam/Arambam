import { useRef, type KeyboardEvent } from 'react';
import { planReadiness } from '../engine';
import { BRANDING } from '../lib/branding';
import { TABS, type TabId } from '../lib/tabs';
import type { Plan } from '../schemas';
import { BrandMark, Icon } from './Icon';

interface SidebarProps {
  tab: TabId;
  onTabChange: (tab: TabId) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  plan: Plan | null;
  onOpenProgress?: () => void;
}

export function Sidebar({
  tab,
  onTabChange,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  plan,
  onOpenProgress,
}: SidebarProps) {
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const readiness = plan ? planReadiness(plan) : null;

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const index = TABS.findIndex((t) => t.id === tab);
    let next = index;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      next = (index + 1) % TABS.length;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      next = (index - 1 + TABS.length) % TABS.length;
    } else if (event.key === 'Home') {
      next = 0;
    } else if (event.key === 'End') {
      next = TABS.length - 1;
    } else {
      return;
    }
    event.preventDefault();
    const target = TABS[next];
    if (target) {
      onTabChange(target.id);
      tabRefs.current[target.id]?.focus();
    }
  }

  const content = (
    <aside
      aria-label="Application navigation"
      className={`no-print flex h-full flex-col justify-between border-r border-line/80 bg-card/95 transition-all duration-300 ease-in-out ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div>
        {/* Brand header & Collapse toggle */}
        <div className="flex h-16 items-center justify-between border-b border-line/80 px-3.5">
          <div className="flex items-center gap-3 overflow-hidden">
            <BrandMark className="h-8 w-8 shrink-0" />
            {!collapsed && (
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-display text-base font-bold tracking-tight text-ink">
                    {BRANDING.PRODUCT_NAME}
                  </span>
                  <span className="rounded-full bg-accent-soft px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider text-accent">
                    Pro
                  </span>
                </div>
                <p className="truncate text-[11px] text-ink-soft">Celebration Suite</p>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden rounded-lg p-1.5 text-ink-soft hover:bg-paper hover:text-ink lg:flex"
          >
            <Icon name={collapsed ? 'chevronRight' : 'chevronLeft'} className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation Tablist */}
        <nav className="p-3">
          <div
            role="tablist"
            aria-label="Plan sections"
            aria-orientation="vertical"
            className="flex flex-col gap-1.5"
          >
            {TABS.map((t) => {
              const isSelected = tab === t.id;
              return (
                <button
                  key={t.id}
                  ref={(el) => {
                    tabRefs.current[t.id] = el;
                  }}
                  role="tab"
                  type="button"
                  id={`tab-${t.id}`}
                  aria-selected={isSelected}
                  aria-controls={`panel-${t.id}`}
                  tabIndex={isSelected ? 0 : -1}
                  title={t.label}
                  className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-150 ${
                    isSelected
                      ? 'bg-accent-soft/80 font-semibold text-accent shadow-sm'
                      : 'text-ink-soft hover:bg-paper hover:text-ink'
                  } ${collapsed ? 'justify-center !px-2' : ''}`}
                  onClick={() => {
                    onTabChange(t.id);
                    onCloseMobile();
                  }}
                  onKeyDown={onKeyDown}
                >
                  {/* Active vertical glow indicator */}
                  {isSelected && (
                    <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-accent" />
                  )}
                  <Icon
                    name={t.icon}
                    className={`h-5 w-5 shrink-0 transition-transform group-hover:scale-110 ${
                      isSelected ? 'text-accent' : 'text-ink-soft group-hover:text-ink'
                    }`}
                  />
                  {collapsed ? (
                    <span className="sr-only">{t.label}</span>
                  ) : (
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="truncate text-sm font-semibold">{t.label}</span>
                        {plan && t.id === 'timeline' && (
                          <span
                            aria-hidden="true"
                            className="rounded-full bg-paper px-1.5 py-0.5 text-[10px] font-bold text-ink-soft"
                          >
                            {plan.tasks.filter((tk) => tk.status !== 'done').length}
                          </span>
                        )}
                        {plan && t.id === 'vendors' && (
                          <span
                            aria-hidden="true"
                            className="rounded-full bg-paper px-1.5 py-0.5 text-[10px] font-bold text-ink-soft"
                          >
                            {plan.quotes.length}
                          </span>
                        )}
                      </div>
                      <p
                        aria-hidden="true"
                        className="truncate text-[11px] font-normal text-ink-soft/90"
                      >
                        {t.hint}
                      </p>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Sidebar bottom summary card */}
      {plan && readiness && !collapsed && (
        <div className="p-3 border-t border-line/80">
          <div className="rounded-xl border border-line bg-paper/70 p-3 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-ink">Readiness</span>
              <span className="text-accent">{readiness.percent}%</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-line/80">
              <div
                className="h-full rounded-full bg-accent transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, readiness.percent))}%` }}
              />
            </div>
            {onOpenProgress && (
              <button
                type="button"
                onClick={onOpenProgress}
                className="mt-2.5 w-full rounded-lg bg-card py-1 text-center text-[11px] font-medium text-ink-soft hover:text-ink hover:bg-line/40 transition-colors"
              >
                View checklist drawer →
              </button>
            )}
          </div>
        </div>
      )}
    </aside>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <div className="hidden lg:block shrink-0 sticky top-0 h-screen">{content}</div>

      {/* Mobile / Tablet Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 flex w-64 max-w-[80vw] flex-col bg-card shadow-2xl">
            <div className="absolute right-2 top-3">
              <button
                type="button"
                onClick={onCloseMobile}
                aria-label="Close sidebar"
                className="rounded-lg p-2 text-ink-soft hover:bg-paper hover:text-ink"
              >
                <Icon name="x" className="h-5 w-5" />
              </button>
            </div>
            {content}
          </div>
        </div>
      )}
    </>
  );
}
