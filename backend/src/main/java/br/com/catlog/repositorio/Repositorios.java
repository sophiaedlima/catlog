package br.com.catlog.repositorio;

import br.com.catlog.dominio.Endereco;
import br.com.catlog.dominio.Enums.Perfil;
import br.com.catlog.dominio.Enums.SituacaoVisita;
import br.com.catlog.dominio.Gato;
import br.com.catlog.dominio.ItemSaude;
import br.com.catlog.dominio.Notificacao;
import br.com.catlog.dominio.RegistroPeso;
import br.com.catlog.dominio.RelatorioVisita;
import br.com.catlog.dominio.Usuario;
import br.com.catlog.dominio.Visita;
import jakarta.persistence.LockModeType;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public final class Repositorios {

    private Repositorios() {
    }

    public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

        Optional<Usuario> findByEmailIgnoreCase(String email);

        boolean existsByEmailIgnoreCase(String email);

        List<Usuario> findByPerfil(Perfil perfil);

        /** Trava o cuidador durante o aceite, para dois aceites simultâneos não burlarem a RN01. */
        @Lock(LockModeType.PESSIMISTIC_WRITE)
        @Query("select u from Usuario u where u.id = :id")
        Optional<Usuario> travarPorId(@Param("id") Long id);
    }

    public interface EnderecoRepository extends JpaRepository<Endereco, Long> {

        List<Endereco> findByUsuarioIdOrderByPrincipalDescIdAsc(Long usuarioId);

        Optional<Endereco> findByIdAndUsuarioId(Long id, Long usuarioId);

        Optional<Endereco> findFirstByUsuarioIdOrderByPrincipalDescIdAsc(Long usuarioId);
    }

    public interface GatoRepository extends JpaRepository<Gato, Long> {

        Page<Gato> findByTutorIdAndNomeContainingIgnoreCaseOrderByNomeAsc(Long tutorId, String nome, Pageable pagina);

        List<Gato> findByTutorIdOrderByNomeAsc(Long tutorId);

        Optional<Gato> findByIdAndTutorId(Long id, Long tutorId);
    }

    public interface ItemSaudeRepository extends JpaRepository<ItemSaude, Long> {

        List<ItemSaude> findByGatoIdOrderByProximaDoseAscIdAsc(Long gatoId);

        Optional<ItemSaude> findByIdAndGatoId(Long id, Long gatoId);

        boolean existsByGatoIdInAndTipo(Collection<Long> gatoIds, br.com.catlog.dominio.Enums.TipoItemSaude tipo);
    }

    public interface RegistroPesoRepository extends JpaRepository<RegistroPeso, Long> {

        List<RegistroPeso> findByGatoIdOrderByDataMedicaoAscIdAsc(Long gatoId);

        Optional<RegistroPeso> findFirstByGatoIdOrderByDataMedicaoDescIdDesc(Long gatoId);

        Optional<RegistroPeso> findByIdAndGatoId(Long id, Long gatoId);
    }

    public interface VisitaRepository extends JpaRepository<Visita, Long>, JpaSpecificationExecutor<Visita> {

        List<Visita> findByCuidadorIdAndSituacaoIn(Long cuidadorId, Collection<SituacaoVisita> situacoes);

        List<Visita> findBySituacaoAndInicioLessThanEqual(SituacaoVisita situacao, Instant limite);

        Optional<Visita> findFirstByTutorIdAndSituacaoInAndInicioAfterOrderByInicioAsc(
                Long tutorId, Collection<SituacaoVisita> situacoes, Instant depoisDe);

        Optional<Visita> findFirstByTutorIdAndSituacaoOrderByInicioDesc(Long tutorId, SituacaoVisita situacao);

        List<Visita> findByCuidadorIdAndInicioBetweenOrderByInicioAsc(Long cuidadorId, Instant de, Instant ate);

        @Query("select count(v) > 0 from Visita v join v.gatos g where g.id = :gatoId and v.situacao in :situacoes")
        boolean gatoEmVisitaAtiva(@Param("gatoId") Long gatoId, @Param("situacoes") Collection<SituacaoVisita> situacoes);

        boolean existsByEnderecoId(Long enderecoId);

        @Query("select count(v) > 0 from Visita v where (v.tutor.id = :id or v.cuidador.id = :id) and v.situacao in :situacoes")
        boolean usuarioEmVisitaAtiva(@Param("id") Long id, @Param("situacoes") Collection<SituacaoVisita> situacoes);

        @Query("select count(v) from Visita v where v.cuidador.id = :id and v.situacao = :situacao and v.inicio >= :de and v.inicio < :ate")
        long contarDoCuidador(@Param("id") Long id, @Param("situacao") SituacaoVisita situacao,
                              @Param("de") Instant de, @Param("ate") Instant ate);
    }

    public interface RelatorioVisitaRepository extends JpaRepository<RelatorioVisita, Long> {
    }

    public interface NotificacaoRepository extends JpaRepository<Notificacao, Long> {

        List<Notificacao> findByUsuarioIdAndEntregueFalseOrderByCriadaEmAsc(Long usuarioId);
    }
}
