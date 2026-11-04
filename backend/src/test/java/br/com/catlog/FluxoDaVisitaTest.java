package br.com.catlog;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.catlog.dominio.Enums.SituacaoVisita;
import br.com.catlog.dominio.Visita;
import br.com.catlog.integracao.NominatimCliente;
import br.com.catlog.repositorio.Repositorios.VisitaRepository;
import br.com.catlog.servico.VisitaService;
import com.jayway.jsonpath.JsonPath;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.mockito.Mockito;

@SpringBootTest
@ActiveProfiles("test")
class FluxoDaVisitaTest {

    private static final double LATITUDE = -16.7050;
    private static final double LONGITUDE = -49.2670;

    @Autowired
    private WebApplicationContext contexto;
    @Autowired
    private VisitaRepository visitas;
    @Autowired
    private VisitaService visitaService;
    @MockitoBean
    private NominatimCliente nominatim;

    private MockMvc mvc;

    @BeforeEach
    void preparar() {
        mvc = MockMvcBuilders.webAppContextSetup(contexto).apply(springSecurity()).build();
        Mockito.when(nominatim.buscar(Mockito.anyString()))
                .thenReturn(Optional.of(new NominatimCliente.Coordenadas(LATITUDE, LONGITUDE)));
    }

    @Test
    void visitaPercorreTodoOFluxoERespeitaAsRegras() throws Exception {
        String tutor = cadastrar("TUTOR");
        String cuidador = cadastrar("CUIDADOR");
        long enderecoTutor = criarEndereco(tutor);
        criarEndereco(cuidador);
        long gato = criarGato(tutor);
        long cuidadorId = idDoUsuario(cuidador);

        // Remédio torna "medicou" obrigatório na conclusão (RN05)
        chamarPost(tutor, "/api/gatos/" + gato + "/itens-saude", """
                {"tipo":"REMEDIO","nome":"Metimazol","dataAplicacao":"2026-01-01"}""")
                .andExpect(status().isCreated());

        // RN02: antecedência mínima
        chamarPost(tutor, "/api/visitas", pedidoVisita(cuidadorId, gato, enderecoTutor, Instant.now().plus(Duration.ofHours(2))))
                .andExpect(status().isUnprocessableContent());

        // Perfil errado não pode solicitar visita (R2)
        chamarPost(cuidador, "/api/visitas", pedidoVisita(cuidadorId, gato, enderecoTutor, Instant.now().plus(Duration.ofDays(1))))
                .andExpect(status().isForbidden());

        Instant inicio = Instant.now().plus(Duration.ofDays(1));
        long visita = idDe(chamarPost(tutor, "/api/visitas", pedidoVisita(cuidadorId, gato, enderecoTutor, inicio))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.situacao").value("SOLICITADA")));

        // RN08: antes do aceite, o cuidador não vê os dados de saúde
        chamarGet(cuidador, "/api/visitas/" + visita)
                .andExpect(jsonPath("$.dadosGatosLiberados").value(false))
                .andExpect(jsonPath("$.dadosGatos").doesNotExist());

        // RN06: não pula etapas
        chamarPost(cuidador, "/api/visitas/" + visita + "/relatorio", relatorio(true))
                .andExpect(status().isConflict());

        chamarPost(cuidador, "/api/visitas/" + visita + "/aceitar", "")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.situacao").value("ACEITA"));

        chamarGet(cuidador, "/api/visitas/" + visita)
                .andExpect(jsonPath("$.dadosGatosLiberados").value(true))
                .andExpect(jsonPath("$.dadosGatos[0].tomaRemedio").value(true));

        // RN01: outra visita 20 minutos depois do fim da primeira cai dentro dos 30 minutos de deslocamento
        long conflitante = idDe(chamarPost(tutor, "/api/visitas",
                pedidoVisita(cuidadorId, gato, enderecoTutor, inicio.plus(Duration.ofMinutes(80)))));
        chamarPost(cuidador, "/api/visitas/" + conflitante + "/aceitar", "")
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.mensagem").value(org.hamcrest.Matchers.containsString("conflita")));

        // RN03: fora da janela de horário
        chamarPost(cuidador, "/api/visitas/" + visita + "/checkin", checkin(LATITUDE, LONGITUDE, null))
                .andExpect(status().isUnprocessableContent());

        // Coloca a visita no horário atual para testar distância e conclusão
        moverParaAgora(visita);
        chamarPost(cuidador, "/api/visitas/" + visita + "/checkin", checkin(LATITUDE + 0.01, LONGITUDE, null))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.mensagem").value(org.hamcrest.Matchers.containsString("metros")));
        chamarPost(cuidador, "/api/visitas/" + visita + "/checkin", checkin(LATITUDE, LONGITUDE, null))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.situacao").value("EM_ANDAMENTO"));

        // Reenvio da fila offline não gera erro
        chamarPost(cuidador, "/api/visitas/" + visita + "/checkin", checkin(LATITUDE, LONGITUDE, null))
                .andExpect(status().isOk());

        // RN05: medicou é obrigatório e ao menos 1 foto
        chamarPost(cuidador, "/api/visitas/" + visita + "/relatorio", relatorio(false))
                .andExpect(status().isUnprocessableContent());
        chamarPost(cuidador, "/api/visitas/" + visita + "/relatorio", """
                {"alimentou":true,"trocouAgua":true,"limpouCaixa":true,"medicou":true,"fotos":[]}""")
                .andExpect(status().isBadRequest());
        chamarPost(cuidador, "/api/visitas/" + visita + "/relatorio", relatorio(true))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.situacao").value("CONCLUIDA"))
                .andExpect(jsonPath("$.relatorio.fotos[0]").value("/arquivos/foto.jpg"));
        chamarPost(cuidador, "/api/visitas/" + visita + "/relatorio", relatorio(true))
                .andExpect(status().isOk());

        // RN06: não volta depois de concluída
        chamarPost(tutor, "/api/visitas/" + visita + "/cancelar", "{\"motivo\":\"Mudei de ideia\"}")
                .andExpect(status().isConflict());

        // RF19: as mudanças viram notificações para o tutor, entregues uma vez
        chamarPost(tutor, "/api/notificacoes/entregar", "")
                .andExpect(jsonPath("$[0].titulo").value("Visita aceita"));
        chamarPost(tutor, "/api/notificacoes/entregar", "")
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void cancelamentoRespeitaSeisHorasEPedidoSemRespostaExpira() throws Exception {
        String tutor = cadastrar("TUTOR");
        String cuidador = cadastrar("CUIDADOR");
        long enderecoTutor = criarEndereco(tutor);
        long gato = criarGato(tutor);
        long cuidadorId = idDoUsuario(cuidador);

        long visita = idDe(chamarPost(tutor, "/api/visitas",
                pedidoVisita(cuidadorId, gato, enderecoTutor, Instant.now().plus(Duration.ofDays(1)))));
        chamarPost(cuidador, "/api/visitas/" + visita + "/aceitar", "").andExpect(status().isOk());

        Visita doBanco = visitas.findById(visita).orElseThrow();
        doBanco.setInicio(Instant.now().plus(Duration.ofHours(5)));
        visitas.save(doBanco);
        chamarGet(tutor, "/api/visitas/" + visita).andExpect(jsonPath("$.podeCancelar").value(false));
        chamarPost(tutor, "/api/visitas/" + visita + "/cancelar", "{\"motivo\":\"Imprevisto\"}")
                .andExpect(status().isConflict());

        long semResposta = idDe(chamarPost(tutor, "/api/visitas",
                pedidoVisita(cuidadorId, gato, enderecoTutor, Instant.now().plus(Duration.ofDays(2)))));
        Visita pedido = visitas.findById(semResposta).orElseThrow();
        pedido.setInicio(Instant.now().plus(Duration.ofHours(1)));
        visitas.save(pedido);
        visitaService.expirarPedidosSemResposta();
        assertThat(visitas.findById(semResposta).orElseThrow().getSituacao()).isEqualTo(SituacaoVisita.EXPIRADA);
    }

    @Test
    void tutorNaoAcessaGatoDeOutroTutorEPesoForaDaFaixaEhRecusado() throws Exception {
        String ana = cadastrar("TUTOR");
        String bia = cadastrar("TUTOR");
        long gatoDaAna = criarGato(ana);

        chamarGet(bia, "/api/gatos/" + gatoDaAna).andExpect(status().isNotFound());
        mvc.perform(delete("/api/gatos/" + gatoDaAna).header("Authorization", "Bearer " + bia))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/gatos")).andExpect(status().isUnauthorized());

        chamarPost(ana, "/api/gatos/" + gatoDaAna + "/pesos", "{\"pesoKg\":16,\"dataMedicao\":\"2026-01-01\"}")
                .andExpect(status().isBadRequest());
        chamarPost(ana, "/api/gatos/" + gatoDaAna + "/pesos", "{\"pesoKg\":4,\"dataMedicao\":\"2026-01-01\"}")
                .andExpect(jsonPath("$.alerta").value(false));
        chamarPost(ana, "/api/gatos/" + gatoDaAna + "/pesos", "{\"pesoKg\":3.5,\"dataMedicao\":\"2026-02-01\"}")
                .andExpect(jsonPath("$.alerta").value(true));
    }

    private void moverParaAgora(long visitaId) {
        Visita visita = visitas.findById(visitaId).orElseThrow();
        visita.setInicio(Instant.now());
        visitas.save(visita);
    }

    private String cadastrar(String perfil) throws Exception {
        String email = UUID.randomUUID() + "@teste.com";
        String corpo = """
                {"nome":"Pessoa de Teste","email":"%s","telefone":"62999990000","senha":"senha-de-teste","perfil":"%s"}"""
                .formatted(email, perfil);
        String resposta = mvc.perform(post("/api/auth/cadastro").contentType(MediaType.APPLICATION_JSON).content(corpo))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(resposta, "$.token");
    }

    private long idDoUsuario(String token) throws Exception {
        String resposta = chamarGet(token, "/api/me").andReturn().getResponse().getContentAsString();
        return ((Number) JsonPath.read(resposta, "$.id")).longValue();
    }

    private long criarEndereco(String token) throws Exception {
        return idDe(chamarPost(token, "/api/enderecos", """
                {"apelido":"Casa","cep":"74210-010","logradouro":"Rua das Flores","numero":"142",
                 "bairro":"Setor Bueno","cidade":"Goiânia","uf":"GO","principal":true}""")
                .andExpect(status().isCreated()));
    }

    private long criarGato(String token) throws Exception {
        return idDe(chamarPost(token, "/api/gatos", "{\"nome\":\"Estrela\",\"sexo\":\"FEMEA\"}")
                .andExpect(status().isCreated()));
    }

    private String pedidoVisita(long cuidadorId, long gato, long endereco, Instant inicio) {
        return """
                {"cuidadorId":%d,"gatoIds":[%d],"enderecoId":%d,"inicio":"%s","duracaoMinutos":60}"""
                .formatted(cuidadorId, gato, endereco, inicio);
    }

    private String checkin(double latitude, double longitude, Instant capturadoEm) {
        return """
                {"latitude":%s,"longitude":%s,"capturadoEm":%s}"""
                .formatted(latitude, longitude, capturadoEm == null ? "null" : "\"" + capturadoEm + "\"");
    }

    private String relatorio(boolean medicou) {
        return """
                {"alimentou":true,"trocouAgua":true,"limpouCaixa":true,"medicou":%s,"fotos":["/arquivos/foto.jpg"]}"""
                .formatted(medicou);
    }

    private ResultActions chamarPost(String token, String caminho, String corpo) throws Exception {
        return mvc.perform(post(caminho).header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON).content(corpo));
    }

    private ResultActions chamarGet(String token, String caminho) throws Exception {
        return mvc.perform(get(caminho).header("Authorization", "Bearer " + token));
    }

    private long idDe(ResultActions resultado) throws Exception {
        String resposta = resultado.andReturn().getResponse().getContentAsString();
        return ((Number) JsonPath.read(resposta, "$.id")).longValue();
    }
}
