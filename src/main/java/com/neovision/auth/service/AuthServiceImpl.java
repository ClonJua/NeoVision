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
import java.time.Period;

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

        // Validar telefono colombiano (10 digitos, empieza por 3)
        validarTelefono(request.getTelefono());

        // Validar tipo de documento vs edad
        LocalDate nacimiento = LocalDate.parse(request.getFechaNacimiento());
        validarTipoDocumentoEdad(request.getTipoDocumento(), nacimiento);

        // Validar que no tenga caracteres peligrosos
        validarTextoSeguro(request.getNombre(), "nombre");
        validarTextoSeguro(request.getApellido(), "apellido");

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

    // ===================== VALIDACIONES =====================

    private void validarTelefono(String telefono) {
        if (telefono == null || !telefono.matches("^3\\d{9}$")) {
            throw new RuntimeException("El telefono debe ser un celular colombiano valido (10 digitos, inicia con 3)");
        }
    }

    private void validarTipoDocumentoEdad(String tipoDoc, LocalDate nacimiento) {
        int edad = Period.between(nacimiento, LocalDate.now()).getYears();
        switch (tipoDoc) {
            case "CC" -> {
                if (edad < 18) throw new RuntimeException("Cedula de Ciudadania solo aplica para mayores de 18 anos");
            }
            case "TI" -> {
                if (edad < 7 || edad > 17) throw new RuntimeException("Tarjeta de Identidad aplica para personas entre 7 y 17 anos");
            }
            case "RC" -> {
                if (edad >= 7) throw new RuntimeException("Registro Civil aplica para menores de 7 anos");
            }
            case "CE" -> {
                if (edad < 18) throw new RuntimeException("Cedula de Extranjeria solo aplica para mayores de 18 anos");
            }
            case "PA" -> { /* Pasaporte: cualquier edad */ }
            default -> throw new RuntimeException("Tipo de documento no valido. Use: CC, TI, RC, CE o PA");
        }
    }

    private void validarTextoSeguro(String texto, String campo) {
        if (texto != null && texto.matches(".*[<>{}\\[\\]\\\\].*")) {
            throw new RuntimeException("El campo " + campo + " contiene caracteres no permitidos");
        }
        if (texto != null && texto.matches(".*[\\x{1F600}-\\x{1F9FF}\\x{2600}-\\x{27BF}\\x{1F300}-\\x{1F5FF}].*")) {
            throw new RuntimeException("El campo " + campo + " no puede contener emojis");
        }
    }
}
