export default function Spinner({ label = "Loading" }) {
  return (
    <div className="center-status" role="status">
      <div className="spinner" />
      <span>{label}</span>
    </div>
  );
}
