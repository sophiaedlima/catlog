# Roteiro das sessões de usabilidade

Atende à Seção 6.3 do documento norteador: sessões com no mínimo **5 usuários de fora da equipe**, do perfil definido para o aplicativo. Os resultados entram no relatório final (Apêndice A.2, "Síntese das sessões de usabilidade e dos ajustes decorrentes").

## 1. Quem convidar

| Participante | Perfil no app | Quem é | Por quê |
|--------------|---------------|---------|---------|
| P1 | Tutor | Pessoa que tem gato e viaja ou passa o dia fora | Persona Mariana |
| P2 | Tutor | Pessoa com 55 anos ou mais, pouco acostumada com celular | Persona Antônio, testa letras, botões e textos |
| P3 | Tutor | Qualquer tutor de gato | Mais uma visão do fluxo principal |
| P4 | Cuidador | Quem já cuidou de animais de outras pessoas ou estuda Veterinária | Persona Rafael |
| P5 | Cuidador | Qualquer pessoa disposta a fazer o papel de cuidador | Mais uma visão do fluxo do cuidador |

Ninguém da equipe pode ser participante. Familiares e colegas de outros cursos valem, desde que tenham o perfil.

## 2. Papéis na sessão

- **Moderador:** lê as tarefas e não ajuda, a não ser que a pessoa fique travada por mais de 2 minutos ou peça para desistir.
- **Anotador:** marca o tempo, o resultado de cada tarefa e o que a pessoa falou, na ficha da Seção 6.

Uma pessoa sozinha pode fazer as duas coisas, mas fica mais fácil com duas.

## 3. Preparação (antes de cada sessão)

1. Ligar a API (`backend`): conferir antes se não sobrou `java.exe` antigo na porta 8080. **Ligar a API de novo antes de cada participante**: ela recria os dados de teste, então todo mundo começa do mesmo ponto.
2. Abrir o emulador e instalar o APK release. Rodar `adb reverse tcp:8080 tcp:8080`.
3. Colocar o GPS no endereço da Cleide: `adb emu geo fix -49.2670 -16.7050`.
4. Deixar o aplicativo na tela de login, sem conta conectada.
5. Ter uma foto de gato na galeria do emulador (para a tarefa de cadastrar gato).
6. Imprimir ou abrir a ficha de registro (Seção 6) e o questionário SUS (Seção 7).

**Atenção ao horário:** a visita de demonstração começa 5 minutos depois de a API ligar, e o check-in só funciona de 15 minutos antes até 30 minutos depois do início (RN03). Na sessão de cuidador, faça as tarefas C3 e C4 em até 30 minutos depois de ligar a API.

Se possível, use um celular de verdade em vez do emulador: tocar com o dedo mostra problemas que o mouse esconde, como botões pequenos.

## 4. Texto de abertura (ler para o participante)

> Obrigada por participar. Estamos testando o aplicativo, não você: se algo der errado, é um problema do aplicativo, e é exatamente isso que queremos descobrir. Vou pedir algumas tarefas. Tente fazer sozinho e, se puder, vá falando em voz alta o que está pensando. Não vamos gravar seu rosto nem guardar seus dados pessoais; anotamos só o que acontece no aplicativo. A sessão leva uns 20 minutos e você pode parar quando quiser. Tudo bem para você?

Anote na ficha que a pessoa concordou (termo de consentimento verbal, conforme a LGPD).

## 5. Tarefas

Leia uma tarefa por vez. Não diga o nome dos botões nem onde fica cada coisa.

### Participantes tutores (P1, P2 e P3)

| Tarefa | O que dizer | Termina quando | Requisito ou regra |
|--------|-------------|----------------|--------------------|
| T1 | "Crie uma conta para você como tutor." (pode usar um e-mail inventado) | Aparece a tela inicial do tutor | RF01, RF02 |
| T2 | "Saia da sua conta e entre como Cleide." (dar e-mail e senha num papel) | Aparece o início da Cleide | RF02 |
| T3 | "Algum gato da Cleide está com vacina atrasada? Qual?" | Responde "Estrela, antirrábica" | RN04, RF09 |
| T4 | "A Cleide adotou um gato. Cadastre ele com uma foto." | O gato aparece na lista com a foto | RF04, câmera ou galeria |
| T5 | "A Estrela foi pesada hoje e está com 3,5 kg. Registre isso." | O peso aparece no gráfico | RF07, RN07 |
| T6 | "A Cleide vai viajar. Peça uma visita do cuidador mais perto dela para daqui a 3 dias." | A visita aparece como Solicitada | RF10, RF11, RN02 |
| T7 | "A viagem foi cancelada. Cancele essa visita." | A visita aparece como Cancelada | RF14 |

### Participantes cuidadores (P4 e P5)

| Tarefa | O que dizer | Termina quando | Requisito ou regra |
|--------|-------------|----------------|--------------------|
| C1 | "Entre como Felipe." (dar e-mail e senha num papel) | Aparece a agenda | RF02 |
| C2 | "Quantas visitas o Felipe tem neste mês?" | Responde o número certo | RF18 |
| C3 | "Chegou um pedido novo de visita. Aceite." | O pedido aparece como Confirmado | RF12, RN01 |
| C4 | "Você chegou na casa da Cleide. Comece a visita." | A visita fica Em andamento | RF15, RN03 |
| C5 | "Qual remédio a Estrela toma e em que horário?" | Responde "Metimazol, às 8h" | RN08 |
| C6 | "Faça o que foi pedido, tire uma foto dos gatos e termine a visita." | A visita aparece como Concluída | RF16, RN05 |

Depois de cada tarefa, pergunte: **"De 1 a 7, quanto foi fácil fazer isso?"** (1 = muito difícil, 7 = muito fácil). Anote na coluna "Nota".

## 6. Ficha de registro (uma por participante)

Participante: ____ Perfil: ____ Idade: ____ Usa celular todo dia? ( ) sim ( ) não
Data: ____/____/2026 Moderador: __________ Anotador: __________ Consentiu: ( ) sim

| Tarefa | Resultado | Tempo | Erros | Nota (1 a 7) | O que a pessoa fez ou falou |
|--------|-----------|-------|-------|--------------|-----------------------------|
| | ( ) sozinho ( ) com ajuda ( ) não conseguiu | | | | |
| | ( ) sozinho ( ) com ajuda ( ) não conseguiu | | | | |
| | ( ) sozinho ( ) com ajuda ( ) não conseguiu | | | | |
| | ( ) sozinho ( ) com ajuda ( ) não conseguiu | | | | |
| | ( ) sozinho ( ) com ajuda ( ) não conseguiu | | | | |
| | ( ) sozinho ( ) com ajuda ( ) não conseguiu | | | | |
| | ( ) sozinho ( ) com ajuda ( ) não conseguiu | | | | |

**Erros** = vezes que a pessoa tocou no lugar errado ou voltou de tela sem querer.

Perguntas finais:
1. O que você achou mais fácil?
2. O que foi mais confuso?
3. Você usaria esse aplicativo? Por quê?

## 7. Questionário SUS (ao final da sessão)

A pessoa marca de 1 (discordo totalmente) a 5 (concordo totalmente):

| Nº | Afirmação | Nota |
|----|-----------|------|
| 1 | Eu acho que gostaria de usar este aplicativo com frequência. | |
| 2 | Achei o aplicativo mais complicado do que precisava ser. | |
| 3 | Achei o aplicativo fácil de usar. | |
| 4 | Acho que precisaria de ajuda de alguém para conseguir usar este aplicativo. | |
| 5 | Achei que as funções do aplicativo estão bem integradas. | |
| 6 | Achei que o aplicativo tem muita coisa sem sentido ou incoerente. | |
| 7 | Imagino que a maioria das pessoas aprenderia a usar este aplicativo rapidamente. | |
| 8 | Achei o aplicativo muito trabalhoso de usar. | |
| 9 | Me senti confiante usando o aplicativo. | |
| 10 | Precisei aprender muitas coisas antes de conseguir usar este aplicativo. | |

**Como calcular a nota (0 a 100):** nas afirmações ímpares (1, 3, 5, 7, 9), faça nota − 1. Nas pares (2, 4, 6, 8, 10), faça 5 − nota. Some tudo e multiplique por 2,5. Acima de 68 é considerado bom.

## 8. Depois das sessões

1. Para cada problema visto, registre um defeito na tabela "Defeitos encontrados" de `docs/roteiro-de-testes.md`, continuando a numeração (D09, D10...), com severidade:
   - **Alta:** a pessoa não conseguiu terminar a tarefa.
   - **Média:** terminou, mas com ajuda ou com muita dificuldade.
   - **Baixa:** detalhe de texto, cor ou posição que incomodou.
2. Indique a heurística de Nielsen ligada a cada problema (por exemplo: "visibilidade do estado do sistema", "correspondência com o mundo real").
3. Corrija os de severidade alta e média até o congelamento de escopo (27/11) ou escreva por que não serão corrigidos.
4. Preencha a tabela de síntese abaixo e copie para o relatório final.

### Síntese

| Tarefa | Conseguiram sozinhos | Tempo médio | Nota média (1 a 7) | Principais problemas |
|--------|----------------------|-------------|--------------------|----------------------|
| T1 | / 3 | | | |
| T2 | / 3 | | | |
| T3 | / 3 | | | |
| T4 | / 3 | | | |
| T5 | / 3 | | | |
| T6 | / 3 | | | |
| T7 | / 3 | | | |
| C1 | / 2 | | | |
| C2 | / 2 | | | |
| C3 | / 2 | | | |
| C4 | / 2 | | | |
| C5 | / 2 | | | |
| C6 | / 2 | | | |

Nota SUS: P1 ___ P2 ___ P3 ___ P4 ___ P5 ___ Média ___
