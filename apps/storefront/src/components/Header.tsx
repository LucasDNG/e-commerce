import { Link } from 'react-router-dom';
import { useCart } from '../cart';
import { useShop } from '../shop';

function SealGlow() {
  return (
    <div
      className="pointer-events-none absolute -left-24 -top-28 h-72 w-72 rounded-full bg-[radial-gradient(circle,#e2b54a_0%,rgba(200,150,42,0.28)_36%,transparent_68%)]"
      aria-hidden="true"
    />
  );
}

export function Header() {
  const { catalog } = useShop();
  const { count } = useCart();
  const name = catalog?.shop.storeName ?? 'Caminito';

  return (
    <header className="sticky top-0 z-40 px-3 pt-3 text-card md:px-6">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[1.6rem] bg-[#140f0c]/90 shadow-[0_18px_40px_rgba(20,15,12,0.35)] ring-1 ring-[#e2b14a]/45 backdrop-blur-md">
        <SealGlow />
        <div className="h-px bg-gradient-to-r from-transparent via-[#e2b14a] to-transparent" />
        <div className="relative flex w-full items-center justify-between gap-4 px-4 py-2.5 md:px-6">
          <Link to="/" className="flex items-center gap-3 text-card no-underline focus-visible:outline-[#e2b14a]">
            <img
              src="/seal.svg"
              alt=""
              width={56}
              height={56}
              className="h-14 w-14 rounded-full shadow-[0_0_0_2px_#c8962a,0_0_20px_rgba(200,150,42,0.5)]"
            />
            <span className="grid leading-none">
              <span className="font-serif text-[1.7rem] tracking-tight md:text-[1.95rem]">{name}</span>
              <span className="mt-1.5 flex items-center gap-2">
                <span className="h-px w-6 bg-[#c8962a]" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.36em] text-[#e2b14a]">Artesanías</span>
              </span>
            </span>
          </Link>
          {catalog && catalog.sections.length > 0 && (
            <nav className="hidden items-center gap-7 lg:flex" aria-label="Secciones">
              {catalog.sections.map((section) => (
                <a
                  key={section.id}
                  href={`/#${section.slug}`}
                  className="border-b border-transparent pb-0.5 text-[11px] font-medium uppercase tracking-[0.18em] text-stone-300 transition hover:border-[#e2b14a] hover:text-[#e2b14a]"
                >
                  {section.name}
                </a>
              ))}
            </nav>
          )}
          <Link
            to="/carrito"
            className="relative z-10 inline-flex items-center gap-3 rounded-full border border-[#e2b14a] bg-[#1a130e] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-card no-underline shadow-[inset_0_0_12px_rgba(200,150,42,0.18)] focus-visible:outline-[#e2b14a]"
          >
            Carrito
            <span className="grid h-7 min-w-7 place-items-center rounded-full bg-[#e2b14a] text-sm font-semibold leading-none tracking-normal text-[#140f0c]">{count}</span>
          </Link>
        </div>
        {catalog && catalog.sections.length > 0 && (
          <nav className="relative flex gap-5 overflow-x-auto border-t border-[#c8962a]/40 px-5 py-2.5 lg:hidden" aria-label="Secciones">
            {catalog.sections.map((section) => (
              <a key={section.id} href={`/#${section.slug}`} className="shrink-0 text-[11px] font-medium uppercase tracking-[0.16em] text-stone-300 hover:text-[#e2b14a]">
                {section.name}
              </a>
            ))}
          </nav>
        )}
        <div className="h-px bg-gradient-to-r from-transparent via-[#e2b14a] to-transparent" />
      </div>
    </header>
  );
}

export function Footer() {
  const { catalog } = useShop();
  return (
    <footer className="mt-10 px-3 pb-3 text-stone-300 md:px-6">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-[1.6rem] bg-[#140f0c]/92 ring-1 ring-[#e2b14a]/40">
      <div className="h-px bg-gradient-to-r from-transparent via-[#e2b14a] to-transparent" />
      <div className="flex w-full flex-col gap-6 px-6 py-14 md:flex-row md:items-center md:px-10 md:py-16">
        <img src="/seal.svg" alt="" width={64} height={64} className="h-16 w-16 rounded-full shadow-[0_0_0_2px_#c8962a]" />
        <div>
          <p className="font-serif text-4xl leading-none text-card">{catalog?.shop.storeName ?? 'Caminito'}</p>
          <p className="mt-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.32em] text-[#e2b14a]">
            <span className="h-px w-6 bg-[#c8962a]" />
            Artesanías
          </p>
          {catalog?.shop.location && <p className="mt-4 max-w-md text-sm leading-relaxed text-stone-300">{catalog.shop.location}</p>}
          {catalog?.shop.contactEmail && (
            <a className="mt-3 inline-block text-sm text-[#e2b14a]" href={`mailto:${catalog.shop.contactEmail}`}>
              {catalog.shop.contactEmail}
            </a>
          )}
        </div>
      </div>
      </div>
    </footer>
  );
}
