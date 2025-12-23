// Backlog Tab Module
// Barrel exports for backlog tab components

// Main component
export { BacklogTabContent } from './backlog-tab-content';

// Sub-tabs
export { BacklogView } from './sub-tabs/backlog-view';

// Components
export { SprintSection } from './components/sprint-section';
export { BacklogSection } from './components/backlog-section';
export { BacklogToolbar } from './components/backlog-toolbar';
export { HistoriaTable } from './components/historia-table';
export { HistoriaFormModal } from './components/historia-form-modal';
export { SprintFormModal } from './components/sprint-form-modal';
export { SprintAssignModal } from './components/sprint-assign-modal';
export { HistoriaDetailModal } from './components/historia-detail-modal';

// Hooks
export { useBacklogData } from './hooks/use-backlog-data';
export type { SprintWithHistorias, UseBacklogDataReturn } from './hooks/use-backlog-data';
