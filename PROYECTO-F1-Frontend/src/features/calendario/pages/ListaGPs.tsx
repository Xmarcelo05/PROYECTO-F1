import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { listarCalendario } from '../services/calendarioService';
import type { GranPremioCalendario } from '../services/calendarioService';
import { getErrorMessage } from '../../../core/api/apiError';
import Loader from '../../../shared/components/Loader';

const TEMPORADA_ACTUAL = new Date().getFullYear();
const DIAS_SEMANA = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

function fechaLocal(fechaStr: string | Date): Date {
  // Aseguramos que la fecha se procese correctamente como hora local
  return new Date(fechaStr);
}

function formatearHora(fechaStr: string | Date): string {
  const fecha = new Date(fechaStr);
  return fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

function estadoEvento(estado: string): string {
  if (estado === 'finalizado') return 'Finalizado';
  if (estado === 'en_curso') return 'En curso';
  return 'Próximo';
}

function obtenerMeses(gps: GranPremioCalendario[]): Array<[string, GranPremioCalendario[]]> {
  const meses = new Map<string, GranPremioCalendario[]>();
  gps.forEach((gp) => {
    const fecha = new Date(gp.fecha_carrera);
    const clave = `${fecha.getFullYear()}-${fecha.getMonth()}`;
    meses.set(clave, [...(meses.get(clave) ?? []), gp]);
  });
  // Ordenar los meses cronológicamente
  return [...meses.entries()].sort((a, b) => {
    const [yearA, monthA] = a[0].split('-').map(Number);
    const [yearB, monthB] = b[0].split('-').map(Number);
    if (yearA !== yearB) return yearA - yearB;
    return monthA - monthB;
  });
}

function diasDelMes(fecha: Date): Array<Date | null> {
  const year = fecha.getFullYear();
  const month = fecha.getMonth();
  const primerDia = new Date(year, month, 1);
  // primerDia.getDay() devuelve 0 para Domingo, 1 para Lunes, etc.
  // Ajustamos desplazamiento para empezar la semana en Lunes (0: Lun, 1: Mar ... 6: Dom)
  const desplazamiento = (primerDia.getDay() + 6) % 7;
  const totalDias = new Date(year, month + 1, 0).getDate();
  return [
    ...Array<Date | null>(desplazamiento).fill(null),
    ...Array.from({ length: totalDias }, (_, i) => new Date(year, month, i + 1)),
  ];
}

export default function ListaGPs() {
  const [grandesPremios, setGrandesPremios] = useState<GranPremioCalendario[]>([]);
  const [temporada, setTemporada] = useState(TEMPORADA_ACTUAL);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    setCargando(true);
    setError(null);

    listarCalendario(temporada)
      .then((data) => {
        if (!cancelado) {
          setGrandesPremios(data);
        }
      })
      .catch((err: unknown) => {
        if (!cancelado) {
          setError(getErrorMessage(err, 'No se pudo cargar el calendario.'));
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
  }, [temporada]);

  const mesesConGPs = useMemo(() => obtenerMeses(grandesPremios), [grandesPremios]);

  return (
    <div className="stack">
      <div className="page-header flex-between">
        <div>
          <h1>Calendario </h1>
          <p>Consulta las carreras programadas de la temporada y haz tus pronósticos.</p>
        </div>
        <div className="form-group" style={{ minWidth: 160 }}>
          <label htmlFor="temporada">Temporada</label>
          <input
            id="temporada"
            type="number"
            value={temporada}
            onChange={(e) => setTemporada(Number(e.target.value))}
          />
        </div>
      </div>

      {cargando && <Loader mensaje="Cargando calendario..." />}
      {error && <p className="form-error">{error}</p>}
      {!cargando && !error && grandesPremios.length === 0 && (
        <div className="empty-state">No hay Grandes Premios registrados en la base de datos para esta temporada.</div>
      )}

      {!cargando && !error && grandesPremios.length > 0 && (
        <div className="calendario-meses">
          {mesesConGPs.map(([clave, gpsMes]) => {
            const fechaMes = fechaLocal(gpsMes[0].fecha_carrera);
            
            // Agrupar GPs del mes por el día de la carrera
            const gpsPorDia = new Map<number, GranPremioCalendario[]>();
            gpsMes.forEach((gp) => {
              const dia = fechaLocal(gp.fecha_carrera).getDate();
              gpsPorDia.set(dia, [...(gpsPorDia.get(dia) ?? []), gp]);
            });

            return (
              <section key={clave} className="calendario-mes">
                <h2 style={{ textTransform: 'capitalize' }}>
                  {fechaMes.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                </h2>
                <div className="calendario-semana" aria-hidden="true">
                  {DIAS_SEMANA.map((dia) => (
                    <span key={dia}>{dia}</span>
                  ))}
                </div>
                <div className="calendario-cuadricula">
                  {diasDelMes(fechaMes).map((dia, indice) => {
                    const diaNumero = dia?.getDate();
                    const gpsDeHoy = diaNumero ? gpsPorDia.get(diaNumero) ?? [] : [];

                    return (
                      <div
                        key={dia?.toISOString() ?? `vacio-${indice}`}
                        className={`calendario-dia${dia ? '' : ' calendario-dia--vacio'}`}
                      >
                        {dia && <span className="calendario-dia__numero">{dia.getDate()}</span>}
                        {dia &&
                          gpsDeHoy.map((gp) => {
                            const estaFinalizado = gp.estado === 'finalizado';
                            const colorBorde = estaFinalizado
                              ? 'var(--gray-500)'
                              : gp.estado === 'en_curso'
                              ? '#ffce54'
                              : 'var(--f1-red)';

                            return (
                              <Link
                                key={gp.id}
                                to={`/calendario/${gp.id}`}
                                className="calendario-evento"
                                style={{
                                  borderLeftColor: colorBorde,
                                  textDecoration: 'none',
                                  cursor: 'pointer',
                                  transition: 'transform 0.15s ease, background-color 0.15s ease',
                                  display: 'block',
                                }}
                                title={`${gp.circuito} · ${gp.pais} (Clic para ver detalle y pronosticar)`}
                              >
                                <strong>R{gp.ronda}</strong>
                                <span style={{ display: 'block', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {gp.nombre}
                                </span>
                                <small style={{ display: 'block', color: 'var(--gray-300)', fontSize: '0.7rem' }}>
                                  {estadoEvento(gp.estado)} · {formatearHora(gp.fecha_carrera)}
                                </small>
                              </Link>
                            );
                          })}
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
