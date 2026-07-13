import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { restablecerPassword } from '../services/authService';
import { getErrorMessage } from '../../../core/api/apiError';
import Card from '../../../shared/components/Card';
import Button from '../../../shared/components/Button';

function validarPassword(password: string): string | null {
  if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
  if (!/[A-Z]/.test(password)) return 'La contraseña debe tener al menos una mayúscula.';
  if (!/[0-9]/.test(password)) return 'La contraseña debe tener al menos un número.';
  return null;
}

export default function RestablecerPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function manejarSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);

    if (!token) {
      setError('El enlace de recuperación no es válido. Solicita uno nuevo.');
      return;
    }

    const errorPassword = validarPassword(nuevaPassword);
    if (errorPassword) {
      setError(errorPassword);
      return;
    }

    if (nuevaPassword !== confirmarPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setEnviando(true);
    try {
      await restablecerPassword(token, nuevaPassword);
      navigate('/login', {
        replace: true,
        state: { mensaje: 'Contraseña actualizada correctamente. Ya puedes iniciar sesión.' },
      });
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo restablecer la contraseña. El enlace puede haber expirado.'));
    } finally {
      setEnviando(false);
    }
  }

  if (!token) {
    return (
      <div className="stack" style={{ maxWidth: 420, margin: '2rem auto' }}>
        <div className="page-header">
          <h1>Enlace inválido</h1>
          <p>El enlace de recuperación no es válido o ya expiró.</p>
        </div>
        <Card>
          <p className="form-error">Solicita un nuevo enlace para restablecer tu contraseña.</p>
        </Card>
        <p className="text-muted" style={{ textAlign: 'center' }}>
          <Link to="/recuperar-cuenta">Solicitar nuevo enlace</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="stack" style={{ maxWidth: 420, margin: '2rem auto' }}>
      <div className="page-header">
        <h1>Nueva contraseña</h1>
        <p>Crea una nueva contraseña para recuperar el acceso a tu cuenta.</p>
      </div>

      <Card>
        <form className="form" onSubmit={manejarSubmit}>
          {error && <p className="form-error">{error}</p>}

          <div className="form-group">
            <label htmlFor="nuevaPassword">Nueva contraseña</label>
            <input
              id="nuevaPassword"
              type="password"
              autoComplete="new-password"
              required
              value={nuevaPassword}
              onChange={(e) => setNuevaPassword(e.target.value)}
            />
            <span className="text-muted">Mínimo 8 caracteres, una mayúscula y un número.</span>
          </div>

          <div className="form-group">
            <label htmlFor="confirmarPassword">Confirmar contraseña</label>
            <input
              id="confirmarPassword"
              type="password"
              autoComplete="new-password"
              required
              value={confirmarPassword}
              onChange={(e) => setConfirmarPassword(e.target.value)}
            />
          </div>

          <Button type="submit" disabled={enviando}>
            {enviando ? 'Guardando...' : 'Restablecer contraseña'}
          </Button>
        </form>
      </Card>

      <p className="text-muted" style={{ textAlign: 'center' }}>
        <Link to="/login">Volver al inicio de sesión</Link>
      </p>
    </div>
  );
}
