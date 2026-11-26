# Roteiro da apresentação final (N2)

Segue o Apêndice D do documento norteador: 20 minutos de apresentação e até 10 minutos de arguição, com todos os integrantes falando. O texto de cada slide está nas notas do apresentador da apresentação de slides.

## 1. Divisão do tempo

| Bloco | Tempo | Slides | Quem fala |
|-------|-------|--------|-----------|
| Contextualização | 3 min | Capa, problema, proposta | Sophia |
| Especificação | 4 min | Personas e escopo | Hemily (2 min) |
| | | Regras de negócio e ciclo da visita | Sophia (2 min) |
| Decisões técnicas | 5 min | Arquitetura e uso sem internet | Gabriel (2 min 30 s) |
| | | Banco de dados e tecnologias | Sophia (2 min 30 s) |
| Demonstração | 6 min | Fluxo do tutor | Hemily (3 min) |
| | | Fluxo do cuidador | Gabriel (3 min) |
| Encerramento | 2 min | Testes e usabilidade | Hemily (1 min 10 s) |
| | | Limitações e próximos passos | Gabriel (40 s) |
| | | Agradecimento | Sophia (10 s) |

Ensaiem pelo menos uma vez cronometrando. Se passar de 20 minutos, encurtem a fala dos slides, nunca a demonstração.

## 2. Preparação (30 minutos antes)

1. Fechar programas pesados (navegador com muitas abas, VS Code). O computador tem pouca memória para emulador e API juntos.
2. Conferir se não sobrou `java.exe` antigo na porta 8080 (`netstat -ano | findstr :8080`).
3. Ligar o emulador com pouca memória:
   `emulator -avd Pixel_8 -memory 1536 -no-snapshot-save`
4. **Ligar a API uns 5 minutos antes de começar a apresentação**, a partir da pasta `backend`:
   `java -Xmx384m -jar target/catlog-api-0.1.0.jar`
   A visita de demonstração começa 5 minutos depois de a API ligar, e o check-in só funciona até 30 minutos depois desse início. Assim, a demonstração cai dentro dessa janela.
5. `adb reverse tcp:8080 tcp:8080` e `adb emu geo fix -49.2670 -16.7050` (GPS no endereço da Cleide).
6. Fazer um login de teste e sair, para "acordar" a API (defeito D08).
7. Deixar o app na tela de login, com a apresentação de slides aberta em outra janela.

## 3. Demonstração passo a passo (6 minutos)

**Hemily, tutora Cleide (3 min)** — `cleide@email.com`, senha `catlog2026`

1. Início: mostrar o alerta da Estrela, com a antirrábica vencida (RN04), e a próxima visita.
2. Gatos > Estrela > Carteira de saúde: mostrar as situações Vencido, A vencer e Em dia.
3. Registrar o peso de 3,5 kg: aparece o alerta de variação de 13,6% e o gráfico atualiza (RN07).
4. Cuidadores: trocar o filtro de distância e a ordenação.
5. Solicitar uma visita para daqui a 3 dias (RN02). Sair da conta.

**Gabriel, cuidador Felipe (3 min)** — `felipe@email.com`, senha `catlog2026`

1. Agenda: mostrar o resumo do mês e os filtros.
2. Abrir o pedido do Nino e aceitar (RN01): os dados do gato ficam liberados (RN08).
3. Abrir a visita de hoje > Fazer check-in (RN03).
4. Cortar a conexão: ligar o modo avião e, no terminal, `adb kill-server` e depois `adb start-server` (sem refazer o reverse). Só o modo avião não basta, porque a API chega pelo cabo virtual do adb.
5. Marcar as tarefas, tirar 1 foto e Concluir: aparece "Aguardando envio" (fila sem internet).
6. Religar: `adb reverse tcp:8080 tcp:8080` e desligar o modo avião. A agenda se atualiza sozinha e a visita fica Concluída.

**Se algo falhar:** não insistir. Voltar para os slides e narrar o fluxo pelo slide "Ciclo da visita". O aviso "System UI isn't responding" é do emulador: tocar em **Wait**.

## 4. Perguntas prováveis na arguição

Cada um deve conseguir abrir o código da própria parte e explicar.

| Pergunta | Quem responde | Resposta curta |
|----------|---------------|----------------|
| Por que API própria e não Firebase? | Sophia | Regras como conflito de horário (RN01) e distância do check-in (RN03) ficam num só lugar, com testes automáticos. O custo foi cuidar da hospedagem. |
| Como o check-in sabe a distância? | Sophia | O Nominatim transforma o endereço em coordenadas no cadastro. No check-in, a API calcula a distância pela fórmula de Haversine (`regras/Geo.java`) e aceita até 200 m. |
| Como é feito o conflito de horário? | Sophia | Cada visita aceita ocupa do início ao fim mais 30 minutos de deslocamento antes e depois; se o intervalo novo encosta em outro, o aceite é recusado (`regras/RegrasVisita.java`). |
| Como as senhas são guardadas? | Sophia | Com BCrypt (`seguranca/SegurancaConfig.java`). O login devolve um token JWT, guardado no celular com o expo-secure-store. |
| Como funciona sem internet? | Gabriel | Check-in e relatório vão para uma fila no SQLite (`servicos/filaServico.ts`). O NetInfo avisa quando a conexão volta; o app envia as fotos, depois o relatório, e o que falhar continua na fila. |
| Como o app sabe se vai para a API ou para o SQLite? | Gabriel | A camada de serviços decide: com conexão, chama a API e guarda uma cópia local; sem conexão, lê a cópia ou coloca a ação na fila. |
| O que acontece com os dados do gato no celular do cuidador depois da visita? | Gabriel | São apagados quando o acesso vence, 24 h depois da conclusão (RN08). |
| Quais recursos do celular vocês usam e onde? | Hemily | Câmera e galeria (foto do gato e do relatório), GPS (check-in) e notificações (lembretes e situação da visita), em `dados/dispositivo.ts` e `servicos/notificacaoServico.ts`. |
| O que vocês fizeram para acessibilidade? | Hemily | Botões com no mínimo 50 dp, rótulos para leitor de tela em todos os componentes, estados de carregamento, lista vazia e erro. O defeito D06 foi um texto errado no leitor de tela. |
| Qual foi o defeito mais grave? | Hemily | D01: o envio de fotos falhava porque o fetch do Expo 58 não aceita `{ uri }` no FormData. A foto passou a ir como `File` do expo-file-system. |
| Por que não testaram em celular físico? | Sophia | Responder com a decisão da equipe registrada no relatório (Seção 7). |
| Como vocês priorizaram o backlog? | Sophia | Essencial (necessário para os requisitos mínimos), Importante (previsto para a N2) e Desejável (se sobrasse tempo, como o RF20). |
