import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { media } from '../api';
import { Price } from '../components/Price';
import { useShop } from '../shop';

export function Home() {
  const { catalog, loading, error } = useShop();
  const [search, setSearch] = useState('');
  const currency = catalog?.shop.currency ?? 'ARS';
  const query = search.trim().toLowerCase();

  const sections = useMemo(() => {
    if (!catalog) return [];
    return catalog.sections
      .map((section) => ({
        ...section,
        products: section.products.filter((product) => {
          if (!query) return true;
          return product.name.toLowerCase().includes(query) || product.summary.toLowerCase().includes(query);
        }),
      }))
      .filter((section) => section.products.length > 0);
  }, [catalog, query]);

  if (loading) return <p className="status-copy">Cargando la tienda…</p>;
  if (error) return <p className="form-error">{error}</p>;
  if (!catalog) return null;

  return (
    <>
      <section className="poster">
        <img className="poster-seal" src="/seal.svg" alt="" width={108} height={108} />
        <div className="poster-copy">
          <p className="kicker">Artesanías de Verónica</p>
          <h1>{catalog.shop.tagline || catalog.shop.storeName}</h1>
          <svg className="trail" viewBox="0 0 280 22" aria-hidden="true">
            <path d="M2 14c28-10 48 8 78-2s52-8 78 2 48 6 74-4 28-4 46 1" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            <circle cx="274" cy="11" r="2.4" fill="currentColor" />
          </svg>
          {catalog.shop.location && <p className="place">{catalog.shop.location}</p>}
        </div>
        <label className="search-row">
          <span className="sr">Buscar</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar en el catálogo"
            type="search"
          />
        </label>
      </section>
      <div id="catalogo">
        {sections.length === 0 && <p className="status-copy">No hay productos para esa búsqueda.</p>}
        {sections.map((section, index) => (
          <section key={section.id} id={section.slug} className="catalog-section">
            <div className="section-head">
              <h2>
                <span className="mark">{String(index + 1).padStart(2, '0')}</span>
                {section.name}
              </h2>
              {section.description && <p>{section.description}</p>}
            </div>
            <div className="product-grid">
              {section.products.map((product) => (
                <Link key={product.id} to={`/producto/${product.slug}`} className="product-card">
                  <span className="mount">
                    {product.imageUrl ? (
                      <img src={media(product.imageUrl) ?? ''} alt="" />
                    ) : (
                      <div className="ph" />
                    )}
                  </span>
                  <div>
                    <h3>{product.name}</h3>
                    <p>{product.summary}</p>
                    <Price cents={product.priceCents} compareAtCents={product.compareAtCents} currency={currency} />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
