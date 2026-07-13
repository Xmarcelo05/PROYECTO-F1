import { useEffect, useMemo, useState } from 'react';
import { listarCalendario } from '../../calendario/services/calendarioService';
import type { GranPremioCalendario } from '../../calendario/services/calendarioService';
import { getErrorMessage, getErrorStatus } from '../../../core/api/apiError';
import axiosClient from '../../../core/api/axiosClient';
import type { Piloto, Pronostico } from '../../../models';
import AccesoRequerido from '../../../shared/components/AccesoRequerido';
import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';
import Loader from '../../../shared/components/Loader';
import {
  actualizarPronostico,
  confirmarPronostico,
  crearPronostico,
  obtenerPronostico,
} from '../services/pronosticosService';
import type { CamposPronostico } from '../services/pronosticosService';

const CAMPOS_INICIALES: CamposPronostico = {
  piloto_p1_id: null,
  piloto_p2_id: null,
  piloto_p3_id: null,
  piloto_pole_id: null,
  piloto_vuelta_rapida_id: null,
};

const etiquetas: Array<[keyof CamposPronostico, string]> = [
  ['piloto_p1_id', '1.º puesto'],
  ['piloto_p2_id', '2.º puesto'],
  ['piloto_p3_id', '3.º puesto'],
  ['piloto_pole_id', 'Pole position'],
  ['piloto_vuelta_rapida_id', 'Vuelta rápida'],
];

function aCampos(pronostico: Pronostico): CamposPronostico {
  return {
    piloto_p1_id: pronostico.piloto_p1_id,
    piloto_p2_id: pronostico.piloto_p2_id,
    piloto_p3_id: pronostico.piloto_p3_id,
    piloto_pole_id: pronostico.piloto_pole_id,
    piloto_vuelta_rapida_id: pronostico.piloto_vuelta_rapida_id,
  };
}

export default function Pronosticos() {
  const [gps, setGps] = useState<GranPremioCalendario[]>([]);
  const [pilotos, setPilotos] = useState<Piloto[]>([]);
  const [gpId, setGpId] = useState('');
  const [pronostico, setPronostico] = useState<Pronostico | null>(null);
  const [campos, setCampos] = useState<CamposPronostico>(CAMPOS_INICIALES);
  const [cargando, setCargando] = useState(true);
  const [cargandoPronostico, setCargandoPronostico] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [bloqueado, setBloqueado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      listarCalendario(),
      axiosClient.get<Piloto[]>('/pilotos').then((respuesta) => respuesta.data),
    ])
      .then(([calendario, listaPilotos]) => {
        setGps(calendario);
        setPilotos(listaPilotos);
        const proximo = calendario.find((gp) => gp.estado === 'proximo');
        setGpId((proximo ?? calendario[0])?.id ?? '');
      })
      .catch((err: unknown) => setError(getErrorMessage(err, 'No se pudieron cargar los datos.')))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    if (!gpId) return;
    let cancelado = false;
    setCargandoPronostico(true);
    setBloqueado(false);
    setError(null);
    setExito(null);

    obtenerPronostico(gpId)
      .then((data) => {
        if (!cancelado) {
          setPronostico(data);
          setCampos(aCampos(data));
        }
      })
      .catch((err: unknown) => {
        if (cancelado) return;
        const status = getErrorStatus(err);
        if (status === 404) {
          setPronostico(null);
          setCampos(CAMPOS_INICIALES);
        } else if (status === 402) {
          setBloqueado(true);
        } else {
          setError(getErrorMessage(err, 'No se pudo cargar tu pronóstico.'));
        }
      })
      .finally(() => !cancelado && setCargandoPronostico(false));

    return () => {
      cancelado = true;
    };
  }, [gpId]);

  const gpSeleccionado = useMemo(() => gps.find((gp) => gp.id === gpId), [gps, gpId]);
  const plazoFinalizado = gpSeleccionado ? new Date(gpSeleccionado.fecha_inicio) <= new Date() : true;
  const podio = [campos.piloto_p1_id, campos.piloto_p2_id, campos.piloto_p3_id].filter(Boolean);
  const podioRepetido = new Set(podio).size !== podio.length;
  const completo = Object.values(campos).every(Boolean);
  const noEditable = plazoFinalizado || pronostico?.confirmado === true;

  const guardar = async (confirmar: boolean) => {
    if (!gpId || noEditable || podioRepetido) return;
    if (confirmar && !completo) {
      setError('Completa los cinco pronósticos antes de confirmarlos.');
      return;
    }

    setGuardando(true);
    setError(null);
    setExito(null);
    try {
      const guardado = pronostico
        ? await actualizarPronostico(pronostico.id, campos)
        : await crearPronostico(gpId, campos);
      const resultado = confirmar ? await confirmarPronostico(guardado.id) : guardado;
      setPronostico(resultado);
      setCampos(aCampos(resultado));
      setExito(confirmar ? 'Pronóstico confirmado. Ya no podrá modificarse.' : 'Borrador guardado.');
    } catch (err: unknown) {
      if (getErrorStatus(err) === 402) setBloqueado(true);
      else setError(getErrorMessage(err, 'No se pudo guardar el pronóstico.'));
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) return <Loader mensaje="Preparando pronósticos..." />;
  if (bloqueado) return <AccesoRequerido mensaje="Necesitas un pase de temporada activo para crear y consultar tus pronósticos." />;

  return (
    <div className="stack">
      <div className="page-header">
        <h1>Mis pronósticos</h1>
        <p>Elige el podio, la pole position y la vuelta rápida antes de que comience el Gran Premio.</p>
      </div>

      {gps.length === 0 ? (
        <div className="empty-state">No hay Grandes Premios disponibles para pronosticar.</div>
      ) : (
        <Card className="pronosticos-card">
          <div className="form-group">
            <label htmlFor="gran-premio">Gran Premio</label>
            <select id="gran-premio" value={gpId} onChange={(e) => setGpId(e.target.value)}>
              {gps.map((gp) => (
                <option key={gp.id} value={gp.id}>
                  {gp.nombre} — Ronda {gp.ronda}
                </option>
              ))}
            </select>
          </div>

          {gpSeleccionado && (
            <p className="text-muted">
              Cierra el {new Intl.DateTimeFormat('es-EC', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(gpSeleccionado.fecha_inicio))}.
            </p>
          )}

          {plazoFinalizado && <p className="form-error">El plazo de este Gran Premio ya finalizó.</p>}
          {pronostico?.confirmado && <p className="form-success">Este pronóstico está confirmado.</p>}
          {error && <p className="form-error">{error}</p>}
          {exito && <p className="form-success">{exito}</p>}
          {cargandoPronostico && <Loader mensaje="Cargando tu pronóstico..." />}

          {!cargandoPronostico && (
            <div className="pronosticos-form">
              {etiquetas.map(([campo, etiqueta]) => (
                <div key={campo} className="form-group">
                  <label htmlFor={campo}>{etiqueta}</label>
                  <select
                    id={campo}
                    value={campos[campo] ?? ''}
                    disabled={noEditable || guardando}
                    onChange={(e) => setCampos((actual) => ({ ...actual, [campo]: e.target.value || null }))}
                  >
                    <option value="">Selecciona un piloto</option>
                    {pilotos.map((piloto) => (
                      <option key={piloto.id} value={piloto.id}>{piloto.nombre}</option>
                    ))}
                  </select>
                </div>
              ))}

              {podioRepetido && <p className="form-error">Un piloto no puede ocupar más de una posición del podio.</p>}

              {!noEditable && (
                <div className="pronosticos-actions">
                  <Button variante="secondary" onClick={() => void guardar(false)} disabled={guardando || podioRepetido}>
                    Guardar borrador
                  </Button>
                  <Button onClick={() => void guardar(true)} disabled={guardando || podioRepetido || !completo}>
                    Confirmar pronóstico
                  </Button>
                </div>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
