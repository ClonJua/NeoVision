package com.neovision.auth.service;

import com.neovision.auth.dto.AuthResponse;
import com.neovision.auth.dto.LoginRequest;
import com.neovision.auth.dto.MicrosoftLoginRequest;
import com.neovision.auth.dto.RegistroRequest;
import com.neovision.auth.jwt.JwtService;
import com.neovision.clinico.entity.Paciente;
import com.neovision.clinico.repository.PacienteRepository;
import com.neovision.common.exception.AutenticacionMicrosoftException;
import com.neovision.common.exception.CorreoYaRegistradoException;
import com.neovision.common.exception.CredencialesInvalidasException;
import com.neovision.common.exception.RolNoEncontradoException;
import com.neovision.common.exception.UsuarioInactivoException;
import com.neovision.common.exception.UsuarioNoRegistradoException;
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
    private final MicrosoftTokenService microsoftTokenService;

    public AuthServiceImpl(UsuarioRepository usuarioRepository,
                           RolRepository rolRepository,
                           PacienteRepository pacienteRepository,
                           JwtService jwtService,
                           PasswordEncoder passwordEncoder,
                           MicrosoftTokenService microsoftTokenService) {
        this.usuarioRepository = usuarioRepository;
        this.rolRepository = rolRepository;
        this.pacienteRepository = pacienteRepository;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
        this.microsoftTokenService = microsoftTokenService;
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        Usuario usuario = usuarioRepository.findByCorreo(request.getCorreo())
                .orElseThrow(() -> new CredencialesInvalidasException("Correo o contraseña inválidos"));

        if (usuario.getContrasena() == null) {
            throw new AutenticacionMicrosoftException("Este usuario debe autenticarse con Microsoft");
        }

        if (!passwordEncoder.matches(request.getContrasena(), usuario.getContrasena())) {
            throw new CredencialesInvalidasException("Correo o contraseña inválidos");
        }

        if (!usuario.getEstado()) {
            throw new UsuarioInactivoException("Tu usuario ha sido desactivado. Contacta al administrador");
        }

        String token = jwtService.generateToken(usuario.getCorreo(), usuario.getRol().getNombreRol());
        return new AuthResponse(token, usuario.getRol().getNombreRol(), usuario.getCorreo());
    }

    @Override
    public AuthResponse registro(RegistroRequest request) {
        if (usuarioRepository.existsByCorreo(request.getCorreo())) {
            throw new CorreoYaRegistradoException("El correo " + request.getCorreo() + " ya está registrado");
        }

        Rol rolPaciente = rolRepository.findByNombreRol("ROLE_PACIENTE")
                .orElseThrow(() -> new RolNoEncontradoException("Rol PACIENTE no encontrado en el sistema"));

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
        paciente.setNumeroDocumento(request.getNumeroDocumento());
        paciente.setFechaNacimiento(LocalDate.parse(request.getFechaNacimiento()));
        paciente.setTelefono(request.getTelefono());
        paciente.setCorreo(request.getCorreo());
        paciente.setUsuario(usuario);
        pacienteRepository.save(paciente);

        String token = jwtService.generateToken(usuario.getCorreo(), rolPaciente.getNombreRol());
        return new AuthResponse(token, rolPaciente.getNombreRol(), usuario.getCorreo());
    }

    @Override
    public AuthResponse loginMicrosoft(MicrosoftLoginRequest request) {
        String correo = microsoftTokenService.extractEmail(request.getAccessToken());

        Usuario usuario = usuarioRepository.findByCorreo(correo)
                .orElseThrow(() -> new UsuarioNoRegistradoException("No estás registrado en el sistema. Contacta a la secretaría"));

        if (!usuario.getEstado()) {
            throw new UsuarioInactivoException("Tu usuario ha sido desactivado. Contacta al administrador");
        }

        String rol = usuario.getRol().getNombreRol();
        if (rol.equals("ROLE_PACIENTE")) {
            throw new AutenticacionMicrosoftException("Los pacientes deben iniciar sesión con correo y contraseña");
        }

        String token = jwtService.generateToken(usuario.getCorreo(), rol);
        return new AuthResponse(token, rol, usuario.getCorreo());
    }
}
