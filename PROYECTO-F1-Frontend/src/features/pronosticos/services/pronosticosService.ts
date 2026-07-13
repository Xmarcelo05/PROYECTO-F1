import axiosClient from '../../../core/api/axiosClient';
import type { Pronostico } from '../../../models';

export type CamposPronostico = Pick<
  Pronostico,
  | 'piloto_p1_id'
  | 'piloto_p2_id'
  | 'piloto_p3_id'
  | 'piloto_pole_id'
  | 'piloto_vuelta_rapida_id'
>;

export async function obtenerPronostico(gpId: string): Promise<Pronostico> {
  const { data } = await axiosClient.get<Pronostico>(`/pronosticos/gp/${gpId}`);
  return data;
}

export async function crearPronostico(
  granPremioId: string,
  campos: CamposPronostico,
): Promise<Pronostico> {
  const { data } = await axiosClient.post<Pronostico>('/pronosticos', {
    gran_premio_id: granPremioId,
    ...campos,
  });
  return data;
}

export async function actualizarPronostico(
  pronosticoId: string,
  campos: CamposPronostico,
): Promise<Pronostico> {
  const { data } = await axiosClient.put<Pronostico>(`/pronosticos/${pronosticoId}`, campos);
  return data;
}

export async function confirmarPronostico(pronosticoId: string): Promise<Pronostico> {
  const { data } = await axiosClient.post<Pronostico>(`/pronosticos/${pronosticoId}/confirmar`);
  return data;
}
