/**
 * components/ui/index.js
 * Barrel export do Design System CREESER.
 *
 * Uso:
 *   import { StatusBadge, DashboardCard, PageHeader } from '@/components/ui';
 */

export { default as StatusBadge,    BADGE_VARIANTS }      from './StatusBadge';
export { default as DashboardCard }                        from './DashboardCard';
export { default as ActionButton }                         from './ActionButton';
export { default as EmptyState }                           from './EmptyState';
export { default as LoadingSkeleton,
         SkeletonCard, SkeletonTable,
         SkeletonTableRow, SkeletonText,
         SkeletonPageHeader }                              from './LoadingSkeleton';
export { default as SectionCard }                          from './SectionCard';
export { default as ModalLayout }                          from './ModalLayout';
export { default as PageHeader }                           from './PageHeader';
export { default as StatsGrid }                            from './StatsGrid';
export { default as Timeline }                             from './Timeline';
export { default as ConfirmDialog }                        from './ConfirmDialog';
export { default as ExecutiveMetricCard }                  from './ExecutiveMetricCard';
export { default as DashboardContainer }                   from './DashboardContainer';
export { default as DashboardHeader }                      from './DashboardHeader';
