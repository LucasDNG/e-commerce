import { Link } from 'react-router-dom';
import { useCart } from '../cart';
import { useShop } from '../shop';

export function Header() {
  const { catalog } = useShop();
  const { count } = useCart();
  const name = catalog?.shop.storeName ?? 'Caminito';

  return (
    <header className="site-header">
      <div className="header-row">
        <Link to="/" className="brand">
          <img src="/seal.svg" alt="" width={36} height={36} />
          <span>
            {name}
            <small>Artesanías</small>
          </span>
        </Link>
        {catalog && catalog.sections.length > 0 && (
          <nav className="section-nav" aria-label="Secciones">
            {catalog.sections.map((section) => (
              <a key={section.id} href={`/#${section.slug}`}>
                {section.name}
              </a>
            ))}
          </nav>
        )}
        <Link to="/carrito" className="cart-link">
          Carrito
          <span>{count}</span>
        </Link>
      </div>
    </header>
  );
}

export function Footer() {
  const { catalog } = useShop();
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <img src="/seal.svg" alt="" width={44} height={44} />
        <div>
          <p>{catalog?.shop.storeName ?? 'Caminito'}</p>
          <p className="footer-kicker">Artesanías</p>
          {catalog?.shop.location && <p>{catalog.shop.location}</p>}
          {catalog?.shop.contactEmail && <a href={`mailto:${catalog.shop.contactEmail}`}>{catalog.shop.contactEmail}</a>}
        </div>
      </div>
    </footer>
  );
}
