# ReMed

Site e aplicativo para organizar medicamentos, estoques, farmácias, pedidos via WhatsApp, ficha médica e agenda de doses.

O app mantém no aparelho a ficha médica (tipo sanguíneo, alergias, condições, orientações médicas e contato de emergência), permite registrar o que o médico orientou em cada medicamento e exporta os horários para um arquivo `.ics` compatível com calendários de celular e computador.

## Publicar no GitHub Pages

1. Crie ou abra um repositório no GitHub.
2. Extraia o conteúdo deste ZIP e envie os arquivos para a raiz do repositório.
3. Acesse **Settings > Pages**.
4. Em **Build and deployment**, selecione **Deploy from a branch**.
5. Escolha a branch `main` e a pasta `/ (root)`.
6. Salve e aguarde o endereço do site.

A apresentação abre na raiz e o aplicativo fica em `/app/`. Os dados do aplicativo permanecem no navegador do usuário, sem cadastro e sem servidor.

O ReMed é uma ferramenta de organização e não substitui orientação médica, receita ou acompanhamento profissional.

O apoio voluntário usa o Mercado Pago: https://link.mercadopago.com.br/saulomgg

## Atualização do app

A pasta `/app/` é gerada a partir do projeto React em `/app-source/`. O aplicativo novo possui agenda, anotações médicas, medições, ficha de saúde, apoio voluntário e armazenamento local. O service worker e o manifesto permitem continuar usando o app sem internet depois do primeiro acesso; sincronização opcional com Google Apps Script, links externos e WhatsApp dependem de conexão.
