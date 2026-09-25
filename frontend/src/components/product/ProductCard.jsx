import { Link } from "react-router-dom";
import { formatCents } from "../../utils/currency";

export default function ProductCard({ product }) {
  const price =
    product.minPriceCents === product.maxPriceCents
      ? formatCents(product.minPriceCents)
      : `From ${formatCents(product.minPriceCents)}`;
  const index = String(product.id).padStart(2, "0");

  return (
    <Link to={`/products/${product.id}`} className="product-card">
      <p className="product-index">{index}</p>
      <h2>{product.name}</h2>
      <div className="meta">
        <span className="price">{price}</span>
        {product.variantCount > 1 ? <span>{product.variantCount} options</span> : null}
      </div>
    </Link>
  );
}
