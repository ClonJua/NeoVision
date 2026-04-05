import api from './axios';
import type { ApiResponse } from './authService';

export interface CitaRequest {
  idSesion: number;
  idEstudiante: number;
  horaInicio: string; // "HH:mm"
  horaFin: string;    // "HH:mm"
  idPaciente?: number | null;
  observaciones?: string;
}

export interface CitaResponse {
  idCita: number;
  estado: string;
  horaInicio: string;
  horaFin: string;
  observaciones: string | null;
  fechaReserva: string | null;
  // Sesion
  idSesion: number;
  fechaSesion: string;
  nombreSalon: string;
  nombreEspacio: string;
  nombreDocente: string;
  // Estudiante
  idEstudiante: number;
  nombreEstudiante: string;
  // Paciente (null si DISPONIBLE)
  idPaciente: number | null;
  nombrePaciente: string | null;
}

export const citaService = {
  // ---- Admin ----
  crearBloque: (data: CitaRequest) =>
    api.post<ApiResponse<CitaResponse>>('/admin/citas', data),
  listarCitas: (estado?: string) =>
    api.get<ApiResponse<CitaResponse[]>>('/admin/citas', { params: estado ? { estado } : {} }),
  editarCita: (idCita: number, data: CitaRequest) =>
    api.put<ApiResponse<CitaResponse>>(`/admin/citas/${idCita}`, data),
  eliminarCita: (idCita: number) =>
    api.delete<ApiResponse<void>>(`/admin/citas/${idCita}/permanente`),
  cambiarEstado: (idCita: number, estado: string, observaciones?: string) =>
    api.patch<ApiResponse<CitaResponse>>(`/admin/citas/${idCita}/estado`, { estado, observaciones }),
  reprogramarAdmin: (idCitaActual: number, idCitaNueva: number) =>
    api.patch<ApiResponse<CitaResponse>>(`/admin/citas/${idCitaActual}/reprogramar`, { idCitaNueva }),

  // ---- Paciente ----
  bloquesDisponibles: () =>
    api.get<ApiResponse<CitaResponse[]>>('/paciente/citas/disponibles'),
  reservarBloque: (idCita: number) =>
    api.post<ApiResponse<CitaResponse>>(`/paciente/citas/${idCita}/reservar`),
  cancelarPaciente: (idCita: number, observaciones?: string) =>
    api.patch<ApiResponse<CitaResponse>>(`/paciente/citas/${idCita}/cancelar`, { observaciones }),
  reprogramarPaciente: (idCitaActual: number, idCitaNueva: number) =>
    api.patch<ApiResponse<CitaResponse>>(`/paciente/citas/${idCitaActual}/reprogramar`, { idCitaNueva }),
  misCitas: () =>
    api.get<ApiResponse<CitaResponse[]>>('/paciente/citas'),

  // ---- Estudiante ----
  misBloques: () =>
    api.get<ApiResponse<CitaResponse[]>>('/estudiante/citas'),
  asignarPaciente: (idCita: number, idPaciente: number) =>
    api.post<ApiResponse<CitaResponse>>(`/estudiante/citas/${idCita}/asignar-paciente`, { idPaciente }),
  confirmarAsistencia: (idCita: number) =>
    api.patch<ApiResponse<CitaResponse>>(`/estudiante/citas/${idCita}/confirmar`),
};
