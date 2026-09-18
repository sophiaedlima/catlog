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
├── docs/       documentação, diagramas e protótipo navegável
└── README.md
```

## Como executar

Pré-requisitos: Node.js 20 ou superior, JDK 21, PostgreSQL 16 e o aplicativo Expo Go no celular.

**API**

```bash
cd backend
cp .env.example .env     # preencha as variáveis de ambiente
./mvnw spring-boot:run
```

A API sobe em `http://localhost:8080`.

**Aplicativo**

```bash
cd mobile
npm install
cp .env.example .env     # informe o endereço da API
npx expo start
```

Leia o QR Code com o Expo Go ou use um emulador Android.

**Credenciais de teste**

| Perfil | E-mail | Senha |
|--------|--------|-------|
| Tutor | (a definir) | (a definir) |
| Cuidador | (a definir) | (a definir) |

## Protótipo navegável

O protótipo das telas do tutor está em `docs/prototipo/`. Abra o arquivo HTML no navegador, sem necessidade de instalar nada.

## Documentação

- Documento de projeto (etapa N1): `docs/`
- Diagramas de modelagem e arquitetura: `docs/diagramas/`
- Backlog priorizado e verificação de escopo: `docs/`

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
