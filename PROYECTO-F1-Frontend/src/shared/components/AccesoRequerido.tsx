import { Link } from 'react-router-dom';
import Card from './Card';

interface AccesoRequeridoProps {
  mensaje?: string;
}

// Se muestra cuando el backend responde 402 (verificar_acceso): el usuario ya usó
// su Gran Premio gratuito y este contenido requiere un pase de temporada.
export default function AccesoRequerido({
  mensaje = 'Este contenido requiere tu Gran Premio gratuito asignado o un pase de temporada activo.',
}: AccesoRequeridoProps) {
  return (
    <Card className="paywall">
      <div className="paywall__icon" aria-hidden="true">🔒</div>
      <h3>Contenido bloqueado</h3>
      <p>{mensaje}</p>
      
      <div style={{ marginTop: '1.25rem' }}>
        <Link to="/perfil" className="btn btn-primary">
          Comprar pase
        </Link>
      </div>

      <p className="text-muted" style={{ marginTop: '1rem' }}>
        <Link to="/calendario">Volver al calendario</Link>
      </p>
    </Card>
  );
}
