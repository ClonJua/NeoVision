import api from './axios';
import type { ApiResponse } from './authService';

export interface SesionResponse {
  idSesion: number;
  fecha: string;
  horaInicio: string | null;
  horaFin: string | null;
  cuposTotales: number;
  cuposDisponibles: number;
  activo: boolean;
  idSalon: number;
  nombreSalon: string;
  nombreEspacio: string;
  idDocente: number;
  nombreDocente: string;
  estudiantes: { idEstudiante: number; nombre: string }[];
}

export interface SesionRequest {
  idSalon: number;
  idDocente: number;
  fecha: string;
  horaInicio?: string;
  horaFin?: string;
  cuposTotales: number;
  idsEstudiantes: number[];
}

export const sesionService = {
  listar: (fecha?: string) =>
    api.get<ApiResponse<SesionResponse[]>>('/admin/sesiones', { params: fecha ? { fecha } : {} }),
  crear: (data: SesionRequest) =>
    api.post<ApiResponse<SesionResponse>>('/admin/sesiones', data),
  editar: (id: number, data: SesionRequest) =>
    api.put<ApiResponse<SesionResponse>>(`/admin/sesiones/${id}`, data),
  desactivar: (id: number) =>
    api.delete<ApiResponse<void>>(`/admin/sesiones/${id}`),
  eliminar: (id: number) =>
    api.delete<ApiResponse<void>>(`/admin/sesiones/${id}/permanente`),
};
