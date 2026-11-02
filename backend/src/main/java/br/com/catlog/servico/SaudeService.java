package br.com.catlog.servico;

import br.com.catlog.dominio.Enums.TipoItemSaude;
import br.com.catlog.dominio.Gato;
import br.com.catlog.dominio.ItemSaude;
import br.com.catlog.dominio.RegistroPeso;
import br.com.catlog.dto.Dtos.ItemSaudeRequest;
import br.com.catlog.dto.Dtos.ItemSaudeResponse;
import br.com.catlog.dto.Dtos.PesoRequest;
import br.com.catlog.dto.Dtos.PesoResponse;
import br.com.catlog.erro.ErroApi;
import br.com.catlog.regras.RegrasSaude;
import br.com.catlog.repositorio.Repositorios.ItemSaudeRepository;
import br.com.catlog.repositorio.Repositorios.RegistroPesoRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SaudeService {

    private final ItemSaudeRepository itens;
    private final RegistroPesoRepository pesos;
    private final GatoService gatos;
    private final ZoneId fuso;

    public SaudeService(ItemSaudeRepository itens, RegistroPesoRepository pesos, GatoService gatos, ZoneId fuso) {
        this.itens = itens;
        this.pesos = pesos;
        this.gatos = gatos;
        this.fuso = fuso;
    }

    @Transactional(readOnly = true)
    public List<ItemSaudeResponse> listarItens(Long tutorId, Long gatoId) {
        gatos.buscarEntidade(tutorId, gatoId);
        return itensDoGato(gatoId);
    }

    List<ItemSaudeResponse> itensDoGato(Long gatoId) {
        return itens.findByGatoIdOrderByProximaDoseAscIdAsc(gatoId).stream().map(this::paraResponse).toList();
    }

    @Transactional
    public ItemSaudeResponse criarItem(Long tutorId, Long gatoId, ItemSaudeRequest pedido) {
        Gato gato = gatos.buscarEntidade(tutorId, gatoId);
        ItemSaude item = new ItemSaude();
        item.setGato(gato);
        preencher(item, pedido);
        return paraResponse(itens.save(item));
    }

    @Transactional
    public ItemSaudeResponse atualizarItem(Long tutorId, Long gatoId, Long id, ItemSaudeRequest pedido) {
        gatos.buscarEntidade(tutorId, gatoId);
        ItemSaude item = buscarItem(gatoId, id);
        preencher(item, pedido);
        return paraResponse(item);
    }

    @Transactional
    public void excluirItem(Long tutorId, Long gatoId, Long id) {
        gatos.buscarEntidade(tutorId, gatoId);
        itens.delete(buscarItem(gatoId, id));
    }

    @Transactional(readOnly = true)
    public List<PesoResponse> listarPesos(Long tutorId, Long gatoId) {
        gatos.buscarEntidade(tutorId, gatoId);
        List<RegistroPeso> registros = pesos.findByGatoIdOrderByDataMedicaoAscIdAsc(gatoId);
        List<PesoResponse> resposta = new ArrayList<>();
        BigDecimal anterior = null;
        for (RegistroPeso registro : registros) {
            resposta.add(paraResponse(registro, anterior));
            anterior = registro.getPesoKg();
        }
        return resposta;
    }

    /** RN07: a variação é sempre calculada em relação ao registro mais recente anterior à medição. */
    @Transactional
    public PesoResponse registrarPeso(Long tutorId, Long gatoId, PesoRequest pedido) {
        Gato gato = gatos.buscarEntidade(tutorId, gatoId);
        BigDecimal anterior = pesos.findByGatoIdOrderByDataMedicaoAscIdAsc(gatoId).stream()
                .filter(r -> !r.getDataMedicao().isAfter(pedido.dataMedicao()))
                .reduce((a, b) -> b)
                .map(RegistroPeso::getPesoKg)
                .orElse(null);
        RegistroPeso registro = new RegistroPeso();
        registro.setGato(gato);
        registro.setPesoKg(pedido.pesoKg());
        registro.setDataMedicao(pedido.dataMedicao());
        return paraResponse(pesos.save(registro), anterior);
    }

    @Transactional
    public void excluirPeso(Long tutorId, Long gatoId, Long id) {
        gatos.buscarEntidade(tutorId, gatoId);
        pesos.delete(pesos.findByIdAndGatoId(id, gatoId)
                .orElseThrow(() -> ErroApi.naoEncontrado("Registro de peso não encontrado.")));
    }

    ItemSaudeResponse paraResponse(ItemSaude i) {
        return new ItemSaudeResponse(i.getId(), i.getGato().getId(), i.getTipo(), i.getNome(), i.getDataAplicacao(),
                i.getProximaDose(), i.getInstrucoes(), RegrasSaude.situacao(i.getProximaDose(), LocalDate.now(fuso)));
    }

    private ItemSaude buscarItem(Long gatoId, Long id) {
        return itens.findByIdAndGatoId(id, gatoId)
                .orElseThrow(() -> ErroApi.naoEncontrado("Cuidado de saúde não encontrado."));
    }

    private void preencher(ItemSaude item, ItemSaudeRequest pedido) {
        if (pedido.proximaDose() == null && pedido.tipo() != TipoItemSaude.REMEDIO) {
            throw ErroApi.invalido("Informe a data da próxima dose.");
        }
        if (pedido.proximaDose() != null && pedido.proximaDose().isBefore(pedido.dataAplicacao())) {
            throw ErroApi.invalido("A próxima dose não pode ser antes da data de aplicação.");
        }
        item.setTipo(pedido.tipo());
        item.setNome(pedido.nome().trim());
        item.setDataAplicacao(pedido.dataAplicacao());
        item.setProximaDose(pedido.proximaDose());
        item.setInstrucoes(pedido.instrucoes());
    }

    private PesoResponse paraResponse(RegistroPeso r, BigDecimal anterior) {
        BigDecimal variacao = anterior == null ? null : RegrasSaude.variacaoPercentual(anterior, r.getPesoKg());
        return new PesoResponse(r.getId(), r.getPesoKg(), r.getDataMedicao(), variacao,
                variacao != null && RegrasSaude.variacaoExigeAlerta(variacao));
    }
}
