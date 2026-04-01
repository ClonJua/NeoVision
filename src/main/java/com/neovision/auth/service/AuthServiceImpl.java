package com.neovision.auth.service;

import com.neovision.auth.dto.AuthResponse;
import com.neovision.auth.dto.LoginRequest;
import com.neovision.auth.dto.RegistroRequest;
import com.neovision.auth.jwt.JwtService;
import com.neovision.clinico.entity.Paciente;
import com.neovision.clinico.repository.PacienteRepository;
import com.neovision.usuario.entity.Rol;
import com.neovision.usuario.entity.Usuario;
import com.neovision.usuario.repository.RolRepository;
import com.neovision.usuario.repository.UsuarioRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
public class AuthServiceImpl implements AuthService {

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final PacienteRepository pacienteRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    public AuthServiceImpl(UsuarioRepository usuarioRepository,
                           RolRepository rolRepository,
                           PacienteRepository pacienteRepository,
                           JwtService jwtService,
                           PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.rolRepository = rolRepository;
        this.pacienteRepository = pacienteRepository;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        Usuario usuario = usuarioRepository.findByCorreo(request.getCorreo())
                .orElseThrow(() -> new RuntimeException("Credenciales inválidas"));

        if (usuario.getContrasena() == null) {
            throw new RuntimeException("Este usuario debe autenticarse con Microsoft");
        }

        if (!passwordEncoder.matches(request.getContrasena(), usuario.getContrasena())) {
            throw new RuntimeException("Credenciales inválidas");
        }

        if (!usuario.getEstado()) {
            throw new RuntimeException("Usuario inactivo");
        }

        String token = jwtService.generateToken(usuario.getCorreo(), usuario.getRol().getNombreRol());
        return new AuthResponse(token, usuario.getRol().getNombreRol(), usuario.getCorreo());
    }

    @Override
    public AuthResponse registro(RegistroRequest request) {
        if (usuarioRepository.existsByCorreo(request.getCorreo())) {
            throw new RuntimeException("El correo ya está registrado");
        }

        Rol rolPaciente = rolRepository.findByNombreRol("ROLE_PACIENTE")
                .orElseThrow(() -> new RuntimeException("Rol PACIENTE no encontrado"));

        Usuario usuario = new Usuario();
        usuario.setCorreo(request.getCorreo());
        usuario.setContrasena(passwordEncoder.encode(request.getContrasena()));
        usuario.setEstado(true);
        usuario.setRol(rolPaciente);
        usuarioRepository.save(usuario);

        Paciente paciente = new Paciente();
        paciente.setNombre(request.getNombre());
        paciente.setApellido(request.getApellido());
        paciente.setTipoDocumento(request.getTipoDocumento());
        paciente.setFechaNacimiento(LocalDate.parse(request.getFechaNacimiento()));
        paciente.setTelefono(request.getTelefono());
        paciente.setCorreo(request.getCorreo());
        paciente.setUsuario(usuario);
        pacienteRepository.save(paciente);

        String token = jwtService.generateToken(usuario.getCorreo(), rolPaciente.getNombreRol());
        return new AuthResponse(token, rolPaciente.getNombreRol(), usuario.getCorreo());
    }
}
