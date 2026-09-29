export default function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="empty-state">
      {Icon && <Icon size={22} />}
      <strong>{title}</strong>
      {description && <span>{description}</span>}
    </div>
  );
}
