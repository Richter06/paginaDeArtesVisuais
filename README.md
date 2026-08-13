# 🎨 Little Bee — Arte & Pintura

> Portfólio artístico e galeria virtual desenvolvida para apresentar as obras da artista visual **Emily Calixto (Little Bee)**.

O projeto combina uma experiência visual inspirada em um atelier artístico com um sistema completo de gerenciamento de obras, permitindo cadastrar, editar e excluir pinturas por meio de uma área administrativa protegida por autenticação.

---

## 📸 Preview

<!--
ADICIONE AQUI AS IMAGENS DO PROJETO.
Sugestão de organização:
- docs/screenshots/home.png
- docs/screenshots/gallery.png
- docs/screenshots/login.png
- docs/screenshots/admin.png

Exemplo:
<img src="docs/screenshots/home.png" alt="Página inicial" width="800">
-->

### Página inicial

**[ Espaço para screenshot da página inicial ]**

### Galeria de obras

**[ Espaço para screenshot da galeria ]**

### Área administrativa

**[ Espaço para screenshot do painel administrativo ]**

### Tela de login

**[ Espaço para screenshot da tela de login ]**

---

## ✨ Sobre o projeto

O **Little Bee — Arte & Pintura** foi criado com foco em três objetivos principais:

- apresentar a identidade artística da artista de forma elegante e responsiva;
- disponibilizar uma galeria dinâmica de obras;
- permitir que a própria artista gerencie seu acervo sem precisar alterar o código do site.

A página pública apresenta a artista, sua proposta, processo criativo, galeria e uma área destinada a encomendas personalizadas.

As obras são carregadas dinamicamente através da API da aplicação e armazenadas utilizando o Supabase.

---

## 🚀 Funcionalidades

### 🌐 Página pública

- Apresentação da artista
- Seção sobre a artista
- Galeria dinâmica de obras
- Informações sobre o processo criativo
- Área para encomendas personalizadas
- Visualização ampliada das obras em modal
- Animações de entrada utilizando `IntersectionObserver`
- Layout responsivo
- Identidade visual personalizada

### 🔐 Área administrativa

- Login protegido por sessão
- Proteção da rota administrativa
- Cadastro de novas pinturas
- Upload de imagens
- Preview da imagem selecionada
- Edição de obras existentes
- Exclusão de obras
- Atualização automática do acervo

### 🛡️ Segurança e boas práticas

- Variáveis sensíveis armazenadas em `.env`
- `.env` excluído do controle de versão
- Sessões com cookie `httpOnly`
- `sameSite: strict` para o cookie de sessão
- Regeneração da sessão após login
- Rate limiting no endpoint de login
- Helmet para headers de segurança
- Proteção das rotas de criação, edição e exclusão
- Limite de 5 MB para uploads
- Restrição de uploads para JPEG, PNG e WebP
- Renderização de títulos e técnicas usando `textContent`, evitando interpretação de HTML fornecido pelo usuário

---

## 🧰 Tecnologias utilizadas

### Front-end

- HTML5
- CSS3
- JavaScript (Vanilla JS)
- Google Fonts
- Intersection Observer API

### Back-end

- Node.js
- Express
- Multer
- Express Session
- Express Rate Limit
- Helmet
- dotenv

### Banco de dados e armazenamento

- Supabase
- Supabase Database
- Supabase Storage

### Desenvolvimento

- Git
- GitHub
- npm

---

## 🏗️ Arquitetura

```text
Usuário
   │
   ▼
Página pública ────────► GET /api/pinturas
                              │
                              ▼
                         Express API
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
               Supabase DB        Supabase Storage
                    │                   │
                    └─────────┬─────────┘
                              ▼
                         Galeria

Administrador
   │
   ▼
/login.html
   │
   │ POST /login
   ▼
Sessão autenticada
   │
   ▼
/admin.html
   │
   ├── POST   /api/pinturas
   ├── PUT    /api/pinturas/:id
   └── DELETE /api/pinturas/:id
```

---

## 📁 Estrutura do projeto

```text
paginaDeArtesVisuais/
│
├── database/
│   └── database.js          # Operações sobre as pinturas
│
├── public/
│   ├── img/
│   │   └── lb.jpeg          # Foto da artista / asset estático
│   │
│   ├── admin.html            # Painel administrativo
│   ├── admin.js              # Lógica do painel
│   ├── index.html            # Página pública
│   ├── login.html            # Tela de autenticação
│   ├── login.js              # Lógica do login
│   ├── script.js             # Galeria e interações públicas
│   └── styles.css            # Estilos do projeto
│
├── supabase/
│   └── supabase.js           # Cliente Supabase
│
├── .gitignore
├── package.json
├── package-lock.json
├── server.js                 # API e servidor Express
└── README.md
```

---

## ⚙️ Como executar localmente

### 1. Clone o repositório

```bash
git clone https://github.com/Richter06/paginaDeArtesVisuais.git
cd paginaDeArtesVisuais
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
SENHA_ADMIN=sua_senha_aqui
SESSION_SECRET=seu_segredo_de_sessao_aqui
SUPABASE_URL=sua_url_do_supabase
SUPABASE_ANON_KEY=sua_chave_anon_do_supabase
```

> **Nunca publique o arquivo `.env` no GitHub.**

### 4. Inicie o servidor

```bash
npm start
```

O servidor será iniciado em:

```text
http://localhost:3000
```

A página pública estará disponível em:

```text
http://localhost:3000
```

A área administrativa utiliza:

```text
http://localhost:3000/login.html
```

---

## 🗄️ Dados das obras

As pinturas são armazenadas em uma tabela do Supabase com informações como:

```text
id
 titulo
 tecnica
 imagem
```

As imagens são armazenadas no **Supabase Storage**, enquanto a URL pública da imagem é registrada junto aos dados da obra.

Quando uma obra é editada com uma nova imagem, a aplicação envia a nova imagem para o Storage e remove a imagem anterior.

Quando uma obra é excluída, a aplicação também tenta remover sua imagem correspondente do Storage.

---

## 🔒 Fluxo de autenticação

O acesso administrativo utiliza sessão no servidor.

```text
Senha
  │
  ▼
POST /login
  │
  ├── senha incorreta → 401
  │
  └── senha correta
          │
          ▼
    nova sessão criada
          │
          ▼
      /admin.html
```

O endpoint de login possui limitação de tentativas para reduzir tentativas automatizadas de acesso.

---

## 🎯 Decisões de desenvolvimento

O projeto foi desenvolvido priorizando simplicidade, manutenção e adequação ao seu contexto de uso.

Em vez de utilizar um framework de front-end, a interface pública utiliza **JavaScript puro**, mantendo o projeto leve e permitindo trabalhar diretamente com APIs nativas do navegador e manipulação do DOM.

No back-end, o **Express** concentra as rotas da aplicação, autenticação, upload e comunicação com o Supabase.

A separação entre código da aplicação e imagens das obras também permite que o GitHub mantenha o código-fonte enquanto o conteúdo dinâmico do acervo permanece no armazenamento do Supabase.

---

## 🔮 Possíveis melhorias futuras

Estas funcionalidades não são necessárias para o funcionamento atual, mas podem ser adicionadas conforme o projeto evoluir:

- compressão automática de imagens;
- validação do conteúdo real dos arquivos enviados;
- geração de thumbnails;
- melhorias de tratamento de erros no front-end;
- paginação da galeria para acervos maiores;
- sistema de categorias ou filtros;
- múltiplos administradores;
- formulário de contato integrado;
- domínio personalizado;
- melhorias adicionais de acessibilidade e SEO.

---

## 👨‍💻 Desenvolvimento

Projeto desenvolvido como uma aplicação web real para apresentação e gerenciamento de um portfólio artístico.

O projeto também serve como estudo prático de:

- desenvolvimento web full-stack;
- criação de APIs REST;
- autenticação baseada em sessão;
- manipulação do DOM;
- upload e armazenamento de arquivos;
- integração com serviços externos;
- segurança básica de aplicações web;
- Git e GitHub.

---

## 📄 Licença

Este projeto foi desenvolvido para uso pessoal e apresentação do trabalho artístico de Emily Calixto.

Caso o projeto seja disponibilizado publicamente, defina aqui a licença desejada de acordo com a forma como o código e os conteúdos artísticos poderão ser utilizados.
