import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/client";
import VariantSelector from "../components/product/VariantSelector";
import Button from "../components/ui/Button";
import Spinner from "../components/ui/Spinner";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { formatCents } from "../utils/currency";

export default function ProductDetailPage() {
  const { id } = useParams();
  const { add } = useCart();
  const { add: save, remove, isSaved } = useWishlist();
  const [product, setProduct] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  function load() {
    setLoading(true);
    setError("");
    api(`/api/products/${id}`)
      .then((data) => {
        setProduct(data.product);
        setSelectedId(data.product.variants[0]?.id ?? null);
        setQuantity(1);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [id]);

  if (loading) return <Spinner label="Loading product" />;
  if (error) {
    return (
      <div className="status bad">
        <p>{error}</p>
        <Button variant="ghost" onClick={load}>
          Try again
        </Button>
      </div>
    );
  }

  const selected = product.variants.find((variant) => variant.id === selectedId) || product.variants[0];
  const saved = isSaved(product.id);

  async function addToCart() {
    setBusy(true);
    setNotice("");
    setError("");
    try {
      const result = await add({ productId: product.id, variantId: selected.id, quantity });
      setNotice(result.clamped ? "Added, limited to the quantity still in stock." : "Added to cart.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function toggleWishlist() {
    setBusy(true);
    setNotice("");
    setError("");
    try {
      if (saved) {
        await remove(product.id);
        setNotice("Removed from wishlist.");
      } else {
        await save(product.id);
        setNotice("Saved to wishlist.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="detail">
      <div className="detail-mark">
        <strong>{String(product.id).padStart(2, "0")}</strong>
        <p className="muted">{selected.stockQuantity} in stock</p>
      </div>
      <div className="stack">
        <h1>{product.name}</h1>
        <p className="price">{formatCents(selected.priceCents)}</p>
        <p>{product.description}</p>
        {product.variants.length > 1 ? (
          <VariantSelector variants={product.variants} selectedId={selected.id} onChange={setSelectedId} />
        ) : (
          <p className="muted">{selected.label}</p>
        )}
        <div className="qty">
          <button type="button" disabled={quantity <= 1} onClick={() => setQuantity((value) => value - 1)}>
            −
          </button>
          <input
            aria-label="Quantity"
            inputMode="numeric"
            value={quantity}
            onChange={(event) => {
              const next = Number(event.target.value);
              if (Number.isInteger(next) && next > 0) setQuantity(Math.min(next, 99));
            }}
          />
          <button
            type="button"
            disabled={quantity >= selected.stockQuantity || quantity >= 99}
            onClick={() => setQuantity((value) => value + 1)}
          >
            +
          </button>
        </div>
        <div className="actions">
          <Button disabled={busy || selected.stockQuantity < 1} onClick={addToCart}>
            {selected.stockQuantity < 1 ? "Out of stock" : "Add to cart"}
          </Button>
          <Button variant="ghost" disabled={busy} onClick={toggleWishlist}>
            {saved ? "Remove from wishlist" : "Add to wishlist"}
          </Button>
        </div>
        {notice ? (
          <p className="status good" role="status">
            {notice}
          </p>
        ) : null}
        {error ? (
          <p className="status bad" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </article>
  );
}
