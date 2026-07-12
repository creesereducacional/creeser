import PageHeader from './PageHeader';

export default function DashboardHeader({ title, subtitle, icon = '📊', actions }) {
  return (
    <div className="py-1">
      <PageHeader
        icon={icon}
        title={title}
        subtitle={subtitle}
        actions={actions}
      />
    </div>
  );
}
