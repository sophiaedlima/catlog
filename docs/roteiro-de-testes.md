# Roteiro de testes funcionais

Execução de 04/11/2026, feita com apoio de IA (Claude Code), que digitou e tocou na tela por comandos do Android. A equipe deve repetir o roteiro por conta própria antes da N2, e o resultado desta execução precisa constar na declaração de uso de IA do relatório final.

**Ambiente:** APK release no emulador Pixel 8 (Android 17), API no perfil `dev` com os dados de teste, ligada ao emulador por `adb reverse`. Senha das contas de teste: valor de `CATLOG_SENHA_TESTE`.

**Ainda não testado:** celular físico (R14), escolha de foto da galeria, cadastro de conta pela tela, edição e exclusão de cuidados de saúde pela tela, Cloudinary, sessões de usabilidade com 5 usuários externos.

## Aplicativo

| ID | Perfil | Passos | Resultado esperado | Resultado obtido |
|----|--------|--------|--------------------|------------------|
| CT01 | Tutor | Entrar com a senha errada | Mensagem de erro, continua na tela de login | Conforme esperado |
| CT02 | Tutor | Entrar com cleide@email.com | Abre o Início com alertas de saúde, próxima visita e visita anterior | Conforme esperado |
| CT03 | Tutor | Gatos > Cadastrar gato > Salvar sem nome | Mensagem "Informe o nome do gato." | Conforme esperado |
| CT04 | Tutor | Cadastrar gato com foto tirada pela câmera | Pede permissão da câmera, salva e mostra o gato na lista com a foto | Falhou na 1ª execução (D01), conforme esperado após a correção |
| CT05 | Tutor | Excluir gato | Pede confirmação e remove da lista | Conforme esperado |
| CT06 | Tutor | Perfil do gato > Carteira de saúde | Itens com situação Vencido, A vencer e Em dia | Conforme esperado |
| CT07 | Tutor | Carteira > Peso > registrar 3,5 kg (anterior 4,05 kg) | Alerta de variação de 13,6% (RN07) e gráfico atualizado | Conforme esperado |
| CT08 | Tutor | Perfil > Adicionar endereço > CEP 74230-010 | Rua, bairro e cidade preenchidos pelo ViaCEP; endereço salvo | Conforme esperado |
| CT09 | Tutor | Cuidadores > filtros de distância e ordem por nome | Lista muda conforme o filtro e a ordem | Conforme esperado |
| CT10 | Tutor | Solicitar visita para Hemily, gato Frida, 60 min | Visita criada com situação Solicitada | Conforme esperado |
| CT11 | Tutor | Cancelar visita sem motivo e depois com motivo | Sem motivo: mensagem de erro. Com motivo: situação Cancelada e motivo exibido | Conforme esperado |
| CT12 | Cuidador | Entrar com felipe@email.com | Agenda com resumo do mês, filtros e visitas | Conforme esperado |
| CT13 | Cuidador | Abrir pedido e aceitar | Situação Confirmada e dados de saúde do gato liberados (RN08) | Conforme esperado |
| CT14 | Cuidador | Iniciar visita > Fazer check-in no endereço (GPS simulado) | Pede permissão de localização; situação Em andamento (RN03) | Conforme esperado |
| CT15 | Cuidador | Lista de tarefas e foto pendentes | Botão Concluir bloqueado, com a lista do que falta (RN05) | Conforme esperado |
| CT16 | Cuidador | Concluir visita com tarefas e 1 foto | Relatório enviado e visita Concluída | Falhou na 1ª execução (D01): relatório ficou na fila e foi enviado sozinho depois da correção |
| CT17 | Cuidador | Modo avião e navegar pela agenda e pelo perfil | Aviso de sem conexão e últimos dados salvos | Conforme esperado |
| CT18 | Tutor | Abrir a visita concluída | Relatório com tarefas, observação e foto | Conforme esperado |
| CT19 | Tutor | Aceite, check-in e conclusão feitos pelo cuidador | Notificações no celular do tutor | Conforme esperado |

## API

Roteiro automatizado de 61 verificações pela rede, cobrindo contas, endereços com Nominatim, gatos, fotos, saúde, peso, busca de cuidadores, visitas e as regras RN01 a RN08: 61 de 61 conforme esperado. Os testes automáticos do projeto (`./mvnw test`) passaram: 13 de 13.

## Defeitos encontrados

| ID | Severidade | Descrição | Situação |
|----|------------|-----------|----------|
| D01 | Alta | Envio de fotos falhava com "Sem conexão com o servidor": o fetch do Expo 58 não aceita o formato `{ uri }` no FormData | Corrigido: o arquivo vai como `File` do expo-file-system |
| D02 | Média | Depois de enviar a fila sem internet, a tela continuava com os dados antigos até puxar para atualizar | Corrigido, falta retestar no app: as telas recarregam quando a fila diminui |
| D03 | Baixa | Início do tutor dizia "1 visita marcada" mesmo com mais visitas | Corrigido, falta retestar no app |
| D04 | Baixa | Aviso de conexão dizia "últimos dados salvos" até na tela de login | Corrigido: texto neutro |
| D05 | Baixa | Telefone sem máscara no detalhe da visita | Corrigido |
| D06 | Baixa | Leitor de tela lia "1 visitas concluídas" na agenda do cuidador | Corrigido |
| D07 | Baixa | Texto de apresentação desalinhado na tela de login | Corrigido, falta conferir na tela |
| D08 | Baixa | A primeira requisição depois de a API ligar pode passar de 15 segundos no emulador e mostrar "sem conexão" | Sem correção: ocorre só com a API recém-iniciada; tentar de novo resolve |
