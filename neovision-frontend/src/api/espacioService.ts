import api from './axios';
import type { ApiResponse } from './authService';

export interface EspacioResponse {
  idEspacio: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  salones: SalonResponse[];
}

export interface SalonResponse {
  idSalon: number;
  nombre: string;
  capacidad: number;
  activo: boolean;
  idEspacio: number;
  nombreEspacio: string;
}

export interface EspacioRequest {
  nombre: string;
  descripcion?: string;
}

export interface SalonRequest {
  nombre: string;
  capacidad: number;
  idEspacio: number;
}

export const espacioService = {
  listar: () => api.get<ApiResponse<EspacioResponse[]>>('/admin/espacios'),
  crear: (data: EspacioRequest) => api.post<ApiResponse<EspacioResponse>>('/admin/espacios', data),
  editar: (id: number, data: EspacioRequest) => api.put<ApiResponse<EspacioResponse>>(`/admin/espacios/${id}`, data),
  desactivar: (id: number) => api.delete<ApiResponse<void>>(`/admin/espacios/${id}`),
  activar: (id: number) => api.patch<ApiResponse<void>>(`/admin/espacios/${id}/activar`),
  eliminar: (id: number) => api.delete<ApiResponse<void>>(`/admin/espacios/${id}/permanente`),

  crearSalon: (data: SalonRequest) => api.post<ApiResponse<SalonResponse>>('/admin/espacios/salones', data),
  listarSalones: (idEspacio: number) => api.get<ApiResponse<SalonResponse[]>>(`/admin/espacios/${idEspacio}/salones`),
  editarSalon: (id: number, data: SalonRequest) => api.put<ApiResponse<SalonResponse>>(`/admin/espacios/salones/${id}`, data),
  desactivarSalon: (id: number) => api.delete<ApiResponse<void>>(`/admin/espacios/salones/${id}`),
  activarSalon: (id: number) => api.patch<ApiResponse<void>>(`/admin/espacios/salones/${id}/activar`),
  eliminarSalon: (id: number) => api.delete<ApiResponse<void>>(`/admin/espacios/salones/${id}/permanente`),
};
