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

  if (loading) return <p className="px-6 py-24 text-muted md:px-10">Cargando la tienda…</p>;
  if (error) return <p className="px-6 py-24 text-danger md:px-10">{error}</p>;
  if (!catalog) return null;

  return (
    <div className="mx-auto w-full max-w-6xl px-3 py-4 md:px-6 md:py-8">
      <section className="grid items-end gap-10 rounded-[2rem] bg-paper/94 px-6 py-12 shadow-sm backdrop-blur-md md:px-10 md:py-16 lg:grid-cols-[1fr_280px] lg:gap-16">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-accent">Artesanías · Verónica</p>
          <h1 className="mt-6 max-w-[12ch] font-serif text-5xl leading-[0.95] tracking-tight text-ink md:text-7xl">
            {catalog.shop.tagline || catalog.shop.storeName}
          </h1>
          {catalog.shop.location && <p className="mt-8 max-w-md text-base leading-relaxed text-muted">{catalog.shop.location}</p>}
        </div>
        <label className="lg:pb-2">
          <span className="sr-only">Buscar</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar una pieza"
            type="search"
            className="w-full rounded-full border border-line bg-card px-5 py-4 text-sm text-ink outline-none transition placeholder:text-muted focus:border-ink"
          />
        </label>
      </section>

      <div id="catalogo">
        {sections.length === 0 && <p className="mt-4 rounded-[2rem] bg-paper/94 px-6 py-16 text-muted backdrop-blur-md">No hay productos para esa búsqueda.</p>}
        {sections.map((section, index) => (
          <section key={section.id} id={section.slug} className="mt-4 scroll-mt-28 rounded-[2rem] bg-paper/94 px-5 py-12 backdrop-blur-md md:mt-6 md:px-10 md:py-16">
            <div className="mb-10 flex items-end justify-between gap-8 md:mb-14">
              <div>
                <p className="text-xs font-medium tracking-[0.2em] text-muted">{String(index + 1).padStart(2, '0')}</p>
                <h2 className="mt-3 font-serif text-4xl tracking-tight text-ink md:text-5xl">{section.name}</h2>
              </div>
              {section.description && <p className="hidden max-w-xs text-right text-sm leading-relaxed text-muted md:block">{section.description}</p>}
            </div>
            <div className="grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-3 md:gap-x-8 md:gap-y-16">
              {section.products.map((product) => (
                <Link key={product.id} to={`/producto/${product.slug}`} className="group text-ink no-underline">
                  <span className="block overflow-hidden rounded-3xl bg-stage">
                    {product.imageUrl ? (
                      <img
                        src={media(product.imageUrl) ?? ''}
                        alt=""
                        className="aspect-square w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <span className="block aspect-square bg-stage" />
                    )}
                  </span>
                  <h3 className="mt-5 font-serif text-xl tracking-tight">{product.name}</h3>
                  <Price cents={product.priceCents} compareAtCents={product.compareAtCents} currency={currency} />
                  <p className="mt-1 text-sm leading-relaxed text-muted">{product.summary}</p>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
