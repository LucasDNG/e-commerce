import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setToken, type Admin } from '../api';

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@vitrina.local');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await api<{ token: string; admin: Admin }>('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setToken(result.token);
      navigate('/');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo entrar');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login">
      <p className="eyebrow">Administración</p>
      <h1>Vitrina</h1>
      <p className="muted">Subí, ordená y bajá los productos desde el teléfono.</p>
      <form onSubmit={submit} className="stack">
        <label>
          Email
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" required />
        </label>
        <label>
          Contraseña
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn" type="submit" disabled={busy}>
          {busy ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
      <p className="hint">En el teléfono, abrí el menú del navegador y elegí Agregar a inicio. Queda como una app.</p>
    </main>
  );
}
