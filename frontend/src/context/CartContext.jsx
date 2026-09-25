import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [totalCents, setTotalCents] = useState(0);
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState("");

  function applyCart(cart) {
    setItems(cart.items);
    setTotalCents(cart.totalCents);
  }

  async function refresh() {
    if (!token) {
      setItems([]);
      setTotalCents(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      applyCart(await api("/api/cart"));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, [token]);

  async function add(body) {
    const result = await api("/api/cart", { method: "POST", body });
    applyCart(result.cart);
    return result;
  }

  async function update(itemId, body) {
    applyCart(await api(`/api/cart/${itemId}`, { method: "PATCH", body }));
  }

  async function remove(itemId) {
    applyCart(await api(`/api/cart/${itemId}`, { method: "DELETE" }));
  }

  return (
    <CartContext.Provider value={{ items, totalCents, loading, error, refresh, add, update, remove }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}
