import api from './axios';
import type { ApiResponse } from './authService';
import type { SesionResponse } from './sesionService';

export const docenteService = {
  misSesiones: () =>
    api.get<ApiResponse<SesionResponse[]>>('/docente/sesiones'),
};
