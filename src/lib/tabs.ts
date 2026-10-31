import type { IconName } from '../components/Icon';

export const TABS = [
  { id: 'setup', label: 'Plan setup', icon: 'pencil', hint: 'Intake & presets' },
  { id: 'budget', label: 'Budget', icon: 'wallet', hint: 'Allocation & locks' },
  { id: 'timeline', label: 'Timeline', icon: 'route', hint: 'DAG & run sheet' },
  { id: 'vendors', label: 'Vendors', icon: 'store', hint: 'Quotes & compare' },
] as const satisfies readonly { id: string; label: string; icon: IconName; hint: string }[];

export type TabId = (typeof TABS)[number]['id'];
