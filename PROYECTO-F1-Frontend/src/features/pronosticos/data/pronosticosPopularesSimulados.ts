import type { Piloto } from '../../../models';
import type { PronosticosPopulares } from '../services/pronosticosService';

const DISTRIBUCION_SIMULADA: Array<{
  categoria: string;
  etiqueta: string;
  opciones: Array<{ indice: number; votos: number; porcentaje: number }>;
}> = [
  {
    categoria: 'p1',
    etiqueta: '1.º puesto',
    opciones: [
      { indice: 0, votos: 54, porcentaje: 42.2 },
      { indice: 3, votos: 36, porcentaje: 28.1 },
      { indice: 1, votos: 23, porcentaje: 18.0 },
    ],
  },
  {
    categoria: 'p2',
    etiqueta: '2.º puesto',
    opciones: [
      { indice: 1, votos: 45, porcentaje: 35.2 },
      { indice: 2, votos: 38, porcentaje: 29.7 },
      { indice: 3, votos: 25, porcentaje: 19.5 },
    ],
  },
  {
    categoria: 'p3',
    etiqueta: '3.º puesto',
    opciones: [
      { indice: 2, votos: 49, porcentaje: 38.3 },
      { indice: 3, votos: 32, porcentaje: 25.0 },
      { indice: 1, votos: 21, porcentaje: 16.4 },
    ],
  },
  {
    categoria: 'pole',
    etiqueta: 'Pole position',
    opciones: [
      { indice: 0, votos: 61, porcentaje: 47.7 },
      { indice: 1, votos: 28, porcentaje: 21.9 },
      { indice: 3, votos: 19, porcentaje: 14.8 },
    ],
  },
  {
    categoria: 'vuelta_rapida',
    etiqueta: 'Vuelta rápida',
    opciones: [
      { indice: 0, votos: 40, porcentaje: 31.3 },
      { indice: 2, votos: 33, porcentaje: 25.8 },
      { indice: 3, votos: 28, porcentaje: 21.9 },
    ],
  },
];

export function generarPronosticosPopularesSimulados(
  gpId: string,
  pilotos: Piloto[],
): PronosticosPopulares {
  if (pilotos.length === 0) {
    return { gran_premio_id: gpId, total_confirmados: 0, categorias: [] };
  }

  return {
    gran_premio_id: gpId,
    total_confirmados: 128,
    categorias: DISTRIBUCION_SIMULADA.map((categoria) => ({
      categoria: categoria.categoria,
      etiqueta: categoria.etiqueta,
      opciones: categoria.opciones
        .map((opcion) => {
          const piloto = pilotos[opcion.indice % pilotos.length];
          return {
            piloto_id: piloto.id,
            piloto_nombre: piloto.nombre,
            votos: opcion.votos,
            porcentaje: opcion.porcentaje,
          };
        })
        .filter((opcion, index, lista) => lista.findIndex((o) => o.piloto_id === opcion.piloto_id) === index),
    })),
  };
}
