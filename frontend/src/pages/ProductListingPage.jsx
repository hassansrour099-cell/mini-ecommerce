import { useEffect, useState } from "react";
import { api } from "../api/client";
import ProductCard from "../components/product/ProductCard";
import Button from "../components/ui/Button";
import Spinner from "../components/ui/Spinner";

export default function ProductListingPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    setError("");
    api("/api/products")
      .then((data) => setProducts(data.products))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <section>
      <h1>Counter tools</h1>
      <p className="lede muted">Kettles, grinders, and the small gear around a daily brew. Fifteen pieces, priced as sold.</p>
      {loading ? <Spinner label="Loading the catalog" /> : null}
      {error ? (
        <div className="status bad">
          <p>{error}</p>
          <Button variant="ghost" onClick={load}>
            Try again
          </Button>
        </div>
      ) : null}
      {!loading && !error ? (
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : null}
    </section>
  );
}
