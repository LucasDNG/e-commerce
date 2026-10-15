import { Link } from 'react-router-dom';
import { useCart } from '../cart';
import { useShop } from '../shop';

export function Header() {
  const { catalog } = useShop();
  const { count } = useCart();
  const name = catalog?.shop.storeName ?? 'Caminito';

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-paper/88 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-6 py-4 md:px-10">
        <Link to="/" className="flex items-center gap-3 text-ink no-underline">
          <img src="/seal.svg" alt="" width={44} height={44} className="h-11 w-11" />
          <span className="font-serif text-[1.7rem] leading-none tracking-tight">{name}</span>
        </Link>
        {catalog && catalog.sections.length > 0 && (
          <nav className="hidden items-center gap-8 text-sm text-muted md:flex" aria-label="Secciones">
            {catalog.sections.map((section) => (
              <a key={section.id} href={`/#${section.slug}`} className="transition hover:text-ink">
                {section.name}
              </a>
            ))}
          </nav>
        )}
        <Link
          to="/carrito"
          className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-4 py-2 text-sm text-ink no-underline"
        >
          Carrito
          <span className="grid h-6 min-w-6 place-items-center rounded-full bg-ink text-xs text-card">{count}</span>
        </Link>
      </div>
      {catalog && catalog.sections.length > 0 && (
        <nav className="flex gap-6 overflow-x-auto px-6 pb-4 text-sm text-muted md:hidden" aria-label="Secciones">
          {catalog.sections.map((section) => (
            <a key={section.id} href={`/#${section.slug}`} className="shrink-0 hover:text-ink">
              {section.name}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}

export function Footer() {
  const { catalog } = useShop();
  return (
    <footer className="relative mt-10 bg-ink text-stone-300">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-16 md:flex-row md:items-center md:px-10 md:py-20">
        <img src="/seal.svg" alt="" width={56} height={56} className="h-14 w-14" />
        <div>
          <p className="font-serif text-4xl leading-none text-card">{catalog?.shop.storeName ?? 'Caminito'}</p>
          <p className="mt-3 text-xs font-medium uppercase tracking-[0.22em] text-amber-200/80">Artesanías</p>
          {catalog?.shop.location && <p className="mt-4 max-w-md text-sm leading-relaxed text-stone-300">{catalog.shop.location}</p>}
          {catalog?.shop.contactEmail && (
            <a className="mt-3 inline-block text-sm text-card" href={`mailto:${catalog.shop.contactEmail}`}>
              {catalog.shop.contactEmail}
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}
