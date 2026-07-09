import { useEffect, useState } from 'react';
import { clasificacionPilotos, listarPilotos } from '../services/competenciaService';
import type { PilotoConEscuderia } from '../services/competenciaService';
import { getErrorMessage } from '../../../core/api/apiError';
import Loader from '../../../shared/components/Loader';
import Button from '../../../shared/components/Button';

type Vista = 'listado' | 'clasificacion';

const TEMPORADA_ACTUAL = new Date().getFullYear();

export default function Pilotos() {
  const [vista, setVista] = useState<Vista>('clasificacion');
  const [temporada, setTemporada] = useState<number>(TEMPORADA_ACTUAL);
  const [pilotos, setPilotos] = useState<PilotoConEscuderia[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    setCargando(true);
    setError(null);

    const promesa = vista === 'clasificacion' ? clasificacionPilotos(temporada) : listarPilotos(temporada);

    promesa
      .then((data) => {
        if (!cancelado) setPilotos(data);
      })
      .catch((err: unknown) => {
        if (!cancelado) setError(getErrorMessage(err, 'No se pudo cargar los pilotos.'));
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [vista, temporada]);

  return (
    <div className="stack">
      <div className="page-header flex-between">
        <div>
          <h1>Pilotos</h1>
          <p>Listado y clasificación del campeonato de pilotos.</p>
        </div>
        <div className="form-group" style={{ minWidth: 140 }}>
          <label htmlFor="temporada">Temporada</label>
          <input
            id="temporada"
            type="number"
            value={temporada}
            onChange={(e) => setTemporada(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="flex-between">
        <Button
          variante={vista === 'clasificacion' ? 'primary' : 'secondary'}
          tamano="sm"
          onClick={() => setVista('clasificacion')}
        >
          Clasificación
        </Button>
        <Button
          variante={vista === 'listado' ? 'primary' : 'secondary'}
          tamano="sm"
          onClick={() => setVista('listado')}
        >
          Listado completo
        </Button>
      </div>

      {cargando && <Loader mensaje="Cargando pilotos..." />}
      {error && <p className="form-error">{error}</p>}

      {!cargando && !error && pilotos.length === 0 && (
        <div className="empty-state">No hay pilotos registrados para esta temporada.</div>
      )}

      {!cargando && !error && pilotos.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {vista === 'clasificacion' && <th>#</th>}
                <th>Piloto</th>
                <th>Número</th>
                <th>Nacionalidad</th>
                <th>Escudería</th>
                <th>Puntos</th>
              </tr>
            </thead>
            <tbody>
              {pilotos.map((piloto, index) => (
                <tr key={piloto.id}>
                  {vista === 'clasificacion' && <td>{index + 1}</td>}
                  <td>{piloto.nombre}</td>
                  <td>{piloto.numero ?? '—'}</td>
                  <td>{piloto.nacionalidad ?? '—'}</td>
                  <td>
                    {piloto.escuderia ? (
                      <span style={{ color: piloto.escuderia.color ?? undefined }}>
                        {piloto.escuderia.nombre}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>{piloto.puntos_temporada}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
