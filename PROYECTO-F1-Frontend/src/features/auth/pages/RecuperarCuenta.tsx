import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { solicitarRecuperacionCuenta } from '../services/authService';
import { getErrorMessage } from '../../../core/api/apiError';
import Card from '../../../shared/components/Card';
import Button from '../../../shared/components/Button';

export default function RecuperarCuenta() {
  const [correo, setCorreo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function manejarSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);
    setMensajeExito(null);
    setEnviando(true);

    try {
      await solicitarRecuperacionCuenta(correo);
      setMensajeExito(
        'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña. Revisa tu bandeja de entrada y la carpeta de spam.'
      );
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo enviar el enlace de recuperación.'));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="stack" style={{ maxWidth: 420, margin: '2rem auto' }}>
      <div className="page-header">
        <h1>Recuperar cuenta</h1>
        <p>Te enviaremos un enlace a tu correo para restablecer tu contraseña.</p>
      </div>

      <Card>
        <form className="form" onSubmit={manejarSubmit}>
          {error && <p className="form-error">{error}</p>}
          {mensajeExito && <p className="form-success">{mensajeExito}</p>}

          <div className="form-group">
            <label htmlFor="correo">Correo electrónico</label>
            <input
              id="correo"
              type="email"
              autoComplete="email"
              required
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="ejemplo@correo.com"
            />
          </div>

          <Button type="submit" disabled={enviando || !!mensajeExito}>
            {enviando ? 'Enviando...' : 'Enviar enlace de recuperación'}
          </Button>
        </form>
      </Card>

      <p className="text-muted" style={{ textAlign: 'center' }}>
        ¿Recordaste tu contraseña? <Link to="/login">Volver al inicio de sesión</Link>
      </p>
    </div>
  );
}
