import { useEffect, useMemo, useState } from 'react';
import { listarCalendario } from '../../calendario/services/calendarioService';
import type { GranPremioCalendario } from '../../calendario/services/calendarioService';
import { listarPilotos } from '../../competencia/services/competenciaService';
import type { PilotoConEscuderia } from '../../competencia/services/competenciaService';
import { buscarPilotoF1 } from '../../thesportsdb/services/theSportsDbService';
import { getErrorMessage, getErrorStatus } from '../../../core/api/apiError';
import type { Pronostico } from '../../../models';
import AccesoRequerido from '../../../shared/components/AccesoRequerido';
import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';
import Loader from '../../../shared/components/Loader';
import PilotoAvatar from '../components/PilotoAvatar';
import SeleccionarPilotoModal from '../components/SeleccionarPilotoModal';
import { usePilotoFotos } from '../hooks/usePilotoFotos';
import { obtenerResultadosGP } from '../../resultados/services/resultadosService';
import type { ResultadoOficialConPosiciones } from '../../resultados/services/resultadosService';
import {
  actualizarPronostico,
  confirmarPronostico,
  crearPronostico,
  obtenerPronostico,
  obtenerPronosticosPopulares,
} from '../services/pronosticosService';
import type { CamposPronostico, OpcionPopular, PronosticosPopulares } from '../services/pronosticosService';
import { generarPronosticosPopularesSimulados } from '../data/pronosticosPopularesSimulados';



const CAMPOS_INICIALES: CamposPronostico = {
  piloto_p1_id: null,
  piloto_p2_id: null,
  piloto_p3_id: null,
  piloto_pole_id: null,
  piloto_vuelta_rapida_id: null,
};

interface Paso {
  titulo: string;
  descripcion: string;
  campos: (keyof CamposPronostico)[];
  etiquetas?: string[];
}

const PASOS: Paso[] = [
  {
    titulo: 'Podio',
    descripcion: 'Elige quién quedará 1.º, 2.º y 3.º en la carrera.',
    campos: ['piloto_p1_id', 'piloto_p2_id', 'piloto_p3_id'],
    etiquetas: ['1.º', '2.º', '3.º'],
  },
  {
    titulo: 'Pole position',
    descripcion: 'Elige quién logrará la pole position en la clasificación.',
    campos: ['piloto_pole_id'],
  },
  {
    titulo: 'Vuelta rápida',
    descripcion: 'Elige quién marcará la vuelta más rápida de la carrera.',
    campos: ['piloto_vuelta_rapida_id'],
  },
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

function pasoCompleto(paso: Paso, campos: CamposPronostico): boolean {
  return paso.campos.every((campo) => Boolean(campos[campo]));
}

function OpcionPopularItem({
  opcion,
  foto,
}: {
  opcion: OpcionPopular;
  foto?: string;
}) {
  return (
    <li className="pronosticos-popular-opcion">
      <div className="pronosticos-popular-opcion__row">
        {foto ? (
          <img src={foto} alt={opcion.piloto_nombre} className="pronosticos-popular-opcion__foto" />
        ) : (
          <div className="pronosticos-popular-opcion__foto pronosticos-popular-opcion__foto--placeholder" />
        )}
        <div className="pronosticos-popular-opcion__info">
          <span>{opcion.piloto_nombre}</span>
          <small>
            {opcion.porcentaje}% · {opcion.votos} voto{opcion.votos === 1 ? '' : 's'}
          </small>
        </div>
      </div>
      <div className="confianza-bar">
        <div className="confianza-bar__fill" style={{ width: `${opcion.porcentaje}%` }} />
      </div>
    </li>
  );
}

interface TarjetaCategoriaProps {
  titulo: string;
  userPilotoId: string | null;
  oficialPilotoId: string | undefined;
  acierto: boolean;
  puntosAcierto: number;
  tieneResultado: boolean;
  pilotos: PilotoConEscuderia[];
  fotos: Record<string, string | null>;
}

function TarjetaCategoria({
  titulo,
  userPilotoId,
  oficialPilotoId,
  acierto,
  puntosAcierto,
  tieneResultado,
  pilotos,
  fotos
}: TarjetaCategoriaProps) {
  const userPiloto = pilotos.find(p => p.id === userPilotoId);
  const oficialPiloto = pilotos.find(p => p.id === oficialPilotoId);

  return (
    <div className={`post-pronostico-card ${tieneResultado ? (acierto ? 'acierto' : 'fallido') : ''}`}>
      <div className="post-pronostico-card__header">
        <span className="post-pronostico-card__titulo">{titulo}</span>
        {tieneResultado && (
          <span className={`post-pronostico-card__badge ${acierto ? 'badge-acierto' : 'badge-fallido'}`}>
            {acierto ? `✓ Acierto (+${puntosAcierto} pts)` : '✗ Fallido'}
          </span>
        )}
      </div>
      
      <div className="post-pronostico-card__content">
        <div className="post-pronostico-card__pilot-info">
          <small className="text-muted block">Tu predicción:</small>
          {userPiloto ? (
            <div className="flex-align-center" style={{ gap: '0.75rem', marginTop: '0.25rem' }}>
              <PilotoAvatar
                nombre={userPiloto.nombre}
                color={userPiloto.escuderia?.color}
                fotoUrl={fotos[userPiloto.id] ?? undefined}
                tamano="md"
              />
              <div>
                <p style={{ fontWeight: 600, fontSize: '0.95rem', margin: 0 }}>{userPiloto.nombre}</p>
                <p className="text-muted" style={{ fontSize: '0.8rem', margin: 0 }}>{userPiloto.escuderia?.nombre}</p>
              </div>
            </div>
          ) : (
            <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: '0.25rem', margin: 0 }}>Ninguno seleccionado</p>
          )}
        </div>

        {tieneResultado && !acierto && (
          <div className="post-pronostico-card__real-info" style={{ borderTop: '1px solid var(--gray-800)', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
            <small className="text-muted block">Resultado oficial:</small>
            {oficialPiloto ? (
              <div className="flex-align-center" style={{ gap: '0.75rem', marginTop: '0.25rem' }}>
                <PilotoAvatar
                  nombre={oficialPiloto.nombre}
                  color={oficialPiloto.escuderia?.color}
                  fotoUrl={fotos[oficialPiloto.id] ?? undefined}
                  tamano="sm"
                />
                <div>
                  <p style={{ fontWeight: 500, fontSize: '0.85rem', margin: 0 }}>{oficialPiloto.nombre}</p>
                  <p className="text-muted" style={{ fontSize: '0.75rem', margin: 0 }}>{oficialPiloto.escuderia?.nombre}</p>
                </div>
              </div>
            ) : (
              <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.25rem', margin: 0 }}>Desconocido</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface VistaPostPronosticoProps {
  pronostico: Pronostico;
  pilotos: PilotoConEscuderia[];
  fotos: Record<string, string | null>;
  resultadosOficiales: ResultadoOficialConPosiciones | null;
}

function VistaPostPronostico({
  pronostico,
  pilotos,
  fotos,
  resultadosOficiales
}: VistaPostPronosticoProps) {
  const tieneResultado = resultadosOficiales !== null;

  const oficialP1 = resultadosOficiales?.posiciones.find(p => p.posicion === 1);
  const oficialP2 = resultadosOficiales?.posiciones.find(p => p.posicion === 2);
  const oficialP3 = resultadosOficiales?.posiciones.find(p => p.posicion === 3);
  const oficialPole = resultadosOficiales?.posiciones.find(p => p.es_pole);
  const oficialVR = resultadosOficiales?.posiciones.find(p => p.es_vuelta_rapida);

  return (
    <div className="stack" style={{ gap: '1.25rem' }}>
      {/* Header Info */}
      <div className="flex-between" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', backgroundColor: 'var(--gray-900)', padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid var(--gray-800)' }}>
        <div>
          <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Resumen del Pronóstico</h4>
          <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.2rem', margin: 0 }}>
            {pronostico.confirmado ? 'Confirmado ✓' : 'Borrador 🔒'}
          </p>
        </div>
        {tieneResultado && (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <div className="badge-puntos">
              Puntos: {pronostico.puntos_obtenidos ?? 0} pts
            </div>
            <div className="badge-aciertos-perfil">
              Aciertos: {pronostico.aciertos ?? 0} / 5
            </div>
          </div>
        )}
      </div>

      {tieneResultado && (
        <div style={{ backgroundColor: 'rgba(31, 157, 85, 0.08)', border: '1px solid rgba(31, 157, 85, 0.2)', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', color: '#1f9d55', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          🏁 ¡Carrera Finalizada! Los resultados oficiales han sido registrados.
        </div>
      )}

      {/* Grid of Predictions */}
      <div className="post-pronostico-grid">
        <TarjetaCategoria
          titulo="1.º Puesto"
          userPilotoId={pronostico.piloto_p1_id}
          oficialPilotoId={oficialP1?.piloto_id}
          acierto={pronostico.piloto_p1_id === oficialP1?.piloto_id}
          puntosAcierto={10}
          tieneResultado={tieneResultado}
          pilotos={pilotos}
          fotos={fotos}
        />
        <TarjetaCategoria
          titulo="2.º Puesto"
          userPilotoId={pronostico.piloto_p2_id}
          oficialPilotoId={oficialP2?.piloto_id}
          acierto={pronostico.piloto_p2_id === oficialP2?.piloto_id}
          puntosAcierto={5}
          tieneResultado={tieneResultado}
          pilotos={pilotos}
          fotos={fotos}
        />
        <TarjetaCategoria
          titulo="3.º Puesto"
          userPilotoId={pronostico.piloto_p3_id}
          oficialPilotoId={oficialP3?.piloto_id}
          acierto={pronostico.piloto_p3_id === oficialP3?.piloto_id}
          puntosAcierto={5}
          tieneResultado={tieneResultado}
          pilotos={pilotos}
          fotos={fotos}
        />
        <TarjetaCategoria
          titulo="Pole Position"
          userPilotoId={pronostico.piloto_pole_id}
          oficialPilotoId={oficialPole?.piloto_id}
          acierto={pronostico.piloto_pole_id === oficialPole?.piloto_id}
          puntosAcierto={5}
          tieneResultado={tieneResultado}
          pilotos={pilotos}
          fotos={fotos}
        />
        <TarjetaCategoria
          titulo="Vuelta Rápida"
          userPilotoId={pronostico.piloto_vuelta_rapida_id}
          oficialPilotoId={oficialVR?.piloto_id}
          acierto={pronostico.piloto_vuelta_rapida_id === oficialVR?.piloto_id}
          puntosAcierto={5}
          tieneResultado={tieneResultado}
          pilotos={pilotos}
          fotos={fotos}
        />
      </div>
    </div>
  );
}

export default function Pronosticos() {


  const [gps, setGps] = useState<GranPremioCalendario[]>([]);
  const [pilotos, setPilotos] = useState<PilotoConEscuderia[]>([]);
  const [gpId, setGpId] = useState('');
  const [pronostico, setPronostico] = useState<Pronostico | null>(null);
  const [campos, setCampos] = useState<CamposPronostico>(CAMPOS_INICIALES);
  const [cargando, setCargando] = useState(true);
  const [cargandoPronostico, setCargandoPronostico] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [bloqueado, setBloqueado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const [populares, setPopulares] = useState<PronosticosPopulares | null>(null);
  const [cargandoPopulares, setCargandoPopulares] = useState(false);
  const [fotosPilotos, setFotosPilotos] = useState<Record<string, string>>({});
  const [categoriasExpandidas, setCategoriasExpandidas] = useState<Record<string, boolean>>({});
  const [pasoActual, setPasoActual] = useState(0);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [resultadosOficiales, setResultadosOficiales] = useState<ResultadoOficialConPosiciones | null>(null);

  const gpSeleccionado = useMemo(() => gps.find((gp) => gp.id === gpId), [gps, gpId]);

  useEffect(() => {
    Promise.all([listarCalendario(), listarPilotos()])
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
    setResultadosOficiales(null);

    obtenerPronostico(gpId)
      .then((data) => {
        if (!cancelado) {
          setPronostico(data);
          setCampos(aCampos(data));

          if (data.gran_premio_finalizado || gpSeleccionado?.finalizado) {
            obtenerResultadosGP(gpId)
              .then((res) => {
                if (!cancelado) setResultadosOficiales(res);
              })
              .catch((err) => console.error("Error cargando resultados", err));
          }
        }
      })
      .catch((err: unknown) => {
        if (cancelado) return;
        const status = getErrorStatus(err);
        if (status === 404) {
          setPronostico(null);
          setCampos(CAMPOS_INICIALES);

          if (gpSeleccionado?.finalizado) {
            obtenerResultadosGP(gpId)
              .then((res) => {
                if (!cancelado) setResultadosOficiales(res);
              })
              .catch((err) => console.error("Error cargando resultados", err));
          }
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
  }, [gpId, gpSeleccionado]);

  useEffect(() => {
    setCategoriasExpandidas({});
    setPasoActual(0);
  }, [gpId]);

  useEffect(() => {
    if (!gpId) return;
    let cancelado = false;
    setCargandoPopulares(true);

    obtenerPronosticosPopulares(gpId)
      .then((data) => {
        if (!cancelado) setPopulares(data);
      })
      .catch(() => {
        if (!cancelado) setPopulares(null);
      })
      .finally(() => !cancelado && setCargandoPopulares(false));

    return () => {
      cancelado = true;
    };
  }, [gpId]);

  const popularesVisibles = useMemo(() => {
    if (populares && populares.total_confirmados > 0) {
      return { datos: populares, simulado: false };
    }
    if (!gpId || pilotos.length === 0) return null;
    return { datos: generarPronosticosPopularesSimulados(gpId, pilotos), simulado: true };
  }, [populares, gpId, pilotos]);

  useEffect(() => {
    if (!popularesVisibles) {
      setFotosPilotos({});
      return;
    }

    let cancelado = false;
    const nombres = [
      ...new Set(
        popularesVisibles.datos.categorias.flatMap((categoria) =>
          categoria.opciones.map((opcion) => opcion.piloto_nombre),
        ),
      ),
    ];

    Promise.all(
      nombres.map(async (nombre) => {
        try {
          const resultados = await buscarPilotoF1(nombre);
          const coincidencia =
            resultados.find((piloto) => piloto.strPlayer.toLowerCase() === nombre.toLowerCase()) ??
            resultados[0];
          const foto = coincidencia?.strCutout ?? coincidencia?.strThumb ?? '';
          return [nombre, foto] as const;
        } catch {
          return [nombre, ''] as const;
        }
      }),
    ).then((entradas) => {
      if (cancelado) return;
      setFotosPilotos(
        Object.fromEntries(entradas.filter(([, foto]) => Boolean(foto))),
      );
    });

    return () => {
      cancelado = true;
    };
  }, [popularesVisibles]);

  const fotos = usePilotoFotos(pilotos);

  const plazoFinalizado = gpSeleccionado ? new Date(gpSeleccionado.fecha_inicio) <= new Date() : true;
  const podio = [campos.piloto_p1_id, campos.piloto_p2_id, campos.piloto_p3_id].filter(Boolean);
  const podioRepetido = new Set(podio).size !== podio.length;
  const completo = Object.values(campos).every(Boolean);
  const noEditable = plazoFinalizado || pronostico?.confirmado === true;
  const paso = PASOS[pasoActual];

  function piloto(pilotoId: string | null): PilotoConEscuderia | undefined {
    return pilotoId ? pilotos.find((p) => p.id === pilotoId) : undefined;
  }

  function guardarSeleccionPaso(nuevaSeleccion: (string | null)[]) {
    setCampos((prev) => {
      const copia = { ...prev };
      paso.campos.forEach((campo, i) => {
        copia[campo] = nuevaSeleccion[i] ?? null;
      });
      return copia;
    });
    setModalAbierto(false);
    setExito(null);
  }

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
      if (confirmar) {
        const data = await obtenerPronosticosPopulares(gpId);
        setPopulares(data);
      }
    } catch (err: unknown) {
      if (getErrorStatus(err) === 402) setBloqueado(true);
      else setError(getErrorMessage(err, 'No se pudo guardar el pronóstico.'));
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) return <Loader mensaje="Preparando pronósticos..." />;
  if (bloqueado) {
    return <AccesoRequerido mensaje="Necesitas un pase de temporada activo para crear y consultar tus pronósticos." />;
  }

  return (
    <div className="stack">
      <div className="page-header">
        <h1>Mis pronósticos</h1>
        <p>Elige el podio, la pole position y la vuelta rápida antes de que comience el Gran Premio.</p>
      </div>

      {gps.length === 0 ? (
        <div className="empty-state">No hay Grandes Premios disponibles para pronosticar.</div>
      ) : (
        <div className="pronosticos-layout">
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
              <>
                {noEditable ? (
                  pronostico ? (
                    <VistaPostPronostico
                      pronostico={pronostico}
                      pilotos={pilotos}
                      fotos={fotos}
                      resultadosOficiales={resultadosOficiales}
                    />
                  ) : (
                    <div className="stack" style={{ gap: '1.5rem' }}>
                      <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                        No registraste ningún pronóstico para este Gran Premio.
                      </div>
                      {resultadosOficiales && (
                        <div>
                          <h4 style={{ marginBottom: '1rem', textAlign: 'center', fontWeight: 700 }}>Resultados Oficiales de la Carrera</h4>
                          <div className="post-pronostico-grid">
                            <TarjetaCategoria
                              titulo="1.º Puesto"
                              userPilotoId={null}
                              oficialPilotoId={resultadosOficiales.posiciones.find(p => p.posicion === 1)?.piloto_id}
                              acierto={false}
                              puntosAcierto={10}
                              tieneResultado={true}
                              pilotos={pilotos}
                              fotos={fotos}
                            />
                            <TarjetaCategoria
                              titulo="2.º Puesto"
                              userPilotoId={null}
                              oficialPilotoId={resultadosOficiales.posiciones.find(p => p.posicion === 2)?.piloto_id}
                              acierto={false}
                              puntosAcierto={5}
                              tieneResultado={true}
                              pilotos={pilotos}
                              fotos={fotos}
                            />
                            <TarjetaCategoria
                              titulo="3.º Puesto"
                              userPilotoId={null}
                              oficialPilotoId={resultadosOficiales.posiciones.find(p => p.posicion === 3)?.piloto_id}
                              acierto={false}
                              puntosAcierto={5}
                              tieneResultado={true}
                              pilotos={pilotos}
                              fotos={fotos}
                            />
                            <TarjetaCategoria
                              titulo="Pole Position"
                              userPilotoId={null}
                              oficialPilotoId={resultadosOficiales.posiciones.find(p => p.es_pole)?.piloto_id}
                              acierto={false}
                              puntosAcierto={5}
                              tieneResultado={true}
                              pilotos={pilotos}
                              fotos={fotos}
                            />
                            <TarjetaCategoria
                              titulo="Vuelta Rápida"
                              userPilotoId={null}
                              oficialPilotoId={resultadosOficiales.posiciones.find(p => p.es_vuelta_rapida)?.piloto_id}
                              acierto={false}
                              puntosAcierto={5}
                              tieneResultado={true}
                              pilotos={pilotos}
                              fotos={fotos}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )
                ) : (
                  <>
                    <div>
                      <h3>{paso.titulo}</h3>
                      <p className="text-muted">{paso.descripcion}</p>

                      <div className="piloto-slots">
                        {paso.campos.map((campo, i) => {
                          const p = piloto(campos[campo]);
                          return (
                            <button
                              key={campo}
                              type="button"
                              className="piloto-slot"
                              disabled={noEditable || guardando}
                              onClick={() => setModalAbierto(true)}
                            >
                              <div className="piloto-slot__avatar-wrap">
                                {p ? (
                                  <PilotoAvatar
                                    nombre={p.nombre}
                                    color={p.escuderia?.color}
                                    fotoUrl={fotos[p.id]}
                                    tamano="lg"
                                  />
                                ) : (
                                  <div className="piloto-slot__vacio">+</div>
                                )}
                                {p && !noEditable && (
                                  <span className="piloto-slot__editar" aria-hidden="true">
                                    ✎
                                  </span>
                                )}
                              </div>
                              {paso.etiquetas?.[i] && (
                                <span className="piloto-slot__posicion">{paso.etiquetas[i]}</span>
                              )}
                              <span className="piloto-slot__nombre">{p ? p.nombre : 'Elegir piloto'}</span>
                            </button>
                          );
                        })}
                      </div>

                      <div className="wizard-dots">
                        {PASOS.map((p, i) => (
                          <button
                            key={p.titulo}
                            type="button"
                            className={[
                              'wizard-dot',
                              i === pasoActual ? 'wizard-dot--activo' : '',
                              pasoCompleto(p, campos) ? 'wizard-dot--completo' : '',
                            ]
                              .filter(Boolean)
                              .join(' ')}
                            onClick={() => setPasoActual(i)}
                            aria-label={p.titulo}
                          />
                        ))}
                      </div>

                      <div className="wizard-nav">
                        <Button
                          variante="secondary"
                          onClick={() => setPasoActual((prev) => Math.max(0, prev - 1))}
                          disabled={pasoActual === 0}
                        >
                          ← Anterior
                        </Button>
                        <Button
                          onClick={() => setPasoActual((prev) => Math.min(PASOS.length - 1, prev + 1))}
                          disabled={pasoActual === PASOS.length - 1}
                        >
                          Siguiente →
                        </Button>
                      </div>
                    </div>

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
                  </>
                )}
              </>
            )}
          </Card>

          <Card className="pronosticos-populares-card">
            <h3>Pronósticos populares</h3>

            {cargandoPopulares && <Loader mensaje="Cargando tendencias..." />}

            {!cargandoPopulares && !popularesVisibles && (
              <div className="empty-state" style={{ padding: '1.5rem 0' }}>
                No hay datos de pronósticos populares disponibles.
              </div>
            )}

            {!cargandoPopulares && popularesVisibles && (
              <div className="pronosticos-populares-list">
                {popularesVisibles.datos.categorias.map((categoria) => {
                  const expandida = categoriasExpandidas[categoria.categoria] ?? false;
                  const opcionesVisibles = expandida
                    ? categoria.opciones
                    : categoria.opciones.slice(0, 1);
                  const restantes = categoria.opciones.length - 1;

                  return (
                  <div key={categoria.categoria} className="pronosticos-popular-categoria">
                    <h4>{categoria.etiqueta}</h4>
                    {categoria.opciones.length === 0 ? (
                      <p className="text-muted">Sin datos</p>
                    ) : (
                      <>
                        <ul className="pronosticos-popular-opciones">
                          {opcionesVisibles.map((opcion) => (
                            <OpcionPopularItem
                              key={`${categoria.categoria}-${opcion.piloto_id}`}
                              opcion={opcion}
                              foto={fotosPilotos[opcion.piloto_nombre]}
                            />
                          ))}
                        </ul>
                        {restantes > 0 && (
                          <button
                            type="button"
                            className="pronosticos-popular-ver-mas"
                            onClick={() =>
                              setCategoriasExpandidas((actual) => ({
                                ...actual,
                                [categoria.categoria]: !expandida,
                              }))
                            }
                          >
                            {expandida ? 'Ver menos' : `Ver más (${restantes})`}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}

      {modalAbierto && (
        <SeleccionarPilotoModal
          titulo={paso.titulo}
          pilotos={pilotos}
          seleccion={paso.campos.map((campo) => campos[campo])}
          etiquetas={paso.etiquetas}
          fotos={fotos}
          onGuardar={guardarSeleccionPaso}
          onCerrar={() => setModalAbierto(false)}
        />
      )}
    </div>
  );
}
