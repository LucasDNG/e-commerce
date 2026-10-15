import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, media, type Product } from '../api';
import { useCart } from '../cart';
import { Price } from '../components/Price';
import { useShop } from '../shop';
import { btn } from '../ui';

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
      <div className="mx-auto max-w-xl px-6 py-24">
        <p className="text-danger">{error}</p>
        <Link to="/" className={`${btn} mt-8`}>
          Volver a la tienda
        </Link>
      </div>
    );
  }
  if (!product) return <p className="px-6 py-24 text-muted">Cargando producto…</p>;

  const images = product.images.length > 0 ? product.images : [{ id: 'empty', url: product.imageUrl, alt: product.name }];
  const current = images[Math.min(photo, images.length - 1)];
  const out = product.stock <= 0;

  return (
    <article className="mx-auto my-4 grid w-full max-w-6xl gap-12 rounded-[2rem] bg-paper/94 px-6 py-12 backdrop-blur-md md:my-8 md:px-10 md:py-16 lg:grid-cols-2 lg:items-start lg:gap-16">
      <div>
        <span className="block overflow-hidden rounded-3xl bg-stage">
          {current?.url ? (
            <img src={media(current.url) ?? ''} alt={current.alt} className="aspect-square w-full object-cover" />
          ) : (
            <span className="block aspect-square bg-stage" />
          )}
        </span>
        {images.length > 1 && (
          <div className="mt-4 flex gap-3">
            {images.map((image, index) => (
              <button
                key={image.id}
                type="button"
                className={`h-16 w-16 overflow-hidden rounded-2xl border bg-stage ${index === photo ? 'border-ink' : 'border-transparent'}`}
                onClick={() => setPhoto(index)}
              >
                {image.url ? <img src={media(image.url) ?? ''} alt="" className="h-full w-full object-cover" /> : <span className="block h-full bg-stage" />}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="lg:pt-4">
        {product.section && (
          <a className="text-xs font-medium uppercase tracking-[0.2em] text-accent" href={`/#${product.section.slug}`}>
            {product.section.name}
          </a>
        )}
        <h1 className="mt-4 font-serif text-5xl leading-[0.95] tracking-tight text-ink md:text-6xl">{product.name}</h1>
        <div className="mt-4 text-lg">
          <Price cents={product.priceCents} compareAtCents={product.compareAtCents} currency={currency} />
        </div>
        <p className="mt-6 text-lg leading-relaxed text-ink">{product.summary}</p>
        <p className="mt-4 whitespace-pre-wrap leading-relaxed text-muted">{product.description}</p>
        {product.stock > 0 && product.stock <= 5 && <p className="mt-4 font-medium text-accent">Quedan {product.stock}</p>}
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <div className="inline-flex items-center rounded-full border border-line bg-card">
            <button type="button" className="grid h-12 w-12 place-items-center" onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label="Menos">
              −
            </button>
            <span className="grid h-12 w-8 place-items-center text-sm">{quantity}</span>
            <button
              type="button"
              className="grid h-12 w-12 place-items-center disabled:opacity-35"
              onClick={() => setQuantity((value) => Math.min(product.stock, value + 1))}
              disabled={quantity >= product.stock}
              aria-label="Más"
            >
              +
            </button>
          </div>
          <button
            className={btn}
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
        </div>
        {product.sku && <p className="mt-6 text-xs uppercase tracking-[0.14em] text-muted">SKU {product.sku}</p>}
      </div>
    </article>
  );
}
