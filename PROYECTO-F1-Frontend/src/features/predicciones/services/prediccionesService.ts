import { listarPilotos } from '../../competencia/services/competenciaService';

/**
 * Servicio de predicciones — MVP.
 *
 * El backend actual no tiene ningún endpoint de Machine Learning ni de predicción
 * (el módulo `pronosticos` es un CRUD manual de pronósticos de usuario, no una IA).
 * Esta capa simula una predicción a partir de datos reales de pilotos (GET /pilotos)
 * y una heurística determinista basada en puntos_temporada.
 *
 * Contrato de reemplazo futuro: cuando exista un servicio real de IA, solo hay que
 * reescribir el cuerpo de `obtenerPrediccion` para que llame al endpoint real y
 * devuelva el mismo tipo `PrediccionGP`. Ninguna página debería cambiar.
 */

export interface PronosticoPiloto {
  pilotoId: string;
  nombre: string;
  escuderia: string | null;
  probabilidad: number;
}

export type NivelConfianza = 'bajo' | 'medio' | 'alto';

export interface PrediccionGP {
  granPremioId: string;
  temporada: number;
  generadoEn: string;
  ganadorProbable: PronosticoPiloto;
  podioProbable: PronosticoPiloto[];
  probabilidades: PronosticoPiloto[];
  nivelConfianza: NivelConfianza;
  observaciones: string[];
  esSimulacion: true;
}

function hashDeterminista(semilla: string): number {
  let hash = 0;
  for (let i = 0; i < semilla.length; i += 1) {
    hash = (hash << 5) - hash + semilla.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) / 2147483647;
}

const FRASES_OBSERVACION = [
  'ha mostrado ritmo constante en las últimas rondas de la temporada',
  'parte con ventaja según su posición actual en el campeonato',
  'suele rendir bien en circuitos de este tipo',
  'es una de las apuestas más consistentes hasta el momento',
  'podría sorprender si logra una buena clasificación',
];

export async function obtenerPrediccion(granPremioId: string, temporada: number): Promise<PrediccionGP> {
  const pilotos = await listarPilotos(temporada);

  if (pilotos.length === 0) {
    throw new Error('No hay pilotos registrados para esta temporada, no se puede simular una predicción.');
  }

  const puntuados = pilotos.map((piloto) => {
    const jitter = hashDeterminista(`${granPremioId}:${piloto.id}`) * 40;
    return {
      piloto,
      peso: piloto.puntos_temporada + jitter,
    };
  });

  puntuados.sort((a, b) => b.peso - a.peso);

  const pesoTotal = puntuados.reduce((acc, item) => acc + item.peso, 0) || 1;

  const probabilidades: PronosticoPiloto[] = puntuados.map(({ piloto, peso }) => ({
    pilotoId: piloto.id,
    nombre: piloto.nombre,
    escuderia: piloto.escuderia?.nombre ?? null,
    probabilidad: Math.round((peso / pesoTotal) * 1000) / 10,
  }));

  const podioProbable = probabilidades.slice(0, 3);
  const ganadorProbable = probabilidades[0];

  const diferencia = probabilidades[0].probabilidad - (probabilidades[1]?.probabilidad ?? 0);
  const nivelConfianza: NivelConfianza = diferencia > 8 ? 'alto' : diferencia > 3 ? 'medio' : 'bajo';

  const observaciones = podioProbable.map((p, index) => {
    const frase = FRASES_OBSERVACION[Math.floor(hashDeterminista(`${granPremioId}:${p.pilotoId}:obs`) * FRASES_OBSERVACION.length)];
    return `${index + 1}. ${p.nombre} ${frase}.`;
  });

  return {
    granPremioId,
    temporada,
    generadoEn: new Date().toISOString(),
    ganadorProbable,
    podioProbable,
    probabilidades,
    nivelConfianza,
    observaciones,
    esSimulacion: true,
  };
}
