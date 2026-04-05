import api from './axios';

export interface LoginRequest {
  correo: string;
  contrasena: string;
}

export interface RegistroRequest {
  nombre: string;
  apellido: string;
  correo: string;
  contrasena: string;
  tipoDocumento: string;
  numeroDocumento: string;
  fechaNacimiento: string;
  telefono: string;
}

export interface MicrosoftLoginRequest {
  accessToken: string;
}

export interface AuthResponse {
  token: string;
  rol: string;
  correo: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const authService = {
  login: (data: LoginRequest) =>
    api.post<ApiResponse<AuthResponse>>('/auth/login', data),

  registro: (data: RegistroRequest) =>
    api.post<ApiResponse<AuthResponse>>('/auth/registro', data),

  loginMicrosoft: (data: MicrosoftLoginRequest) =>
    api.post<ApiResponse<AuthResponse>>('/auth/microsoft', data),
};
