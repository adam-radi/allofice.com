import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getProducts } from "../api/products.api";
import { useContext } from "react";
import { CartContext } from "../context/CartContext";

function Printing() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const { addToCart } = useContext(CartContext);
  const [searchParams] = useSearchParams();

  const search = searchParams.get("search");

  useEffect(() => {
    // نجلب فقط منتجات الطباعة
    getProducts({ type: "printing", search })
      .then(res => {
        setProducts(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [search]);

  if (loading) return <p>Chargement...</p>;

  return (
    <div className="page">
      <h1>Services d'impression</h1>

      {products.length === 0 && <p>Aucun service disponible</p>}

      <div className="products-grid">
        {products.map(product => (
          <div key={product.id} className="product-card">
            <img src={product.image} alt={product.name} />

            <h3>{product.name}</h3>
            <p>{product.description}</p>
            <strong>{product.price} DH</strong>

            <div className="actions">
              <button onClick={() => addToCart(product)}>
                Ajouter au panier
              </button>

              <a href={`/product/${product.id}`} className="details-btn">
                Plus d’informations
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Printing;
