import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, media, type Product } from '../api';
import { useCart } from '../cart';
import { Price } from '../components/Price';
import { useShop } from '../shop';

export function ProductPage() {
  const { slug = '' } = useParams();
  const { catalog } = useShop();
  const { add } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [photo, setPhoto] = useState(0);
  const [added, setAdded] = useState(false);
  const currency = catalog?.shop.currency ?? 'ARS';

  useEffect(() => {
    let active = true;
    setProduct(null);
    setError(null);
    setQuantity(1);
    setPhoto(0);
    api<Product>(`/api/products/${slug}`)
      .then((data) => {
        if (!active) return;
        setProduct(data);
        document.title = data.name;
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setError(reason instanceof Error ? reason.message : 'No se encontró el producto');
      });
    return () => {
      active = false;
    };
  }, [slug]);

  if (error) {
    return (
      <div className="narrow">
        <p className="form-error">{error}</p>
        <Link to="/">Volver a la tienda</Link>
      </div>
    );
  }
  if (!product) return <p className="status-copy">Cargando producto…</p>;

  const images = product.images.length > 0 ? product.images : [{ id: 'empty', url: product.imageUrl, alt: product.name }];
  const current = images[Math.min(photo, images.length - 1)];
  const out = product.stock <= 0;

  return (
    <article className="product-page">
      <div className="gallery">
        <span className="mount tall">
          {current?.url ? <img src={media(current.url) ?? ''} alt={current.alt} /> : <div className="ph tall" />}
        </span>
        {images.length > 1 && (
          <div className="thumbs">
            {images.map((image, index) => (
              <button key={image.id} type="button" className={index === photo ? 'on' : ''} onClick={() => setPhoto(index)}>
                {image.url ? <img src={media(image.url) ?? ''} alt="" /> : <span className="ph" />}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="buy">
        {product.section && (
          <a className="kicker" href={`/#${product.section.slug}`}>
            {product.section.name}
          </a>
        )}
        <h1>{product.name}</h1>
        <Price cents={product.priceCents} compareAtCents={product.compareAtCents} currency={currency} />
        <p className="lead">{product.summary}</p>
        <p className="description">{product.description}</p>
        {product.stock > 0 && product.stock <= 5 && <p className="stock-note">Quedan {product.stock}</p>}
        <div className="qty">
          <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label="Menos">
            −
          </button>
          <span>{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((value) => Math.min(product.stock, value + 1))}
            disabled={quantity >= product.stock}
            aria-label="Más"
          >
            +
          </button>
        </div>
        <button
          className="btn"
          type="button"
          disabled={out}
          onClick={() => {
            add(
              {
                productId: product.id,
                slug: product.slug,
                name: product.name,
                priceCents: product.priceCents,
                imageUrl: product.imageUrl,
                stock: product.stock,
              },
              quantity,
            );
            setAdded(true);
            window.setTimeout(() => setAdded(false), 1600);
          }}
        >
          {out ? 'Sin stock' : added ? 'Agregado al carrito' : 'Agregar al carrito'}
        </button>
        {product.sku && <p className="sku">SKU {product.sku}</p>}
      </div>
    </article>
  );
}
