package com.neovision.auth.service;

import com.neovision.auth.dto.AuthResponse;
import com.neovision.auth.dto.LoginRequest;
import com.neovision.auth.dto.RegistroRequest;

public interface AuthService {

    AuthResponse login(LoginRequest request);

    AuthResponse registro(RegistroRequest request);
}
