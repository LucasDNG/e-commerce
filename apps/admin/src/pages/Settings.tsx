import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, download, setToken, type Admin, type Shop } from '../api';

export function Settings() {
  const navigate = useNavigate();
  const [shop, setShop] = useState<Shop | null>(null);
  const [me, setMe] = useState<Admin | null>(null);
  const [storeName, setStoreName] = useState('');
  const [tagline, setTagline] = useState('');
  const [currency, setCurrency] = useState('ARS');
  const [contactEmail, setContactEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api<Shop>('/api/admin/settings'), api<Admin>('/api/admin/me')])
      .then(([settings, admin]) => {
        setShop(settings);
        setMe(admin);
        setStoreName(settings.storeName);
        setTagline(settings.tagline);
        setCurrency(settings.currency);
        setContactEmail(settings.contactEmail);
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'No se pudieron cargar los ajustes'));
  }, []);

  async function save(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    try {
      const updated = await api<Shop>('/api/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify({ storeName, tagline, currency, contactEmail }),
      });
      setShop(updated);
      setNotice('Guardado');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo guardar');
    }
  }

  return (
    <>
      <header className="top">
        <p className="eyebrow">Tienda</p>
        <h1>Ajustes</h1>
      </header>
      {error && <p className="error">{error}</p>}
      {notice && <p className="good">{notice}</p>}
      <form onSubmit={save} className="stack">
        <label>
          Nombre
          <input value={storeName} onChange={(event) => setStoreName(event.target.value)} required />
        </label>
        <label>
          Frase de portada
          <input value={tagline} onChange={(event) => setTagline(event.target.value)} />
        </label>
        <label>
          Moneda
          <select value={currency} onChange={(event) => setCurrency(event.target.value)}>
            {(shop?.currencies ?? ['ARS', 'USD', 'EUR', 'MXN', 'CLP', 'UYU', 'BRL', 'COP']).map((code) => (
              <option key={code}>{code}</option>
            ))}
          </select>
        </label>
        <label>
          Email de contacto
          <input type="email" value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} />
        </label>
        <button className="btn" type="submit">
          Guardar
        </button>
      </form>
      <section className="card stack">
        <strong>{shop?.paymentMode === 'stripe' ? 'Stripe conectado' : 'Pago de demostración'}</strong>
        <p className="muted">
          {shop?.paymentMode === 'stripe'
            ? 'El cliente paga con tarjeta dentro de la tienda.'
            : 'Sin claves de Stripe, la tienda cobra en la página con la tarjeta de prueba 4242 4242 4242 4242. Para un cliente real, completá STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY y STRIPE_WEBHOOK_SECRET.'}
        </p>
      </section>
      <section className="stack">
        <button type="button" className="btn ghost" onClick={() => void download('/api/admin/export.csv', 'catalogo.csv').catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Error'))}>
          Descargar CSV
        </button>
        <button type="button" className="btn ghost" onClick={() => void download('/api/admin/export.json', 'catalogo.json').catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Error'))}>
          Descargar JSON
        </button>
      </section>
      <p className="muted">{me?.email}</p>
      <button
        type="button"
        className="btn ghost"
        onClick={() => {
          setToken(null);
          navigate('/login');
        }}
      >
        Cerrar sesión
      </button>
    </>
  );
}
