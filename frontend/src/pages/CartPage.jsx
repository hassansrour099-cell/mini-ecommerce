import { useState } from "react";
import { Link } from "react-router-dom";
import CartLineItem from "../components/cart/CartLineItem";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";
import Spinner from "../components/ui/Spinner";
import { useCart } from "../context/CartContext";
import { formatCents } from "../utils/currency";

export default function CartPage() {
  const { items, totalCents, loading, error, refresh, update, remove } = useCart();
  const [busyId, setBusyId] = useState(null);
  const [notice, setNotice] = useState("");

  async function run(item, action) {
    setBusyId(item.id);
    setNotice("");
    try {
      await action();
    } catch (err) {
      setNotice(err.message);
    } finally {
      setBusyId(null);
    }
  }

  if (loading && items.length === 0) return <Spinner label="Loading your cart" />;
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
      <EmptyState title="Your cart is empty" action={<Link className="btn btn-primary" to="/">Browse the catalog</Link>}>
        Kettles, grinders, and servers will show up here once you add them.
      </EmptyState>
    );
  }

  return (
    <section>
      <h1>Cart</h1>
      {notice ? (
        <p className="status bad" role="alert">
          {notice}
        </p>
      ) : null}
      {items.map((item) => (
        <CartLineItem
          key={item.id}
          item={item}
          busy={busyId === item.id}
          onQuantity={(line, quantity) => run(line, () => update(line.id, { quantity }))}
          onVariant={(line, variantId) => run(line, () => update(line.id, { variantId }))}
          onRemove={(line) => run(line, () => remove(line.id))}
        />
      ))}
      <div className="total-row">
        <span>Total</span>
        <strong>{formatCents(totalCents)}</strong>
      </div>
      <div className="actions">
        <Link className="btn btn-primary" to="/checkout">
          Checkout
        </Link>
      </div>
    </section>
  );
}
