import { formatCents } from "../../utils/currency";

export default function VariantSelector({ variants, selectedId, onChange }) {
  const prices = new Set(variants.map((variant) => variant.priceCents));

  return (
    <div className="variant-options" role="group" aria-label="Options">
      {variants.map((variant) => (
        <button
          key={variant.id}
          type="button"
          className="variant-option"
          aria-pressed={variant.id === selectedId}
          onClick={() => onChange(variant.id)}
        >
          {variant.label}
          {prices.size > 1 ? ` · ${formatCents(variant.priceCents)}` : ""}
        </button>
      ))}
    </div>
  );
}
