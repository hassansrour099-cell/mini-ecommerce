export default function Button({
  variant = "primary",
  type = "button",
  className = "",
  ...props
}) {
  const names = ["btn", variant === "primary" ? "btn-primary" : "", variant === "ghost" ? "btn-ghost" : "", variant === "danger" ? "btn-danger" : "", className]
    .filter(Boolean)
    .join(" ");
  return <button type={type} className={names} {...props} />;
}
