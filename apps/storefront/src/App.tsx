import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { CartProvider } from './cart';
import { Footer, Header } from './components/Header';
import { StoneField } from './components/Stones';
import { CartPage } from './pages/Cart';
import { CheckoutPage } from './pages/Checkout';
import { Home } from './pages/Home';
import { OrderPage } from './pages/Order';
import { ProductPage } from './pages/Product';
import { ShopProvider } from './shop';

function NotFound() {
  return (
    <div className="mx-3 my-4 max-w-xl rounded-[2rem] bg-paper px-6 py-16 ring-1 ring-gold/30 md:mx-auto md:my-8">
      <h1 className="font-serif text-5xl tracking-tight">Esa página no está</h1>
      <a className="mt-6 inline-block text-sm underline underline-offset-4" href="/">
        Volver a la tienda
      </a>
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <ShopProvider>
        <CartProvider>
          <div className="relative min-h-dvh bg-transparent font-sans text-ink antialiased">
            <StoneField />
            <a className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-card" href="#contenido">
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
