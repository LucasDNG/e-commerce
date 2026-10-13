import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, media, type Product, type Section } from '../api';
import { formatMoney } from '../format';

export function Catalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [currency, setCurrency] = useState('ARS');
  const [sectionId, setSectionId] = useState('all');
  const [search, setSearch] = useState('');
  const [ordering, setOrdering] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([api<Product[]>('/api/admin/products'), api<Section[]>('/api/admin/sections'), api<{ currency: string }>('/api/admin/settings')])
      .then(([nextProducts, nextSections, settings]) => {
        if (!active) return;
        setProducts(nextProducts);
        setSections(nextSections);
        setCurrency(settings.currency);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'No se pudo cargar el catálogo');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const visible = useMemo(() => {
    const query = ordering ? '' : search.trim().toLowerCase();
    return products
      .filter((product) => {
        if (sectionId === 'none') return product.sectionId === null;
        if (sectionId !== 'all') return product.sectionId === sectionId;
        return true;
      })
      .filter((product) => !query || product.name.toLowerCase().includes(query) || product.sku.toLowerCase().includes(query))
      .sort((a, b) => {
        if (sectionId === 'all') {
          const rank = (id: string | null) => (id ? sections.findIndex((section) => section.id === id) : sections.length);
          const bySection = rank(a.sectionId) - rank(b.sectionId);
          if (bySection !== 0) return bySection;
        }
        return a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'es');
      });
  }, [ordering, products, search, sectionId]);

  async function togglePublished(product: Product) {
    setError(null);
    try {
      const updated = await api<Product>(`/api/admin/products/${product.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ published: !product.published }),
      });
      setProducts((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo actualizar');
    }
  }

  async function remove(product: Product) {
    setError(null);
    try {
      await api(`/api/admin/products/${product.id}`, { method: 'DELETE' });
      setProducts((current) => current.filter((item) => item.id !== product.id));
      setConfirmId(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo borrar');
    }
  }

  async function move(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= visible.length) return;
    const next = [...visible];
    const [item] = next.splice(index, 1);
    next.splice(nextIndex, 0, item);
    setProducts((current) =>
      current.map((product) => {
        const position = next.findIndex((entry) => entry.id === product.id);
        return position === -1 ? product : { ...product, sortOrder: position };
      }),
    );
    try {
      await api('/api/admin/products/reorder', {
        method: 'POST',
        body: JSON.stringify({
          sectionId: sectionId === 'none' ? null : sectionId,
          ids: next.map((product) => product.id),
        }),
      });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo reordenar');
    }
  }

  const sectionName = (id: string | null) => sections.find((section) => section.id === id)?.name ?? 'Sin sección';

  return (
    <>
      <header className="top bar">
        <div>
          <p className="eyebrow">Catálogo</p>
          <h1>Productos</h1>
        </div>
        <Link to="/producto/nuevo" className="btn">
          Subir
        </Link>
      </header>
      {error && <p className="error">{error}</p>}
      <input
        className="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Buscar"
        disabled={ordering}
      />
      <div className="chips">
        <button type="button" className={sectionId === 'all' ? 'on' : ''} onClick={() => { setSectionId('all'); setOrdering(false); }}>
          Todas
        </button>
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            className={sectionId === section.id ? 'on' : ''}
            onClick={() => { setSectionId(section.id); setOrdering(false); }}
          >
            {section.name}
          </button>
        ))}
        <button type="button" className={sectionId === 'none' ? 'on' : ''} onClick={() => { setSectionId('none'); setOrdering(false); }}>
          Sin sección
        </button>
      </div>
      {sectionId !== 'all' && (
        <button type="button" className="btn ghost" onClick={() => setOrdering((value) => !value)}>
          {ordering ? 'Terminar de ordenar' : 'Ordenar'}
        </button>
      )}
      {loading && <p className="muted">Cargando…</p>}
      {!loading && visible.length === 0 && <p className="muted">Todavía no hay productos en esta vista.</p>}
      <ul className="list">
        {visible.map((product, index) => (
          <li key={product.id} className="card row">
            {product.imageUrl ? <img src={media(product.imageUrl) ?? ''} alt="" /> : <div className="ph" />}
            <div className="grow">
              <strong>{product.name}</strong>
              <p>
                {formatMoney(product.priceCents, currency)} · {product.stock} en stock
                {sectionId === 'all' ? ` · ${sectionName(product.sectionId)}` : ''}
              </p>
              <p className={product.published ? 'good' : 'muted'}>{product.published ? 'Publicado' : 'Bajado'}</p>
              {ordering ? (
                <div className="actions">
                  <button type="button" className="btn ghost" disabled={index === 0} onClick={() => void move(index, -1)}>
                    Arriba
                  </button>
                  <button type="button" className="btn ghost" disabled={index === visible.length - 1} onClick={() => void move(index, 1)}>
                    Abajo
                  </button>
                </div>
              ) : (
                <div className="actions">
                  <Link className="btn ghost" to={`/producto/${product.id}`}>
                    Editar
                  </Link>
                  <button type="button" className="btn ghost" onClick={() => void togglePublished(product)}>
                    {product.published ? 'Bajar' : 'Publicar'}
                  </button>
                  {confirmId === product.id ? (
                    <button type="button" className="btn danger" onClick={() => void remove(product)}>
                      Confirmar
                    </button>
                  ) : (
                    <button type="button" className="btn ghost" onClick={() => setConfirmId(product.id)}>
                      Borrar
                    </button>
                  )}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
