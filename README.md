[README.md](https://github.com/user-attachments/files/32391768/README.md)
# CatLog

Aplicativo móvel para acompanhamento da saúde de gatos domésticos e agendamento de visitas de cuidadores (cat sitters).

Projeto Integrador do Curso Superior de Tecnologia em Análise e Desenvolvimento de Sistemas da PUC Goiás, semestre 2026/2.

## Sobre o projeto

Quem tem gato e precisa viajar enfrenta dois problemas. O primeiro é lembrar das vacinas, dos vermífugos e dos remédios de uso contínuo, informações que costumam ficar espalhadas em carteirinhas de papel. O segundo é contratar alguém de confiança para visitar a casa, combinação que quase sempre acontece por mensagem, sem agenda organizada e sem nenhuma comprovação de que a visita aconteceu.

O CatLog reúne as duas coisas em um só aplicativo. O tutor cadastra seus gatos e os cuidados de saúde, recebe lembretes das próximas doses, busca cuidadores próximos e solicita visitas. O cuidador recebe a solicitação, organiza sua agenda, faz check-in com GPS ao chegar no endereço e registra um relatório com fotos, que o tutor acompanha mesmo estando longe.

O aplicativo é aberto a qualquer pessoa: basta criar uma conta gratuita e escolher se vai usá-lo como tutor ou como cuidador.

## Funcionalidades

**Perfil tutor**
- Cadastro, consulta, edição e exclusão de gatos, com foto
- Carteira de saúde com vacinas, vermífugos e remédios, indicando o que está vencido ou a vencer
- Registro de peso com gráfico de evolução e alerta de variação acima de 10%
- Busca de cuidadores por proximidade, com filtro de distância e ordenação
- Solicitação de visitas, escolhendo gatos, endereço, data, horário e instruções
- Acompanhamento das visitas e acesso aos relatórios recebidos

**Perfil cuidador**
- Agenda de visitas com filtros por situação e período
- Aceite ou recusa de solicitações, com bloqueio de conflitos de horário
- Check-in geolocalizado no endereço do tutor
- Relatório da visita com lista de tarefas, observações e fotos
- Registro do relatório sem internet, com envio automático quando a conexão volta

## Regras de negócio

| ID | Regra |
|----|-------|
| RN01 | Um cuidador não pode aceitar visitas com horários sobrepostos, considerando 30 minutos de deslocamento |
| RN02 | Visitas exigem 12 horas de antecedência e só podem ser canceladas até 6 horas antes do início |
| RN03 | O check-in só é aceito a até 200 metros do endereço e dentro da janela de horário da visita |
| RN04 | Cuidados de saúde vencidos ou a vencer em até 7 dias geram alerta e lembrete ao tutor |
| RN05 | A visita só é concluída com a lista de tarefas preenchida e ao menos 1 foto anexada |
| RN06 | A visita segue uma ordem definida de situações, e pedidos sem resposta expiram automaticamente |
| RN07 | O peso deve ficar entre 0,5 e 15 kg, e variações acima de 10% geram alerta |
| RN08 | O cuidador só acessa os dados dos gatos durante a vigência da visita |

## Tecnologias

**Aplicativo**
- React Native com Expo e TypeScript
- React Navigation
- SQLite (expo-sqlite) para funcionamento sem internet
- Câmera, geolocalização e notificações do dispositivo

**API**
- Java 21 com Spring Boot
- Spring Security com autenticação JWT
- PostgreSQL com migrações versionadas pelo Flyway

**Serviços externos**
- ViaCEP para preenchimento de endereço
- Nominatim (OpenStreetMap) para obter as coordenadas do endereço
- Cloudinary para armazenamento das fotos

## Estrutura do repositório

```
catlog/
├── mobile/     aplicativo React Native
├── backend/    API Spring Boot
└── README.md
```

## Como executar

Pré-requisitos: Node.js 20 ou superior, JDK 21 ou superior e Android Studio com um emulador ou celular Android 10 ou superior.

**API**

```bash
cd backend
cp .env.example .env     # defina JWT_SEGREDO
./mvnw spring-boot:run   # no Windows: mvnw.cmd spring-boot:run
```

A API sobe em `http://localhost:8080`. Com o perfil `dev`, já definido no `.env.example`, ela usa um PostgreSQL embutido e cria dados de teste, sem instalar nada. Esses dados recomeçam a cada inicialização. Para usar um PostgreSQL 16 próprio, apague a linha `spring.profiles.active=dev` e preencha `DB_URL`, `DB_USUARIO` e `DB_SENHA`.

Testes automatizados da API: `./mvnw test`.

**Aplicativo no Android Studio**

```bash
cd mobile
npm install
cp .env.example .env     # informe o endereço da API
npx expo prebuild --platform android
npx expo start           # deixe rodando
```

No Android Studio, use **File > Open**, escolha a pasta `mobile/android`, espere a sincronização do Gradle, selecione o emulador e clique em **Run**. A pasta `android` é gerada pelo comando `prebuild` e não vai para o Git.

Se preferir não abrir o Android Studio, `npx expo run:android` compila e abre o aplicativo no emulador.

**APK para instalar no celular**

```bash
cd mobile/android
./gradlew assembleRelease   # no Windows: gradlew.bat assembleRelease
```

O arquivo fica em `mobile/android/app/build/outputs/apk/release/app-release.apk`. O endereço da API é gravado no APK durante a compilação, a partir do `EXPO_PUBLIC_API_URL` do `.env`:

- celular no mesmo Wi-Fi do computador: `http://IP_DO_COMPUTADOR:8080` (o IP aparece com `ipconfig`)
- celular ligado por cabo: `http://127.0.0.1:8080`, depois de rodar `adb reverse tcp:8080 tcp:8080`

Se o Android perguntar se o CatLog pode acessar dispositivos da rede local, permita: é assim que o aplicativo fala com a API no computador.

**Credenciais de teste**

Criadas somente no perfil `dev`. A senha é o valor de `CATLOG_SENHA_TESTE` no `.env`, por padrão `catlog2026`.

| Perfil | E-mail |
|--------|--------|
| Tutor | cleide@email.com |
| Cuidador | felipe@email.com |

Para testar o check-in no emulador, a visita de demonstração começa 5 minutos depois de a API subir. Coloque o GPS no endereço dela com `adb emu geo fix -49.2670 -16.7050`.

## Protótipo navegável

O protótipo das telas do tutor é o arquivo `PI2026-2_Catlog_Prototipo.html`, na raiz do repositório. Abra no navegador, sem necessidade de instalar nada.

## Documentação

- Documento de projeto (etapa N1): `PI2026-2_Catlog_Documentação.pdf`
- Backlog priorizado e verificação de escopo: `PI2026-2_Catlog_Checkpoint1.xlsx`
- Roteiro de testes funcionais e defeitos encontrados: `docs/roteiro-de-testes.md`

## Equipe

| Integrante | Atribuição |
|------------|------------|
| Gabriel Brito Falcão | Repositório, aplicativo móvel e sincronização offline |
| Hemily B. Ramos de Jesus | Interface, acessibilidade, recursos do dispositivo e testes |
| Sophia Eduarda Lima | Coordenação, API, regras de negócio e documentação |

## Situação do projeto

Em desenvolvimento. Concepção concluída, implementação em andamento no Ciclo 1.

## Licença

Projeto acadêmico, desenvolvido para fins de avaliação na PUC Goiás.
