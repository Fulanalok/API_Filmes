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
- **Backend**: http://localhost:5000

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

## 🌐 Endpoints da API

### `GET /api/search/movie`
Busca filmes por termo de pesquisa.

**Query Parameters:**
- `query` (obrigatório): Termo de busca

**Exemplo:**
```
http://localhost:5000/api/search/movie?query=matrix
```

### `GET /api/movie/:id`
Obtém detalhes completos de um filme específico.

**Path Parameters:**
- `id` (obrigatório): ID do filme no TMDB

**Exemplo:**
```
http://localhost:5000/api/movie/603
```

## 📁 Estrutura do Projeto

```
API_Filmes/
├── backend/
│   ├── src/
│   │   └── index.ts
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── pages/
│   ├── components/
│   ├── services/
│   ├── types/
│   ├── styles/
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── docker-compose.yml
├── .env.example
└── README.md
```

## 🛠️ Mudanças Implementadas

- Backend
  - Corrige `GET /api/movie/:id` usando `append_to_response` via `params` (TMDB).
  - Valida `id` como inteiro positivo e retorna erro claro se inválido.
  - Adiciona cache em memória com TTL de 5 minutos para busca e detalhes.
  - Aplica rate limiting (60 req/min por IP) em todas as rotas sob `/api`.

- Frontend
  - Implementa `components/SearchBar.tsx` com debounce opcional e acessibilidade.
  - Integra a SearchBar na `pages/index.tsx` e adiciona skeletons de carregamento.
  - Configura `next.config.ts` para permitir imagens de `image.tmdb.org` (TMDB) no `next/image`.

- Docker/Infra
  - Adiciona healthchecks no `docker-compose.yml`:
    - Backend: `curl -f http://localhost:5000/`
    - Frontend: `curl -f http://localhost:3000/`
  - Instala `curl` na imagem final do frontend para suportar healthchecks HTTP.

## ✅ Como validar as mudanças

- Detalhes TMDB corrigidos
  - `GET http://localhost:5000/api/movie/603` deve retornar detalhes completos (inclui `videos` e `credits`).

- Cache com TTL
  - Execute duas buscas iguais em sequência (ex.: `matrix`) e observe menor latência na segunda.
  - Após ~5 minutos, o cache expira e a primeira chamada volta mais lenta.

- Rate limiting
  - Dispare mais de 60 requisições por minuto ao mesmo IP em `/api` e espere `429 Too Many Requests`.

- SearchBar + Skeletons
  - Digite rapidamente na home; deve evitar chamadas excessivas ao backend enquanto digita (debounce).
  - Skeletons aparecem durante carregamento dos resultados.

- Imagens TMDB
  - Cartazes e fotos de perfil devem carregar sem erro graças a `images.domains = ['image.tmdb.org']`.

## ⚙️ Variáveis de ambiente

- `.env` (na raiz):
  - `TMDB_API_KEY`: chave de acesso do TMDB (obrigatória).

Valores fixos das melhorias (ajustáveis no código):
- TTL do cache: `5 minutos`.
- Rate limiting: `60 requisições/minuto` por IP.

## 🧰 Comandos úteis

- Subir com Docker:
  - `docker compose up --build`

- Verificar healthchecks:
  - `docker ps` e observe o campo `STATUS` (deve ficar `healthy`).

- Testar endpoints rapidamente:
  - `curl http://localhost:5000/api/search/movie?query=matrix`
  - `curl http://localhost:5000/api/movie/603`

## 📌 Observações

- CORS do backend está amplo por conveniência em dev; pode ser restrito por domínio se necessário.
- As versões usadas (Next 15, React 19) são recentes; teste em produção com cuidado.
- Próximos passos sugeridos: cache distribuído (Redis), testes automatizados, logs e métricas, CI/CD.

## 🔒 Segurança

- ⚠️ **NUNCA** commite o arquivo `.env` com suas chaves de API
- O arquivo `.gitignore` já está configurado para proteger suas credenciais
- Use sempre o `.env.example` como referência para outras pessoas

## 📝 Licença

Este projeto é livre para uso pessoal e educacional.

## 👨‍💻 Autor

Lucas Vilhena
## Executar em desenvolvimento

- Backend:
  - `cd backend`
  - `npm run dev`
  - Variáveis em `backend/.env`: `TMDB_API_KEY`, `OPENAI_API_KEY`
- Frontend:
  - `cd frontend`
  - `npx next@15.3.4 dev -p 3000` com `NEXT_PUBLIC_BACKEND_URL=http://localhost:5000`

## Assistente de IA

- Endpoint: `POST /api/assistant`
- Página: `/assistant`
- Requer `TMDB_API_KEY`; usa `OPENAI_API_KEY` se disponível para respostas neurais.

## CI no GitHub Actions

- Workflow em `.github/workflows/ci.yml` builda `backend` e `frontend` em cada push/PR.
- Configure Secrets do repositório:
  - `TMDB_API_KEY`: chave TMDB
  - `OPENAI_API_KEY`: chave OpenAI
  - `NEXT_PUBLIC_BACKEND_URL`: URL do backend (ex.: `https://sua-api.exemplo`)
