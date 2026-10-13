import { Link } from 'react-router-dom';
import { useCart } from '../cart';
import { useShop } from '../shop';

export function Header() {
  const { catalog } = useShop();
  const { count } = useCart();
  const name = catalog?.shop.storeName ?? 'Vitrina';

  return (
    <header className="site-header">
      <div className="header-row">
        <Link to="/" className="brand">
          {name}
        </Link>
        <Link to="/carrito" className="cart-link">
          Carrito
          <span>{count}</span>
        </Link>
      </div>
      {catalog && catalog.sections.length > 0 && (
        <nav className="section-nav" aria-label="Secciones">
          {catalog.sections.map((section) => (
            <a key={section.id} href={`/#${section.slug}`}>
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
    <footer className="site-footer">
      <p>{catalog?.shop.storeName ?? 'Vitrina'}</p>
      {catalog?.shop.contactEmail && <a href={`mailto:${catalog.shop.contactEmail}`}>{catalog.shop.contactEmail}</a>}
    </footer>
  );
}
