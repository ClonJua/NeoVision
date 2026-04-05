import api from './axios';
import type { ApiResponse } from './authService';
import type { PacienteResponse, CrearPacienteRequest } from './adminService';

export const estudianteService = {
  listarPacientes: () =>
    api.get<ApiResponse<PacienteResponse[]>>('/estudiante/pacientes'),
  crearPaciente: (data: CrearPacienteRequest) =>
    api.post<ApiResponse<PacienteResponse>>('/estudiante/pacientes', data),
};
