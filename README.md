# 🎬 API Filmes

Projeto full-stack para busca e visualização de filmes usando a API do TMDB (The Movie Database).

## 📋 Tecnologias

### Backend
- Node.js + Express
- TypeScript
- Axios
- TMDB API

### Frontend
- Next.js 15
- React 19
- TypeScript
- Tailwind CSS

## 🚀 Como rodar o projeto

### Pré-requisitos
- Docker e Docker Compose instalados
- Chave de API do TMDB (gratuita)

### Passo 1: Obter chave da API TMDB
1. Acesse [https://www.themoviedb.org/](https://www.themoviedb.org/)
2. Crie uma conta gratuita
3. Vá em Settings > API
4. Solicite uma chave de API (API Key v3)

### Passo 2: Configurar variáveis de ambiente
1. Crie um arquivo `.env` na raiz do projeto (copie do `.env.example`):
   
   **Windows (PowerShell):**
   ```powershell
   Copy-Item .env.example .env
   ```
   
   **Linux/Mac:**
   ```bash
   cp .env.example .env
   ```

2. Edite o arquivo `.env` e adicione sua chave de API:
   ```
   TMDB_API_KEY=sua_chave_aqui
   ```
   
   ⚠️ **IMPORTANTE:** Substitua `sua_chave_aqui` pela chave real obtida no TMDB!

### Passo 3: Rodar o projeto com Docker
```bash
docker-compose up --build
```

### Passo 4: Acessar a aplicação
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5001

## 📦 Rodar sem Docker (modo desenvolvimento)

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 📁 Estrutura do Projeto

```
API_Filmes/
├── backend/
│   ├── src/
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── pages/
│   ├── components/
│   ├── services/
│   ├── types/
│   ├── package.json
│   └── tsconfig.json
├── docker-compose.yml
├── .env.example
└── README.md
```

## 🧰 Como rodar

- Pré-requisitos:
  - Node.js 20+ e npm (ou Docker, opcional)
  - Chave da API do TMDB (gratuita)

- Configuração das variáveis:
  - Crie `.env` na raiz baseado em `.env.example`
  - Defina `TMDB_API_KEY` (obrigatória)
  - Opcional: `OPENAI_API_KEY` (respostas neurais do assistente)
  - No frontend, você pode definir `frontend/.env.local` com `NEXT_PUBLIC_BACKEND_URL=http://localhost:5001`

- Rodar em desenvolvimento:
  - Backend: `cd backend && npm install && npm run dev`
  - Frontend: `cd frontend && npm install && npm run dev`
  - Acesse: `http://localhost:3000` (frontend) e `http://localhost:5001` (backend)

- Rodar em produção local:
  - Backend: `cd backend && npm install && npm run build && npm start`
  - Frontend: `cd frontend && npm install && npm run build && npm start`

- Rodar com Docker (opcional):
  - `docker compose up --build`
  - Frontend em `http://localhost:3000`, Backend em `http://localhost:5001`
