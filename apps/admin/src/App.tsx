import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Phone, RequireAuth } from './components/Shell';
import { Catalog } from './pages/Catalog';
import { Login } from './pages/Login';
import { Orders } from './pages/Orders';
import { ProductForm } from './pages/ProductForm';
import { Sections } from './pages/Sections';
import { Settings } from './pages/Settings';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Phone />}>
          <Route path="/login" element={<Login />} />
          <Route element={<RequireAuth />}>
            <Route path="/" element={<Catalog />} />
            <Route path="/secciones" element={<Sections />} />
            <Route path="/pedidos" element={<Orders />} />
            <Route path="/ajustes" element={<Settings />} />
            <Route path="/producto/nuevo" element={<ProductForm />} />
            <Route path="/producto/:id" element={<ProductForm />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
