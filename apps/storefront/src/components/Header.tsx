import { Link } from 'react-router-dom';
import { useCart } from '../cart';
import { useShop } from '../shop';
import { glass } from '../ui';

export function Header() {
  const { catalog } = useShop();
  const { count } = useCart();
  const name = catalog?.shop.storeName ?? 'Caminito';

  return (
    <header className="px-3 pt-3 md:px-6">
      <div className={`${glass} relative mx-auto max-w-6xl rounded-[1.6rem]`}>
        <div className="flex w-full items-center justify-between gap-3 px-4 py-3 md:gap-4 md:px-6 md:py-3.5">
          <Link to="/" className="flex min-w-0 items-center gap-3 text-ink no-underline md:gap-4">
            <img
              src="/seal.svg"
              alt=""
              width={96}
              height={96}
              className="h-[4.75rem] w-[4.75rem] shrink-0 rounded-full shadow-[0_10px_28px_rgba(200,150,42,0.38)] md:h-24 md:w-24"
            />
            <span className="grid min-w-0 leading-none">
              <span className="truncate font-serif text-[1.85rem] tracking-tight md:text-[2.2rem]">{name}</span>
              <span className="mt-2 flex items-center gap-2">
                <span className="h-px w-7 bg-gold" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.32em] text-accent">Artesanías</span>
              </span>
            </span>
          </Link>
          {catalog && catalog.sections.length > 0 && (
            <nav className="hidden items-center gap-7 lg:flex" aria-label="Secciones">
              {catalog.sections.map((section) => (
                <a
                  key={section.id}
                  href={`/#${section.slug}`}
                  className="border-b border-transparent pb-0.5 text-[12px] font-medium uppercase tracking-[0.16em] text-muted transition hover:border-gold hover:text-ink"
                >
                  {section.name}
                </a>
              ))}
            </nav>
          )}
          <Link
            to="/carrito"
            className="inline-flex shrink-0 items-center gap-2.5 rounded-full bg-ink px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-card no-underline"
          >
            Carrito
            <span className="grid h-7 min-w-7 place-items-center rounded-full bg-gold text-sm font-semibold leading-none tracking-normal text-ink">{count}</span>
          </Link>
        </div>
        {catalog && catalog.sections.length > 0 && (
          <nav className="flex gap-5 overflow-x-auto border-t border-gold/25 px-5 py-2.5 lg:hidden" aria-label="Secciones">
            {catalog.sections.map((section) => (
              <a key={section.id} href={`/#${section.slug}`} className="shrink-0 text-[11px] font-medium uppercase tracking-[0.16em] text-muted hover:text-ink">
                {section.name}
              </a>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}

export function Footer() {
  const { catalog } = useShop();
  return (
    <footer className="mt-10 px-3 pb-3 md:px-6">
      <div className={`${glass} mx-auto flex max-w-6xl flex-col gap-6 rounded-[1.6rem] px-6 py-12 md:flex-row md:items-center md:px-10 md:py-14`}>
        <img src="/seal.svg" alt="" width={96} height={96} className="h-24 w-24 rounded-full shadow-[0_10px_28px_rgba(200,150,42,0.38)]" />
        <div>
          <p className="font-serif text-4xl leading-none text-ink">{catalog?.shop.storeName ?? 'Caminito'}</p>
          <p className="mt-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.32em] text-accent">
            <span className="h-px w-7 bg-gold" />
            Artesanías
          </p>
          {catalog?.shop.location && <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">{catalog.shop.location}</p>}
          {catalog?.shop.contactEmail && (
            <a className="mt-3 inline-block text-sm text-ink" href={`mailto:${catalog.shop.contactEmail}`}>
              {catalog.shop.contactEmail}
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}
