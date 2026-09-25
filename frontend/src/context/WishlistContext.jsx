import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "./AuthContext";
import { useCart } from "./CartContext";

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { token } = useAuth();
  const { refresh: refreshCart } = useCart();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState("");

  async function refresh() {
    if (!token) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await api("/api/wishlist");
      setItems(data.items);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, [token]);

  async function add(productId) {
    const data = await api("/api/wishlist", { method: "POST", body: { productId } });
    setItems(data.items);
  }

  async function remove(productId) {
    const data = await api(`/api/wishlist/${productId}`, { method: "DELETE" });
    setItems(data.items);
  }

  async function moveToCart(body) {
    const data = await api("/api/wishlist/move", { method: "POST", body });
    setItems(data.items);
    await refreshCart();
    return data;
  }

  function isSaved(productId) {
    return items.some((item) => item.productId === productId);
  }

  return (
    <WishlistContext.Provider value={{ items, loading, error, refresh, add, remove, moveToCart, isSaved }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) throw new Error("useWishlist must be used within WishlistProvider");
  return context;
}
