import { useEffect, useState } from 'react';
import type { TheSportsDbEvent } from '../../../models/theSportsDb';
import { filtrarGrandesPremios, listarEventosTemporadaF1 } from '../../thesportsdb/services/theSportsDbService';
import { getErrorMessage } from '../../../core/api/apiError';
import Loader from '../../../shared/components/Loader';

const TEMPORADA_ACTUAL = new Date().getFullYear();
const DIAS_SEMANA = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

function fechaLocal(fecha: string): Date {
  return new Date(`${fecha}T00:00:00`);
}

function formatearHora(hora?: string | null): string {
  return hora ? hora.slice(0, 5) : 'Hora por confirmar';
}

function estadoEvento(estado: string | null): string {
  if (estado === 'FT') return 'Finalizado';
  if (estado === 'NS') return 'Proximo';
  return estado ?? 'Programado';
}

function obtenerMeses(eventos: TheSportsDbEvent[]): Array<[string, TheSportsDbEvent[]]> {
  const meses = new Map<string, TheSportsDbEvent[]>();
  eventos.forEach((evento) => {
    if (!evento.dateEvent) return;
    const fecha = fechaLocal(evento.dateEvent);
    const clave = `${fecha.getFullYear()}-${fecha.getMonth()}`;
    meses.set(clave, [...(meses.get(clave) ?? []), evento]);
  });
  return [...meses.entries()];
}

function diasDelMes(fecha: Date): Array<Date | null> {
  const year = fecha.getFullYear();
  const month = fecha.getMonth();
  const primerDia = new Date(year, month, 1);
  const desplazamiento = (primerDia.getDay() + 6) % 7;
  const totalDias = new Date(year, month + 1, 0).getDate();
  return [...Array<Date | null>(desplazamiento).fill(null), ...Array.from({ length: totalDias }, (_, i) => new Date(year, month, i + 1))];
}

export default function ListaGPs() {
  const [eventos, setEventos] = useState<TheSportsDbEvent[]>([]);
  const [temporada, setTemporada] = useState(TEMPORADA_ACTUAL);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    setCargando(true);
    setError(null);
    listarEventosTemporadaF1(temporada)
      .then((data) => !cancelado && setEventos(filtrarGrandesPremios(data)))
      .catch((err: unknown) => !cancelado && setError(getErrorMessage(err, 'No se pudo cargar el calendario.')))
      .finally(() => !cancelado && setCargando(false));
    return () => { cancelado = true; };
  }, [temporada]);

  return (
    <div className="stack">
      <div className="page-header flex-between">
        <div><h1>Calendario</h1><p>Grandes Premios de la temporada.</p></div>
        <div className="form-group" style={{ minWidth: 160 }}>
          <label htmlFor="temporada">Temporada</label>
          <input id="temporada" type="number" value={temporada} onChange={(e) => setTemporada(Number(e.target.value))} />
        </div>
      </div>

      {cargando && <Loader mensaje="Cargando calendario..." />}
      {error && <p className="form-error">{error}</p>}
      {!cargando && !error && eventos.length === 0 && <div className="empty-state">No hay Grandes Premios para esta temporada.</div>}

      {!cargando && !error && eventos.length > 0 && (
        <div className="calendario-meses">
          {obtenerMeses(eventos).map(([clave, eventosMes]) => {
            const fechaMes = fechaLocal(eventosMes[0].dateEvent!);
            const eventosDia = new Map<number, TheSportsDbEvent[]>();
            eventosMes.forEach((evento) => {
              const dia = fechaLocal(evento.dateEvent!).getDate();
              eventosDia.set(dia, [...(eventosDia.get(dia) ?? []), evento]);
            });
            return (
              <section key={clave} className="calendario-mes">
                <h2>{fechaMes.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</h2>
                <div className="calendario-semana" aria-hidden="true">{DIAS_SEMANA.map((dia) => <span key={dia}>{dia}</span>)}</div>
                <div className="calendario-cuadricula">
                  {diasDelMes(fechaMes).map((dia, indice) => (
                    <div key={dia?.toISOString() ?? `vacio-${indice}`} className={`calendario-dia${dia ? '' : ' calendario-dia--vacio'}`}>
                      {dia && <span className="calendario-dia__numero">{dia.getDate()}</span>}
                      {dia && (eventosDia.get(dia.getDate()) ?? []).map((evento) => (
                        <div key={evento.idEvent} className="calendario-evento" title={`${evento.strVenue ?? ''} · ${evento.strCountry ?? ''}`}>
                          <strong>R{evento.intRound ?? '—'}</strong><span>{evento.strEvent}</span><small>{estadoEvento(evento.strStatus)} · {formatearHora(evento.strTime)}</small>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
