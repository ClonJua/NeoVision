package com.neovision.clinico.repository;

import com.neovision.clinico.entity.Paciente;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PacienteRepository extends JpaRepository<Paciente, Integer> {

    Optional<Paciente> findByUsuarioIdUsuario(Integer idUsuario);
}
