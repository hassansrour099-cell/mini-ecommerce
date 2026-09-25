import { Link } from "react-router-dom";
import { formatCents } from "../../utils/currency";

export default function CartLineItem({ item, onQuantity, onVariant, onRemove, busy }) {
  return (
    <article className="cart-line">
      <div>
        <Link to={`/products/${item.productId}`} className="line-title">
          {item.productName}
        </Link>
        <p className="muted">{formatCents(item.priceCents)} each</p>
      </div>
      {item.variants.length > 1 ? (
        <label>
          <span className="muted">Option</span>
          <select
            className="variant-select"
            value={item.variantId}
            disabled={busy}
            onChange={(event) => onVariant(item, Number(event.target.value))}
          >
            {item.variants.map((variant) => (
              <option key={variant.id} value={variant.id}>
                {variant.label}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <p className="muted">{item.variantLabel}</p>
      )}
      <div className="qty" aria-label={`Quantity for ${item.productName}`}>
        <button type="button" disabled={busy || item.quantity <= 1} onClick={() => onQuantity(item, item.quantity - 1)}>
          −
        </button>
        <input
          aria-label="Quantity"
          inputMode="numeric"
          value={item.quantity}
          onChange={(event) => {
            const next = Number(event.target.value);
            if (Number.isInteger(next) && next > 0) onQuantity(item, next);
          }}
        />
        <button
          type="button"
          disabled={busy || item.quantity >= item.stockQuantity}
          onClick={() => onQuantity(item, item.quantity + 1)}
        >
          +
        </button>
      </div>
      <strong>{formatCents(item.lineTotalCents)}</strong>
      <button type="button" className="btn btn-danger" disabled={busy} onClick={() => onRemove(item)}>
        Remove
      </button>
    </article>
  );
}
