import { FormEvent, useEffect, useState } from 'react';
import { api, type Section } from '../api';

export function Sections() {
  const [sections, setSections] = useState<Section[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const [draftDescription, setDraftDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    api<Section[]>('/api/admin/sections')
      .then(setSections)
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'No se pudieron cargar las secciones'));
  }, []);

  async function create(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      const created = await api<Section>('/api/admin/sections', {
        method: 'POST',
        body: JSON.stringify({ name, description, visible: true }),
      });
      setSections((current) => [...current, created]);
      setName('');
      setDescription('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo crear la sección');
    }
  }

  async function save(section: Section) {
    setError(null);
    try {
      const updated = await api<Section>(`/api/admin/sections/${section.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: draftName, description: draftDescription }),
      });
      setSections((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setEditing(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo guardar');
    }
  }

  async function toggle(section: Section) {
    const updated = await api<Section>(`/api/admin/sections/${section.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ visible: !section.visible }),
    });
    setSections((current) => current.map((item) => (item.id === updated.id ? updated : item)));
  }

  async function remove(section: Section) {
    setError(null);
    try {
      await api(`/api/admin/sections/${section.id}`, { method: 'DELETE' });
      setSections((current) => current.filter((item) => item.id !== section.id));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo borrar');
    }
  }

  async function move(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= sections.length) return;
    const next = [...sections];
    const [item] = next.splice(index, 1);
    next.splice(nextIndex, 0, item);
    setSections(next);
    try {
      const saved = await api<Section[]>('/api/admin/sections/reorder', {
        method: 'POST',
        body: JSON.stringify({ ids: next.map((section) => section.id) }),
      });
      setSections(saved);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo reordenar');
    }
  }

  return (
    <>
      <header className="top">
        <p className="eyebrow">Orden</p>
        <h1>Secciones</h1>
      </header>
      {error && <p className="error">{error}</p>}
      <form onSubmit={create} className="card stack">
        <label>
          Nueva sección
          <input value={name} onChange={(event) => setName(event.target.value)} required />
        </label>
        <label>
          Descripción
          <input value={description} onChange={(event) => setDescription(event.target.value)} />
        </label>
        <button className="btn" type="submit">
          Agregar
        </button>
      </form>
      <ul className="list">
        {sections.map((section, index) => (
          <li key={section.id} className="card stack">
            {editing === section.id ? (
              <>
                <input value={draftName} onChange={(event) => setDraftName(event.target.value)} />
                <input value={draftDescription} onChange={(event) => setDraftDescription(event.target.value)} />
                <button type="button" className="btn" onClick={() => void save(section)}>
                  Guardar
                </button>
              </>
            ) : (
              <>
                <strong>{section.name}</strong>
                <p className="muted">
                  {section.productCount} productos · {section.visible ? 'Visible' : 'Oculta'}
                </p>
                {section.description && <p>{section.description}</p>}
              </>
            )}
            <div className="actions">
              <button type="button" className="btn ghost" disabled={index === 0} onClick={() => void move(index, -1)}>
                Arriba
              </button>
              <button type="button" className="btn ghost" disabled={index === sections.length - 1} onClick={() => void move(index, 1)}>
                Abajo
              </button>
              <button type="button" className="btn ghost" onClick={() => void toggle(section)}>
                {section.visible ? 'Ocultar' : 'Mostrar'}
              </button>
              <button
                type="button"
                className="btn ghost"
                onClick={() => {
                  setEditing(section.id);
                  setDraftName(section.name);
                  setDraftDescription(section.description);
                }}
              >
                Editar
              </button>
              {confirmId === section.id ? (
                <button type="button" className="btn danger" onClick={() => void remove(section)}>
                  Confirmar
                </button>
              ) : (
                <button type="button" className="btn ghost" onClick={() => setConfirmId(section.id)}>
                  Borrar
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
