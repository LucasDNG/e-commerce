import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { CartProvider } from './cart';
import { Footer, Header } from './components/Header';
import { CartPage } from './pages/Cart';
import { CheckoutPage } from './pages/Checkout';
import { Home } from './pages/Home';
import { OrderPage } from './pages/Order';
import { ProductPage } from './pages/Product';
import { ShopProvider } from './shop';

function NotFound() {
  return (
    <div className="narrow">
      <h1>Esa página no está</h1>
      <a href="/">Volver a la tienda</a>
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <ShopProvider>
        <CartProvider>
          <div className="site">
            <a className="skip" href="#contenido">
              Saltar al contenido
            </a>
            <Header />
            <main id="contenido">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/producto/:slug" element={<ProductPage />} />
                <Route path="/carrito" element={<CartPage />} />
                <Route path="/pagar" element={<CheckoutPage />} />
                <Route path="/pedido/:token" element={<OrderPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </CartProvider>
      </ShopProvider>
    </BrowserRouter>
  );
}
