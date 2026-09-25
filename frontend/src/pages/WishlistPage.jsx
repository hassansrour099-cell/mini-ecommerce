import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";
import Spinner from "../components/ui/Spinner";
import { useWishlist } from "../context/WishlistContext";
import { formatCents } from "../utils/currency";

export default function WishlistPage() {
  const { items, loading, error, refresh, remove, moveToCart } = useWishlist();
  const navigate = useNavigate();
  const [busyId, setBusyId] = useState(null);
  const [notice, setNotice] = useState("");

  async function move(item) {
    if (item.variants.length !== 1) {
      navigate(`/products/${item.productId}`);
      return;
    }
    setBusyId(item.id);
    setNotice("");
    try {
      const result = await moveToCart({
        productId: item.productId,
        variantId: item.variants[0].id,
        quantity: 1,
      });
      setNotice(result.warning || `${item.name} moved to cart.`);
    } catch (err) {
      setNotice(err.message);
    } finally {
      setBusyId(null);
    }
  }

  if (loading && items.length === 0) return <Spinner label="Loading your wishlist" />;
  if (error && items.length === 0) {
    return (
      <div className="status bad">
        <p>{error}</p>
        <Button variant="ghost" onClick={refresh}>
          Try again
        </Button>
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <EmptyState title="Nothing saved yet" action={<Link className="btn btn-primary" to="/">Browse the catalog</Link>}>
        Save a piece here when you want to come back to it.
      </EmptyState>
    );
  }

  return (
    <section>
      <h1>Wishlist</h1>
      {notice ? (
        <p className="status" role="status">
          {notice}
        </p>
      ) : null}
      {items.map((item) => {
        const price =
          item.minPriceCents === item.maxPriceCents
            ? formatCents(item.minPriceCents)
            : `From ${formatCents(item.minPriceCents)}`;
        return (
          <article key={item.id} className="cart-line">
            <div>
              <Link to={`/products/${item.productId}`} className="line-title">
                {item.name}
              </Link>
              <p className="muted">
                {price}
                {item.variantCount > 1 ? ` · ${item.variantCount} options` : ""}
              </p>
            </div>
            <div className="actions">
              <Button disabled={busyId === item.id} onClick={() => move(item)}>
                {item.variantCount > 1 ? "Choose an option" : "Move to cart"}
              </Button>
              <Button variant="danger" disabled={busyId === item.id} onClick={() => remove(item.productId)}>
                Remove
              </Button>
            </div>
          </article>
        );
      })}
    </section>
  );
}
