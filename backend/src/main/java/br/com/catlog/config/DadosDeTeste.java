package br.com.catlog.config;

import br.com.catlog.dominio.Endereco;
import br.com.catlog.dominio.Enums.Perfil;
import br.com.catlog.dominio.Enums.Sexo;
import br.com.catlog.dominio.Enums.SituacaoVisita;
import br.com.catlog.dominio.Enums.TipoItemSaude;
import br.com.catlog.dominio.Gato;
import br.com.catlog.dominio.ItemSaude;
import br.com.catlog.dominio.RegistroPeso;
import br.com.catlog.dominio.RelatorioVisita;
import br.com.catlog.dominio.Usuario;
import br.com.catlog.dominio.Visita;
import br.com.catlog.integracao.ArmazenamentoFotos;
import br.com.catlog.repositorio.Repositorios.EnderecoRepository;
import br.com.catlog.repositorio.Repositorios.GatoRepository;
import br.com.catlog.repositorio.Repositorios.ItemSaudeRepository;
import br.com.catlog.repositorio.Repositorios.RegistroPesoRepository;
import br.com.catlog.repositorio.Repositorios.RelatorioVisitaRepository;
import br.com.catlog.repositorio.Repositorios.UsuarioRepository;
import br.com.catlog.repositorio.Repositorios.VisitaRepository;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.List;
import javax.imageio.ImageIO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/** Contas e dados de demonstração do modo dev, com datas sempre relativas ao dia em que a API sobe. */
@Component
@Profile("dev")
public class DadosDeTeste implements ApplicationRunner {

    private final UsuarioRepository usuarios;
    private final EnderecoRepository enderecos;
    private final GatoRepository gatos;
    private final ItemSaudeRepository itens;
    private final RegistroPesoRepository pesos;
    private final VisitaRepository visitas;
    private final RelatorioVisitaRepository relatorios;
    private final ArmazenamentoFotos armazenamento;
    private final PasswordEncoder codificador;
    private final ZoneId fuso;
    private final String senhaTeste;

    public DadosDeTeste(UsuarioRepository usuarios, EnderecoRepository enderecos, GatoRepository gatos,
                        ItemSaudeRepository itens, RegistroPesoRepository pesos, VisitaRepository visitas,
                        RelatorioVisitaRepository relatorios, ArmazenamentoFotos armazenamento,
                        PasswordEncoder codificador, ZoneId fuso,
                        @Value("${catlog.dev.senha-teste}") String senhaTeste) {
        this.usuarios = usuarios;
        this.enderecos = enderecos;
        this.gatos = gatos;
        this.itens = itens;
        this.pesos = pesos;
        this.visitas = visitas;
        this.relatorios = relatorios;
        this.armazenamento = armazenamento;
        this.codificador = codificador;
        this.fuso = fuso;
        this.senhaTeste = senhaTeste;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) throws IOException {
        if (senhaTeste.isBlank() || usuarios.count() > 0) {
            return;
        }

        Usuario cleide = usuario("Cleide Lima", "cleide@email.com", "62999990000", Perfil.TUTOR, null, 10);
        Usuario felipe = usuario("Felipe Savioli", "felipe@email.com", "62988880000", Perfil.CUIDADOR,
                "Estudante de Veterinária", 10);
        Usuario hemily = usuario("Hemily Ramos", "hemily@email.com", "62977770000", Perfil.CUIDADOR,
                "Cuidadora há 3 anos", 8);
        Usuario gabriel = usuario("Gabriel Brito", "gabriel@email.com", "62966660000", Perfil.CUIDADOR,
                "Atende finais de semana", 15);
        Usuario duda = usuario("Duda Ferreira", "duda@email.com", "62955550000", Perfil.CUIDADOR,
                "Cuida de gatos idosos", 20);

        Endereco casa = endereco(cleide, "Casa", "74210-010", "Rua das Flores", "142", "Setor Bueno", -16.7050, -49.2670, true);
        endereco(cleide, "Casa da minha mãe", "74120-010", "Rua 9", "51", "Setor Oeste", -16.6780, -49.2650, false);
        endereco(felipe, "Base", "74230-010", "Avenida T-9", "1000", "Setor Bueno", -16.7180, -49.2860, true);
        endereco(hemily, "Base", "74810-100", "Avenida 85", "500", "Setor Marista", -16.7040, -49.2380, true);
        endereco(gabriel, "Base", "74343-010", "Rua Jaraguá", "20", "Cidade Jardim", -16.6900, -49.3060, true);
        endereco(duda, "Base", "74475-010", "Avenida Perimetral", "300", "Setor Campinas", -16.6300, -49.2900, true);

        LocalDate hoje = LocalDate.now(fuso);
        Gato estrela = gato(cleide, "Estrela", "Siamês", Sexo.FEMEA, hoje.minusYears(6),
                "Toma Metimazol 2,5 mg todos os dias, às 8h, junto com a ração úmida.");
        Gato frida = gato(cleide, "Frida", "SRD", Sexo.FEMEA, hoje.minusYears(2), null);
        Gato nino = gato(cleide, "Nino", "SRD", Sexo.MACHO, hoje.minusYears(4),
                "Ração seca sem grãos, por recomendação do veterinário.");

        item(estrela, TipoItemSaude.VACINA, "Antirrábica", hoje.minusDays(380), hoje.minusDays(15), null);
        item(estrela, TipoItemSaude.VERMIFUGO, "Vermífugo", hoje.minusDays(85), hoje.plusDays(5), null);
        item(estrela, TipoItemSaude.REMEDIO, "Metimazol 2,5 mg", hoje.minusDays(120), null, "Uso contínuo, todos os dias às 8h");
        item(estrela, TipoItemSaude.VACINA, "Quádrupla felina", hoje.minusDays(200), hoje.plusDays(165), null);
        item(frida, TipoItemSaude.VACINA, "Quádrupla felina", hoje.minusDays(60), hoje.plusDays(305), null);
        item(nino, TipoItemSaude.VACINA, "Antirrábica", hoje.minusDays(100), hoje.plusDays(265), null);

        String[] pesosEstrela = {"4.6", "4.55", "4.5", "4.4", "4.3", "4.05"};
        for (int i = 0; i < pesosEstrela.length; i++) {
            peso(estrela, pesosEstrela[i], hoje.minusMonths(pesosEstrela.length - 1L - i));
        }
        peso(frida, "3.6", hoje.minusDays(40));
        peso(nino, "4.9", hoje.minusDays(40));

        String instrucoes = "Ração úmida da Estrela fica na geladeira. O remédio está no pote azul.";
        Instant agora = Instant.now().truncatedTo(ChronoUnit.MINUTES);

        visita(cleide, felipe, casa, agora.plus(Duration.ofMinutes(5)), 60, SituacaoVisita.ACEITA, instrucoes, List.of(estrela, frida));
        visita(cleide, felipe, casa, agora.plus(Duration.ofDays(3)), 60, SituacaoVisita.ACEITA, instrucoes, List.of(estrela, frida));
        visita(cleide, felipe, casa, agora.plus(Duration.ofDays(2)), 30, SituacaoVisita.SOLICITADA, "Só trocar a água e a areia.", List.of(nino));

        Visita anterior = visita(cleide, felipe, casa, agora.minus(Duration.ofDays(1)), 60, SituacaoVisita.CONCLUIDA, instrucoes, List.of(estrela, frida));
        anterior.setCheckinEm(anterior.getInicio());
        anterior.setConcluidaEm(anterior.fim());
        RelatorioVisita relatorio = new RelatorioVisita();
        relatorio.setVisita(anterior);
        relatorio.setAlimentou(true);
        relatorio.setTrocouAgua(true);
        relatorio.setLimpouCaixa(true);
        relatorio.setMedicou(true);
        relatorio.setObservacoes("Alimentei, troquei a água, limpei a caixa e dei o remédio da Estrela. As duas comeram bem.");
        relatorio.setRegistradoEm(anterior.fim());
        relatorio.adicionarFoto(armazenamento.salvar(fotoDeExemplo(new Color(0xE9A825)), "image/png"));
        relatorio.adicionarFoto(armazenamento.salvar(fotoDeExemplo(new Color(0x2F7D6E)), "image/png"));
        relatorios.save(relatorio);
    }

    private Usuario usuario(String nome, String email, String telefone, Perfil perfil, String apresentacao, int raio) {
        Usuario u = new Usuario();
        u.setNome(nome);
        u.setEmail(email);
        u.setTelefone(telefone);
        u.setPerfil(perfil);
        u.setApresentacao(apresentacao);
        u.setRaioAtendimentoKm(raio);
        u.setSenhaHash(codificador.encode(senhaTeste));
        return usuarios.save(u);
    }

    private Endereco endereco(Usuario dono, String apelido, String cep, String logradouro, String numero, String bairro,
                              double latitude, double longitude, boolean principal) {
        Endereco e = new Endereco();
        e.setUsuario(dono);
        e.setApelido(apelido);
        e.setCep(cep);
        e.setLogradouro(logradouro);
        e.setNumero(numero);
        e.setBairro(bairro);
        e.setCidade("Goiânia");
        e.setUf("GO");
        e.setLatitude(latitude);
        e.setLongitude(longitude);
        e.setPrincipal(principal);
        return enderecos.save(e);
    }

    private Gato gato(Usuario tutor, String nome, String raca, Sexo sexo, LocalDate nascimento, String cuidados) {
        Gato g = new Gato();
        g.setTutor(tutor);
        g.setNome(nome);
        g.setRaca(raca);
        g.setSexo(sexo);
        g.setDataNascimento(nascimento);
        g.setCuidadosEspeciais(cuidados);
        return gatos.save(g);
    }

    private void item(Gato gato, TipoItemSaude tipo, String nome, LocalDate aplicacao, LocalDate proxima, String instrucoes) {
        ItemSaude i = new ItemSaude();
        i.setGato(gato);
        i.setTipo(tipo);
        i.setNome(nome);
        i.setDataAplicacao(aplicacao);
        i.setProximaDose(proxima);
        i.setInstrucoes(instrucoes);
        itens.save(i);
    }

    private void peso(Gato gato, String kg, LocalDate data) {
        RegistroPeso r = new RegistroPeso();
        r.setGato(gato);
        r.setPesoKg(new BigDecimal(kg));
        r.setDataMedicao(data);
        pesos.save(r);
    }

    private Visita visita(Usuario tutor, Usuario cuidador, Endereco endereco, Instant inicio, int duracao,
                          SituacaoVisita situacao, String instrucoes, List<Gato> gatosDaVisita) {
        Visita v = new Visita();
        v.setTutor(tutor);
        v.setCuidador(cuidador);
        v.setEndereco(endereco);
        v.setInicio(inicio);
        v.setDuracaoMinutos(duracao);
        v.setSituacao(situacao);
        v.setInstrucoes(instrucoes);
        v.getGatos().addAll(gatosDaVisita);
        return visitas.save(v);
    }

    private byte[] fotoDeExemplo(Color fundo) throws IOException {
        BufferedImage imagem = new BufferedImage(480, 360, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = imagem.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g.setColor(fundo);
        g.fillRect(0, 0, 480, 360);
        g.setColor(Color.WHITE);
        g.fillOval(150, 90, 180, 180);
        g.fillPolygon(new int[]{160, 165, 215}, new int[]{170, 60, 110}, 3);
        g.fillPolygon(new int[]{320, 315, 265}, new int[]{170, 60, 110}, 3);
        g.setColor(new Color(0x1B2A41));
        g.fillOval(195, 160, 18, 18);
        g.fillOval(267, 160, 18, 18);
        g.dispose();
        ByteArrayOutputStream saida = new ByteArrayOutputStream();
        ImageIO.write(imagem, "png", saida);
        return saida.toByteArray();
    }
}
