import { Link } from 'react-router-dom';
import { useCart } from '../cart';
import { useShop } from '../shop';

const BAND = ['Piedras naturales', 'Cosas lindas', 'Envíos a todo el país', 'Verónica, Bs. As.', 'Calle 30'];

function Ribbon() {
  const items = [...BAND, ...BAND, ...BAND, ...BAND];
  return (
    <div className="ribbon" aria-hidden="true">
      <div className="ribbon-track">
        {items.map((item, index) => (
          <span key={index}>{item}</span>
        ))}
      </div>
    </div>
  );
}

export function Header() {
  const { catalog } = useShop();
  const { count } = useCart();
  const name = catalog?.shop.storeName ?? 'Caminito';

  return (
    <header className="site-header">
      <Ribbon />
      <div className="header-row">
        <Link to="/" className="brand">
          <img src="/seal.svg" alt="" width={48} height={48} />
          <span>
            {name}
            <small>Artesanías</small>
          </span>
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
      <div className="footer-inner">
        <img src="/seal.svg" alt="" width={76} height={76} />
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
