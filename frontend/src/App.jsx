import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import Header from "./components/layout/Header";
import MobileNav from "./components/layout/MobileNav";
import { useAuthGuard } from "./hooks/useAuthGuard";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import LoginPage from "./pages/LoginPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import ProductListingPage from "./pages/ProductListingPage";
import WishlistPage from "./pages/WishlistPage";

function RequireAuth() {
  const { isAuthenticated } = useAuthGuard();
  if (!isAuthenticated) return null;
  return <Outlet />;
}

function ShopLayout() {
  return (
    <>
      <Header />
      <main className="page">
        <Outlet />
      </main>
      <MobileNav />
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<ShopLayout />}>
          <Route path="/" element={<ProductListingPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
