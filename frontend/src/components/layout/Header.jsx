import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";

export default function Header() {
  const { user, logout } = useAuth();
  const { items } = useCart();
  const { items: saved } = useWishlist();
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="site-header">
      <div className="header-inner">
        <NavLink to="/" className="wordmark">
          Copper <span>&</span> Grain
        </NavLink>
        <nav className="header-nav" aria-label="Primary">
          <NavLink to="/" end className="nav-link">
            Shop
          </NavLink>
          <NavLink to="/wishlist" className="nav-link">
            Wishlist <span className="count">({saved.length})</span>
          </NavLink>
          <NavLink to="/cart" className="nav-link">
            Cart <span className="count">({cartCount})</span>
          </NavLink>
          <button type="button" className="text-button" onClick={logout}>
            Log out{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
          </button>
        </nav>
      </div>
    </header>
  );
}
