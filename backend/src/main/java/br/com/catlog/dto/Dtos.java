package br.com.catlog.dto;

import br.com.catlog.dominio.Enums.Perfil;
import br.com.catlog.dominio.Enums.Sexo;
import br.com.catlog.dominio.Enums.SituacaoSaude;
import br.com.catlog.dominio.Enums.SituacaoVisita;
import br.com.catlog.dominio.Enums.TipoItemSaude;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.domain.Page;

/** Objetos trocados entre o aplicativo e a API. */
public final class Dtos {

    private Dtos() {
    }

    public record Pagina<T>(List<T> itens, int pagina, int totalPaginas, long total) {

        public static <T> Pagina<T> de(Page<T> page) {
            return new Pagina<>(page.getContent(), page.getNumber(), page.getTotalPages(), page.getTotalElements());
        }
    }

    public record CadastroRequest(
            @NotBlank(message = "Informe seu nome.") @Size(max = 120, message = "O nome pode ter até 120 caracteres.") String nome,
            @NotBlank(message = "Informe seu e-mail.") @Email(message = "Informe um e-mail válido.") @Size(max = 160) String email,
            @NotBlank(message = "Informe seu telefone.") @Size(min = 10, max = 20, message = "Informe um telefone com DDD.") String telefone,
            @NotBlank(message = "Informe uma senha.") @Size(min = 8, max = 72, message = "A senha precisa ter pelo menos 8 caracteres.") String senha,
            @NotNull(message = "Escolha como vai usar o aplicativo.") Perfil perfil) {
    }

    public record LoginRequest(
            @NotBlank(message = "Informe seu e-mail.") String email,
            @NotBlank(message = "Informe sua senha.") String senha) {
    }

    public record UsuarioResponse(Long id, String nome, String email, String telefone, Perfil perfil,
                                  String apresentacao, int raioAtendimentoKm, Instant criadoEm) {
    }

    public record SessaoResponse(String token, UsuarioResponse usuario) {
    }

    public record AtualizarUsuarioRequest(
            @NotBlank(message = "Informe seu nome.") @Size(max = 120) String nome,
            @NotBlank(message = "Informe seu telefone.") @Size(min = 10, max = 20, message = "Informe um telefone com DDD.") String telefone,
            @Size(max = 300, message = "A apresentação pode ter até 300 caracteres.") String apresentacao,
            @Min(value = 1, message = "O raio de atendimento mínimo é de 1 km.")
            @Max(value = 50, message = "O raio de atendimento máximo é de 50 km.") Integer raioAtendimentoKm) {
    }

    public record EnderecoRequest(
            @NotBlank(message = "Dê um nome para o endereço, como Casa.") @Size(max = 60) String apelido,
            @NotBlank(message = "Informe o CEP.") @Pattern(regexp = "\\d{5}-?\\d{3}", message = "Informe um CEP com 8 números.") String cep,
            @NotBlank(message = "Informe a rua.") @Size(max = 160) String logradouro,
            @NotBlank(message = "Informe o número.") @Size(max = 20) String numero,
            @Size(max = 80) String complemento,
            @NotBlank(message = "Informe o bairro.") @Size(max = 100) String bairro,
            @NotBlank(message = "Informe a cidade.") @Size(max = 100) String cidade,
            @NotBlank(message = "Informe o estado.") @Pattern(regexp = "[A-Za-z]{2}", message = "Informe o estado com 2 letras.") String uf,
            boolean principal) {
    }

    public record EnderecoResponse(Long id, String apelido, String cep, String logradouro, String numero,
                                   String complemento, String bairro, String cidade, String uf,
                                   Double latitude, Double longitude, boolean principal) {
    }

    public record GatoRequest(
            @NotBlank(message = "Informe o nome do gato.") @Size(max = 60) String nome,
            @Size(max = 60) String raca,
            @NotNull(message = "Informe o sexo do gato.") Sexo sexo,
            @PastOrPresent(message = "A data de nascimento não pode estar no futuro.") LocalDate dataNascimento,
            @Size(max = 500) String fotoUrl,
            @Size(max = 500, message = "Os cuidados especiais podem ter até 500 caracteres.") String cuidadosEspeciais) {
    }

    public record GatoResponse(Long id, String nome, String raca, Sexo sexo, LocalDate dataNascimento, String fotoUrl,
                               String cuidadosEspeciais, BigDecimal pesoAtualKg, LocalDate pesoMedidoEm,
                               SituacaoSaude situacaoSaude, boolean tomaRemedio) {
    }

    public record ItemSaudeRequest(
            @NotNull(message = "Escolha o tipo do cuidado.") TipoItemSaude tipo,
            @NotBlank(message = "Informe o nome do cuidado.") @Size(max = 80) String nome,
            @NotNull(message = "Informe a data de aplicação.") @PastOrPresent(message = "A data de aplicação não pode estar no futuro.") LocalDate dataAplicacao,
            LocalDate proximaDose,
            @Size(max = 300) String instrucoes) {
    }

    public record ItemSaudeResponse(Long id, Long gatoId, TipoItemSaude tipo, String nome, LocalDate dataAplicacao,
                                    LocalDate proximaDose, String instrucoes, SituacaoSaude situacao) {
    }

    public record PesoRequest(
            @NotNull(message = "Informe o peso.")
            @DecimalMin(value = "0.5", message = "O peso precisa estar entre 0,5 e 15 kg.")
            @DecimalMax(value = "15", message = "O peso precisa estar entre 0,5 e 15 kg.") BigDecimal pesoKg,
            @NotNull(message = "Informe a data da medição.") @PastOrPresent(message = "A data da medição não pode estar no futuro.") LocalDate dataMedicao) {
    }

    public record PesoResponse(Long id, BigDecimal pesoKg, LocalDate dataMedicao, BigDecimal variacaoPercentual,
                               boolean alerta) {
    }

    public record CuidadorResponse(Long id, String nome, String apresentacao, int raioAtendimentoKm, double distanciaKm) {
    }

    public record VisitaRequest(
            @NotNull(message = "Escolha o cuidador.") Long cuidadorId,
            @NotEmpty(message = "Escolha pelo menos um gato para a visita.") List<Long> gatoIds,
            @NotNull(message = "Escolha o endereço.") Long enderecoId,
            @NotNull(message = "Escolha a data e o horário.") Instant inicio,
            @NotNull(message = "Escolha a duração.") Integer duracaoMinutos,
            @Size(max = 500, message = "As instruções podem ter até 500 caracteres.") String instrucoes) {
    }

    public record CancelarRequest(
            @NotBlank(message = "Conte o motivo do cancelamento.") @Size(max = 300) String motivo) {
    }

    public record CheckinRequest(
            @NotNull(message = "Não foi possível obter sua localização.") Double latitude,
            @NotNull(message = "Não foi possível obter sua localização.") Double longitude,
            Instant capturadoEm) {
    }

    public record RelatorioRequest(
            boolean alimentou,
            boolean trocouAgua,
            boolean limpouCaixa,
            boolean medicou,
            @Size(max = 1000, message = "As observações podem ter até 1000 caracteres.") String observacoes,
            @NotEmpty(message = "Anexe pelo menos 1 foto.") @Size(max = 5, message = "Anexe no máximo 5 fotos.") List<String> fotos,
            Instant capturadoEm) {
    }

    public record PessoaResumo(Long id, String nome, String telefone) {
    }

    public record GatoDaVisita(Long id, String nome, String fotoUrl) {
    }

    public record GatoDetalheVisita(Long id, String nome, String raca, Sexo sexo, LocalDate dataNascimento,
                                    String fotoUrl, String cuidadosEspeciais, boolean tomaRemedio,
                                    List<ItemSaudeResponse> itensSaude) {
    }

    public record RelatorioResponse(boolean alimentou, boolean trocouAgua, boolean limpouCaixa, boolean medicou,
                                    String observacoes, Instant registradoEm, List<String> fotos) {
    }

    public record VisitaResponse(Long id, SituacaoVisita situacao, Instant inicio, Instant fim, int duracaoMinutos,
                                 String instrucoes, PessoaResumo tutor, PessoaResumo cuidador,
                                 EnderecoResponse endereco, List<GatoDaVisita> gatos, String motivoCancelamento,
                                 Perfil canceladaPor, Instant checkinEm, Instant concluidaEm, boolean podeCancelar,
                                 boolean dadosGatosLiberados, boolean precisaMedicar,
                                 List<GatoDetalheVisita> dadosGatos, RelatorioResponse relatorio) {
    }

    public record AlertaSaude(Long gatoId, String gatoNome, Long itemId, String itemNome, SituacaoSaude situacao,
                              LocalDate proximaDose) {
    }

    public record ResumoTutor(List<AlertaSaude> alertas, VisitaResponse proximaVisita, VisitaResponse ultimaVisita,
                              List<String> nomesGatos) {
    }

    public record ResumoCuidador(List<VisitaResponse> visitasHoje, long pendentes, long concluidasMes, long agendadasMes) {
    }

    public record NotificacaoResponse(Long id, Long visitaId, String titulo, String mensagem) {
    }

    public record FotoResponse(String url) {
    }
}
