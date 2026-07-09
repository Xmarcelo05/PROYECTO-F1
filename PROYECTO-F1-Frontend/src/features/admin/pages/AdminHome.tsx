import { Link } from 'react-router-dom';
import Card from '../../../shared/components/Card';

const secciones = [
  { to: '/admin/grandes-premios', titulo: 'Grandes Premios', desc: 'Crear, editar y eliminar Grandes Premios.' },
  { to: '/admin/pilotos', titulo: 'Pilotos', desc: 'Crear, editar y eliminar pilotos.' },
  { to: '/admin/escuderias', titulo: 'Escuderías', desc: 'Crear, editar y eliminar escuderías.' },
  { to: '/admin/resultados', titulo: 'Resultados oficiales', desc: 'Registrar el resultado oficial de un Gran Premio.' },
];

export default function AdminHome() {
  return (
    <div className="stack">
      <div className="page-header">
        <h1>Administración</h1>
        <p>Gestión de datos maestros de la temporada.</p>
      </div>

      <div className="grid grid-2">
        {secciones.map((s) => (
          <Link key={s.to} to={s.to} style={{ textDecoration: 'none' }}>
            <Card>
              <h3>{s.titulo}</h3>
              <p>{s.desc}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
