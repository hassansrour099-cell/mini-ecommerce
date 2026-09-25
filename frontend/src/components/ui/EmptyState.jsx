export default function EmptyState({ title, children, action }) {
  return (
    <div className="empty">
      <h1>{title}</h1>
      {children ? <p className="muted">{children}</p> : null}
      {action}
    </div>
  );
}
