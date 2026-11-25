<div align="center">

# REMEDAPP

### `Gratuito` · `Privado` · `Offline`

[![App](https://img.shields.io/badge/app-abrir_ReMed-0D9488?style=for-the-badge)](https://remedapp.github.io/app/)
[![Site](https://img.shields.io/badge/site-oficial-1D4ED8?style=for-the-badge)](https://remedapp.github.io/)
[![Repositório](https://img.shields.io/badge/c%C3%B3digo-fonte-181717?style=for-the-badge&logo=github)](https://github.com/remedapp/remedapp.github.io)
[![Apoie](https://img.shields.io/badge/apoie-o_projeto-009EE3?style=for-the-badge&logo=mercadopago&logoColor=white)](https://link.mercadopago.com.br/saulomgg)

</div>

---

## `> whoami`

```bash
$ cat /dev/remedapp
Nome:   ReMed · organização de cuidados e tratamento
Foco:   remédios · horários · estoque · saúde · rotina
Modo:   PWA instalável · armazenamento local · offline
Conta:  não exige cadastro
Custo:  gratuito · sem anúncios · sem mensalidade
```

O **ReMed** ajuda a organizar medicamentos, horários, estoque e registros de saúde em um só lugar. Também permite preparar pedidos para farmácias pelo WhatsApp, acompanhar sinais e hidratação e manter uma ficha de emergência.

O app funciona offline depois do primeiro acesso e salva as informações no navegador do aparelho. Você pode experimentar com dados de exemplo ou apagá-los antes de cadastrar seus próprios dados.

---

## `> ls ./recursos`

| Recurso | O que você encontra |
| --- | --- |
| ⏰ **Horários e remédios** | Rotina diária de doses, registro de doses tomadas, lembretes, consultas e exames |
| 📦 **Estoque** | Previsão de quantos dias restam, alertas de reposição e atualização do estoque ao marcar uma dose como tomada |
| 💧 **Sinais e hidratação** | Meta de ingestão de água e registros de pressão arterial, glicemia, temperatura, frequência cardíaca, saturação e peso |
| 📓 **Anotações médicas** | Registros de consultas, exames, receitas, sintomas e orientações, com busca e opção de imprimir ou salvar em PDF |
| 💬 **Farmácias e pedidos** | Farmácias favoritas e mensagem editável com os itens escolhidos, pronta para revisar e enviar pelo WhatsApp |
| 📅 **Google Agenda** | Integração opcional para levar horários de medicamentos e compromissos à agenda, com lembretes no celular ou por e-mail |
| 🆘 **Ficha de saúde e SOS** | Tipo sanguíneo, alergias, medicamentos contraindicados, condições de saúde e contatos de emergência |
| 🩺 **Resumo para consulta** | Resumo dos dados, medicamentos em uso, últimas medições e anotações recentes; opção de copiar, imprimir ou salvar em PDF |
| 💾 **Backup** | Exportação e restauração dos dados em arquivo JSON |
| 📲 **Instalação** | PWA para adicionar à tela inicial do celular ou computador |

---

## `> cat ./privacidade`

```json
{
  "cadastro": false,
  "anuncios": false,
  "armazenamento_principal": "local no navegador do dispositivo",
  "funciona_offline": "depois do primeiro acesso",
  "backup": "arquivo JSON",
  "google_agenda": "opcional, configurada pelo usuário",
  "pedido_farmacia": "abre o WhatsApp após revisão do texto"
}
```

- **Sem cadastro:** abra o app e use. O perfil de saúde é preenchido localmente, e os dados não são enviados para servidores do ReMed.

- **Dados no aparelho:** medicamentos, anotações e informações de saúde ficam no armazenamento local do navegador. Limpar os dados do site ou trocar de aparelho pode removê-los ou deixá-los indisponíveis.

- **Backup sob seu controle:** exporte um arquivo JSON e restaure os dados quando necessário. Guarde o arquivo em local seguro, pois ele pode conter informações pessoais e de saúde.

- **Integrações opcionais:** WhatsApp e Google Agenda precisam de internet. A conexão com a agenda usa a conta Google do usuário e um Google Apps Script configurado pelo próprio usuário.

- **Revise antes de compartilhar:** confira a mensagem com medicamentos e dados de entrega antes de enviá-la à farmácia pelo WhatsApp.

> [!IMPORTANT]
Os alertas do app funcionam enquanto ele está aberto ou em segundo plano, conforme os recursos do navegador. Para receber alarmes com o app fechado, configure os horários na Google Agenda. Verifique se os eventos foram criados corretamente.

> [!WARNING]
O ReMed é uma ferramenta de organização. Não substitui orientação médica, receita, acompanhamento profissional nem serviços de emergência. Siga as orientações do seu médico ou farmacêutico.

---

## `> ./iniciar`

```bash
1. Acesse   remedapp.github.io/app
2. Explore  veja os exemplos ou apague o autopreenchimento
3. Cadastre seus medicamentos, horários e estoque conforme a orientação recebida
4. Ative    configure notificações ou conecte opcionalmente a Google Agenda
5. Proteja  exporte um backup JSON e guarde-o em local seguro
```

[▶ **Abrir o ReMed grátis**](https://remedapp.github.io/app/)

---

## `> ping apoio`

O ReMed é gratuito e independente. Se o app ajudar a organizar sua rotina, você pode apoiar voluntariamente o projeto. O apoio não libera recursos pagos nem altera a privacidade do app.

[![Apoie pelo Mercado Pago](https://img.shields.io/badge/%F0%9F%92%9B_Apoie_pelo_Mercado_Pago-009EE3?style=for-the-badge&logo=mercadopago&logoColor=white)](https://link.mercadopago.com.br/saulomgg)

---

## `> ping links`

| Canal | Link |
| --- | --- |
| ReMed · App | [remedapp.github.io/app](https://remedapp.github.io/app/) |
| Site oficial | [remedapp.github.io](https://remedapp.github.io/) |
| Repositório | [github.com/remedapp/remedapp.github.io](https://github.com/remedapp/remedapp.github.io) |
| Apoio · Mercado Pago | [link.mercadopago.com.br/saulomgg](https://link.mercadopago.com.br/saulomgg) |
| Criador | [saulomgg.github.io](https://saulomgg.github.io/) |

---

## `> cat ./LICENSE`

Consulte o arquivo [`LICENSE`](./LICENSE) para os termos de uso e direitos autorais. O uso do aplicativo é gratuito; a licença não autoriza comercializar ou redistribuir o código, o projeto ou cópias dele sem permissão por escrito.

---

<div align="center">

Desenvolvido por [**Saulo (saulomgg)**](https://saulomgg.github.io/) · organização simples para cuidar da sua rotina

```
┌─────────────────────────────────────────────┐
│  [ SYSTEM ]  ReMed · horários e cuidados    │
│  [ STATUS ]  Gratuito · privado · offline   │
│  [ DATA   ]  No seu aparelho · backup JSON  │
│  [ ALERTA ]  Google Agenda opcional         │
│  [ HEALTH ]  Não substitui orientação médica│
└─────────────────────────────────────────────┘
```

</div>
