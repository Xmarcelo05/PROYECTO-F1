import { useEffect, useState, useMemo } from 'react';
import { obtenerRankingGlobal } from '../services/resultadosService';
import type { UsuarioRanking } from '../services/resultadosService';
import { getErrorMessage } from '../../../core/api/apiError';
import Card from '../../../shared/components/Card';
import Loader from '../../../shared/components/Loader';
import { useAuth } from '../../../core/hooks/useAuth';

export default function Ranking() {
  const [ranking, setRanking] = useState<UsuarioRanking[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const { usuario } = useAuth();

  useEffect(() => {
    let cancelado = false;
    obtenerRankingGlobal()
      .then((data) => {
        if (!cancelado) {
          setRanking(data);
        }
      })
      .catch((err: unknown) => {
        if (!cancelado) {
          setError(getErrorMessage(err, 'No se pudo cargar el ranking global.'));
        }
      })
      .finally(() => {
        if (!cancelado) {
          setCargando(false);
        }
      });

    return () => {
      cancelado = true;
    };
  }, []);

  const topTres = useMemo(() => {
    return ranking.slice(0, 3);
  }, [ranking]);

  const rankingRestoYFiltrado = useMemo(() => {
    let base = ranking;
    if (busqueda.trim() !== '') {
      base = base.filter((u) => u.nombre.toLowerCase().includes(busqueda.toLowerCase()));
    }
    return base;
  }, [ranking, busqueda]);

  const miPosicion = useMemo(() => {
    if (!usuario) return null;
    return ranking.find((u) => u.nombre === usuario.nombre);
  }, [ranking, usuario]);

  if (cargando) return <Loader mensaje="Cargando ranking global..." />;

  return (
    <div className="stack">
      <div className="page-header">
        <h1>Ranking Global</h1>
        <p>Compara tus puntos acumulados en pronósticos con los demás jugadores.</p>
      </div>

      {error && <p className="form-error">{error}</p>}

      {/* Tarjeta de Resumen del Usuario Logueado */}
      {miPosicion && (
        <Card className="mi-ranking-card" style={{ border: '1px solid var(--f1-red)', background: 'rgba(225, 6, 0, 0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span style={{ textTransform: 'uppercase', fontSize: '0.8rem', color: 'var(--gray-300)', fontWeight: 600 }}>Mi Desempeño</span>
              <h2 style={{ margin: '0.25rem 0 0 0', color: 'var(--gray-100)' }}>{miPosicion.nombre}</h2>
            </div>
            <div style={{ display: 'flex', gap: '2rem' }}>
              <div style={{ textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--gray-300)' }}>Posición</span>
                <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--f1-red)' }}>#{miPosicion.posicion_ranking}</span>
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--gray-300)' }}>Puntos</span>
                <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--gray-100)' }}>{miPosicion.puntos_totales} pts</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Podio Top 3 */}
      {ranking.length > 0 && busqueda === '' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
          {/* Segundo Lugar */}
          {topTres[1] && (
            <Card style={{ textAlign: 'center', borderTop: '4px solid #ccd1d9', order: window.innerWidth < 600 ? 2 : 1 }}>
              <div style={{ fontSize: '2.5rem', margin: '0.5rem 0' }}>🥈</div>
              <h3 style={{ marginBottom: '0.25rem' }}>{topTres[1].nombre}</h3>
              <p style={{ color: 'var(--gray-300)', fontWeight: 'bold' }}>{topTres[1].puntos_totales} pts</p>
              <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>2.º Lugar</span>
            </Card>
          )}

          {/* Primer Lugar */}
          {topTres[0] && (
            <Card style={{ textAlign: 'center', border: '2px solid #ffce54', transform: 'scale(1.05)', boxShadow: '0 8px 24px rgba(255, 206, 84, 0.1)', order: window.innerWidth < 600 ? 1 : 2 }}>
              <div style={{ fontSize: '3rem', margin: '0.5rem 0' }}>👑</div>
              <h3 style={{ marginBottom: '0.25rem', color: '#ffce54' }}>{topTres[0].nombre}</h3>
              <p style={{ fontSize: '1.2rem', color: 'var(--gray-100)', fontWeight: 'bold' }}>{topTres[0].puntos_totales} pts</p>
              <span style={{ fontSize: '0.85rem', color: 'var(--gray-300)', textTransform: 'uppercase', fontWeight: 600 }}>1.er Lugar</span>
            </Card>
          )}

          {/* Tercer Lugar */}
          {topTres[2] && (
            <Card style={{ textAlign: 'center', borderTop: '4px solid #da4453', order: 3 }}>
              <div style={{ fontSize: '2.5rem', margin: '0.5rem 0' }}>🥉</div>
              <h3 style={{ marginBottom: '0.25rem' }}>{topTres[2].nombre}</h3>
              <p style={{ color: 'var(--gray-300)', fontWeight: 'bold' }}>{topTres[2].puntos_totales} pts</p>
              <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>3.er Lugar</span>
            </Card>
          )}
        </div>
      )}

      {/* Buscador */}
      <div className="form-group" style={{ maxWidth: 400, marginBottom: '1.5rem' }}>
        <label htmlFor="search-user">Buscar competidor</label>
        <input
          id="search-user"
          type="text"
          placeholder="Escribe el nombre de usuario..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {/* Tabla General */}
      <Card>
        <div className="table-wrap">
          {rankingRestoYFiltrado.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '2rem 0' }}>No se encontraron usuarios en el ranking.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th style={{ width: '80px', textAlign: 'center' }}>Posición</th>
                  <th>Usuario</th>
                  <th style={{ textAlign: 'right' }}>Puntos Totales</th>
                </tr>
              </thead>
              <tbody>
                {rankingRestoYFiltrado.map((usr) => {
                  const esYo = usuario && usr.nombre === usuario.nombre;
                  return (
                    <tr
                      key={usr.nombre}
                      style={
                        esYo
                          ? { background: 'rgba(225, 6, 0, 0.08)', fontWeight: 'bold' }
                          : {}
                      }
                    >
                      <td style={{ textAlign: 'center' }}>
                        {usr.posicion_ranking === 1 ? (
                          <span style={{ fontSize: '1.1rem' }}>🥇</span>
                        ) : usr.posicion_ranking === 2 ? (
                          <span style={{ fontSize: '1.1rem' }}>🥈</span>
                        ) : usr.posicion_ranking === 3 ? (
                          <span style={{ fontSize: '1.1rem' }}>🥉</span>
                        ) : (
                          `#${usr.posicion_ranking}`
                        )}
                      </td>
                      <td>
                        {usr.nombre} {esYo && <span style={{ color: 'var(--f1-red)', fontSize: '0.75rem', marginLeft: '0.5rem' }}>(Tú)</span>}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>
                        {usr.puntos_totales} pts
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}
