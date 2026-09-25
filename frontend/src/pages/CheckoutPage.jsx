import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";
import Spinner from "../components/ui/Spinner";
import { useCart } from "../context/CartContext";
import { formatCents } from "../utils/currency";

export default function CheckoutPage() {
  const { items, totalCents, loading, error, refresh } = useCart();
  const [params, setParams] = useSearchParams();
  const orderId = params.get("order");
  const [order, setOrder] = useState(null);
  const [orderError, setOrderError] = useState("");
  const [orderLoading, setOrderLoading] = useState(Boolean(orderId));
  const [placing, setPlacing] = useState(false);
  const [stockIssue, setStockIssue] = useState(null);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!orderId) {
      setOrder(null);
      return;
    }
    setOrderLoading(true);
    setOrderError("");
    api(`/api/orders/${orderId}`)
      .then((data) => setOrder(data.order))
      .catch((err) => setOrderError(err.message))
      .finally(() => setOrderLoading(false));
  }, [orderId]);

  async function placeOrder() {
    setPlacing(true);
    setStockIssue(null);
    setFormError("");
    try {
      const data = await api("/api/orders", { method: "POST", body: {} });
      await refresh();
      setParams({ order: String(data.order.id) });
    } catch (err) {
      if (err.status === 409 && err.body?.code === "INSUFFICIENT_STOCK") {
        setStockIssue(err.body.details);
      } else {
        setFormError(err.message);
      }
    } finally {
      setPlacing(false);
    }
  }

  if (orderId) {
    if (orderLoading) return <Spinner label="Loading your order" />;
    if (orderError) {
      return (
        <div className="status bad">
          <p>{orderError}</p>
          <Button variant="ghost" onClick={() => setParams({})}>
            Back to checkout
          </Button>
        </div>
      );
    }
    if (!order) return null;
    return (
      <section>
        <p className="muted">Order {order.id}</p>
        <h1>Order placed</h1>
        <p className="lede">The cart is cleared. This confirmation is the record for this checkout.</p>
        {order.items.map((item) => (
          <div key={item.id} className="summary-line">
            <div className="summary-row">
              <span>
                {item.productName} ({item.variantLabel}) × {item.quantity}
              </span>
              <strong>{formatCents(item.lineTotalCents)}</strong>
            </div>
          </div>
        ))}
        <div className="total-row">
          <span>Total</span>
          <strong>{formatCents(order.totalCents)}</strong>
        </div>
        <Link className="btn btn-primary" to="/">
          Back to the shop
        </Link>
      </section>
    );
  }

  if (loading && items.length === 0) return <Spinner label="Loading checkout" />;
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
      <EmptyState title="Nothing to check out" action={<Link className="btn btn-primary" to="/">Browse the catalog</Link>}>
        Add something to the cart before placing an order.
      </EmptyState>
    );
  }

  return (
    <section>
      <h1>Checkout</h1>
      <p className="muted">Review the lines below. Placing the order reserves the current stock.</p>
      {items.map((item) => (
        <div key={item.id} className="summary-line">
          <div className="summary-row">
            <span>
              {item.productName} ({item.variantLabel}) × {item.quantity}
            </span>
            <strong>{formatCents(item.lineTotalCents)}</strong>
          </div>
        </div>
      ))}
      <div className="total-row">
        <span>Total</span>
        <strong>{formatCents(totalCents)}</strong>
      </div>
      {stockIssue ? (
        <div className="status bad" role="alert">
          <p>
            {stockIssue.productName} ({stockIssue.variantLabel}) has {stockIssue.available} left. You asked for{" "}
            {stockIssue.requested}.
          </p>
          <Link className="btn btn-ghost" to="/cart">
            Update cart
          </Link>
        </div>
      ) : null}
      {formError ? (
        <p className="status bad" role="alert">
          {formError}
        </p>
      ) : null}
      <Button disabled={placing} onClick={placeOrder}>
        {placing ? "Placing order" : "Place order"}
      </Button>
    </section>
  );
}
