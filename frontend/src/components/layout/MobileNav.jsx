import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";

export default function MobileNav() {
  const { logout } = useAuth();
  const { items } = useCart();
  const { items: saved } = useWishlist();
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <nav className="mobile-nav" aria-label="Mobile">
      <NavLink to="/" end>
        Shop
      </NavLink>
      <NavLink to="/wishlist">Saved ({saved.length})</NavLink>
      <NavLink to="/cart">Cart ({cartCount})</NavLink>
      <button type="button" className="text-button" onClick={logout}>
        Log out
      </button>
    </nav>
  );
}
