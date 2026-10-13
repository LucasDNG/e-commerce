import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, media, type Product, type Section } from '../api';
import { centsToMajor, majorToCents } from '../format';

export function ProductForm() {
  const { id } = useParams();
  const creating = !id || id === 'nuevo';
  const navigate = useNavigate();
  const [sections, setSections] = useState<Section[]>([]);
  const [name, setName] = useState('');
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [compare, setCompare] = useState('');
  const [sku, setSku] = useState('');
  const [stock, setStock] = useState('0');
  const [sectionId, setSectionId] = useState('');
  const [published, setPublished] = useState(false);
  const [images, setImages] = useState<Product['images']>([]);
  const [pending, setPending] = useState<{ file: File; url: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api<Section[]>('/api/admin/sections')
      .then((rows) => {
        if (active) setSections(rows);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'No se pudieron cargar las secciones');
      });
    if (!creating && id) {
      api<Product>(`/api/admin/products/${id}`)
        .then((product) => {
          if (!active) return;
          setName(product.name);
          setSummary(product.summary);
          setDescription(product.description);
          setPrice(centsToMajor(product.priceCents));
          setCompare(product.compareAtCents === null ? '' : centsToMajor(product.compareAtCents));
          setSku(product.sku);
          setStock(String(product.stock));
          setSectionId(product.sectionId ?? '');
          setPublished(product.published);
          setImages(product.images);
        })
        .catch((reason: unknown) => {
          if (active) setError(reason instanceof Error ? reason.message : 'Producto no encontrado');
        });
    }
    return () => {
      active = false;
    };
  }, [creating, id]);

  function payload() {
    const priceCents = majorToCents(price);
    const compareAtCents = compare.trim() === '' ? null : majorToCents(compare);
    const stockValue = Number(stock);
    if (priceCents === null) throw new Error('El precio tiene que ser un número. Usá punto para los centavos.');
    if (compare.trim() !== '' && compareAtCents === null) throw new Error('El precio anterior no es válido');
    if (!Number.isInteger(stockValue) || stockValue < 0) throw new Error('El stock tiene que ser un entero');
    return {
      name,
      summary,
      description,
      priceCents,
      compareAtCents,
      sku,
      stock: stockValue,
      sectionId: sectionId || null,
      published,
    };
  }

  async function uploadFiles(productId: string, files: File[]) {
    if (files.length === 0) return null;
    const body = new FormData();
    for (const file of files) {
      if (file.size > 4 * 1024 * 1024) throw new Error('Cada foto puede pesar hasta 4 MB');
      body.append('images', file);
    }
    return api<Product>(`/api/admin/products/${productId}/images`, { method: 'POST', body });
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const body = JSON.stringify(payload());
      if (creating) {
        let productId = createdId;
        if (!productId) {
          const created = await api<Product>('/api/admin/products', { method: 'POST', body });
          productId = created.id;
          setCreatedId(productId);
        } else {
          await api(`/api/admin/products/${productId}`, { method: 'PATCH', body });
        }
        if (pending.length > 0) await uploadFiles(productId, pending.map((item) => item.file));
        navigate('/');
        return;
      }
      const updated = await api<Product>(`/api/admin/products/${id}`, { method: 'PATCH', body });
      setImages(updated.images);
      setNotice('Guardado');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo guardar');
    } finally {
      setBusy(false);
    }
  }

  async function addPhotos(files: FileList | null) {
    if (!files || files.length === 0) return;
    const list = [...files];
    if (creating) {
      setPending((current) =>
        [...current, ...list.map((file) => ({ file, url: URL.createObjectURL(file) }))].slice(0, 6),
      );
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const updated = await uploadFiles(id ?? '', list);
      if (updated) setImages(updated.images);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo subir la foto');
    } finally {
      setBusy(false);
    }
  }

  async function removeImage(imageId: string) {
    if (!id) return;
    setError(null);
    try {
      const updated = await api<Product>(`/api/admin/products/${id}/images/${imageId}`, { method: 'DELETE' });
      setImages(updated.images);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo borrar la foto');
    }
  }

  async function removeProduct() {
    if (!id) return;
    setBusy(true);
    try {
      await api(`/api/admin/products/${id}`, { method: 'DELETE' });
      navigate('/');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo borrar');
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="stack form">
      <header className="form-bar">
        <Link to="/">Cerrar</Link>
        <strong>{creating ? 'Subir producto' : 'Editar'}</strong>
        <button type="submit" disabled={busy}>
          {busy ? '…' : 'Guardar'}
        </button>
      </header>
      {error && <p className="error">{error}</p>}
      {notice && <p className="good">{notice}</p>}
      <div className="photos">
        {images.map((image, index) => (
          <figure key={image.id}>
            {image.url && <img src={media(image.url) ?? ''} alt={image.alt} />}
            {index === 0 && <figcaption>Portada</figcaption>}
            <button type="button" onClick={() => void removeImage(image.id)}>
              Quitar
            </button>
          </figure>
        ))}
        {pending.map((item) => (
          <figure key={item.url}>
            <img src={item.url} alt="" />
          </figure>
        ))}
        <label className="add-photo">
          Fotos
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={(event) => {
              void addPhotos(event.target.files);
              event.target.value = '';
            }}
          />
        </label>
      </div>
      <label>
        Nombre
        <input value={name} onChange={(event) => setName(event.target.value)} required />
      </label>
      <label>
        Resumen
        <input value={summary} onChange={(event) => setSummary(event.target.value)} />
      </label>
      <label>
        Descripción
        <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={5} />
      </label>
      <div className="pair">
        <label>
          Precio
          <input inputMode="decimal" value={price} onChange={(event) => setPrice(event.target.value)} required />
        </label>
        <label>
          Precio anterior
          <input inputMode="decimal" value={compare} onChange={(event) => setCompare(event.target.value)} />
        </label>
      </div>
      <div className="pair">
        <label>
          Stock
          <input inputMode="numeric" value={stock} onChange={(event) => setStock(event.target.value)} required />
        </label>
        <label>
          SKU
          <input value={sku} onChange={(event) => setSku(event.target.value)} />
        </label>
      </div>
      <label>
        Sección
        <select value={sectionId} onChange={(event) => setSectionId(event.target.value)}>
          <option value="">Sin sección</option>
          {sections.map((section) => (
            <option key={section.id} value={section.id}>
              {section.name}
            </option>
          ))}
        </select>
      </label>
      <button type="button" className={published ? 'switch on' : 'switch'} role="switch" aria-checked={published} onClick={() => setPublished((value) => !value)}>
        <span />
        {published ? 'Publicado en la tienda' : 'Bajado, no se ve en la tienda'}
      </button>
      {!creating && (
        <div className="danger-zone">
          {confirmDelete ? (
            <button type="button" className="btn danger" onClick={() => void removeProduct()}>
              Confirmar borrado
            </button>
          ) : (
            <button type="button" className="btn ghost" onClick={() => setConfirmDelete(true)}>
              Borrar producto
            </button>
          )}
        </div>
      )}
    </form>
  );
}
