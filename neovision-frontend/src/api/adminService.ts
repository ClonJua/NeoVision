import api from './axios';
import type { ApiResponse } from './authService';

export interface DocenteResponse {
  idDocente: number;
  nombre: string;
  apellido: string;
  correo: string;
  cedula: string | null;
  telefono: string | null;
  activo: boolean;
}

export interface EstudianteResponse {
  idEstudiante: number;
  nombre: string;
  apellido: string;
  correo: string;
  cedula: string;
  semestre: number;
  telefono: string | null;
  idDocente: number | null;
  nombreDocente: string | null;
  activo: boolean;
}

export interface PacienteResponse {
  idPaciente: number;
  nombre: string;
  apellido: string;
  correo: string;
  tipoDocumento: string;
  numeroDocumento: string;
  fechaNacimiento: string;
  telefono: string;
  activo: boolean;
}

export interface CrearDocenteRequest {
  nombre: string;
  apellido: string;
  correo: string;
  cedula?: string;
  telefono?: string;
}

export interface CrearEstudianteRequest {
  nombre: string;
  apellido: string;
  correo: string;
  cedula: string;
  semestre: number;
  telefono?: string;
  idDocente?: number | null;
}

export interface CrearPacienteRequest {
  nombre: string;
  apellido: string;
  correo: string;
  contrasena: string;
  tipoDocumento: string;
  numeroDocumento: string;
  fechaNacimiento: string;
  telefono: string;
}

export const adminService = {
  // Docentes
  listarDocentes: () => api.get<ApiResponse<DocenteResponse[]>>('/admin/docentes'),
  crearDocente: (data: CrearDocenteRequest) => api.post<ApiResponse<DocenteResponse>>('/admin/docentes', data),
  editarDocente: (id: number, data: CrearDocenteRequest) => api.put<ApiResponse<DocenteResponse>>(`/admin/docentes/${id}`, data),
  desactivarDocente: (id: number) => api.delete<ApiResponse<void>>(`/admin/docentes/${id}`),
  eliminarDocente: (id: number) => api.delete<ApiResponse<void>>(`/admin/docentes/${id}/permanente`),
  reactivarDocente: (id: number) => api.patch<ApiResponse<void>>(`/admin/docentes/${id}/reactivar`),

  // Estudiantes
  listarEstudiantes: () => api.get<ApiResponse<EstudianteResponse[]>>('/admin/estudiantes'),
  crearEstudiante: (data: CrearEstudianteRequest) => api.post<ApiResponse<EstudianteResponse>>('/admin/estudiantes', data),
  editarEstudiante: (id: number, data: CrearEstudianteRequest) => api.put<ApiResponse<EstudianteResponse>>(`/admin/estudiantes/${id}`, data),
  desactivarEstudiante: (id: number) => api.delete<ApiResponse<void>>(`/admin/estudiantes/${id}`),
  eliminarEstudiante: (id: number) => api.delete<ApiResponse<void>>(`/admin/estudiantes/${id}/permanente`),
  reactivarEstudiante: (id: number) => api.patch<ApiResponse<void>>(`/admin/estudiantes/${id}/reactivar`),

  // Pacientes
  listarPacientes: () => api.get<ApiResponse<PacienteResponse[]>>('/admin/pacientes'),
  crearPaciente: (data: CrearPacienteRequest) => api.post<ApiResponse<PacienteResponse>>('/admin/pacientes', data),
  editarPaciente: (id: number, data: CrearPacienteRequest) => api.put<ApiResponse<PacienteResponse>>(`/admin/pacientes/${id}`, data),
  desactivarPaciente: (id: number) => api.delete<ApiResponse<void>>(`/admin/pacientes/${id}`),
  eliminarPaciente: (id: number) => api.delete<ApiResponse<void>>(`/admin/pacientes/${id}/permanente`),
  reactivarPaciente: (id: number) => api.patch<ApiResponse<void>>(`/admin/pacientes/${id}/reactivar`),
};
