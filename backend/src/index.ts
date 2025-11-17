import express from "express";
import dotenv from "dotenv";
import axios from "axios";
import rateLimit from "express-rate-limit";

// Cache simples em memória com TTL
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos
type CacheEntry = { ts: number; data: unknown };
const cache = new Map<string, CacheEntry>();

function getCache(key: string) {
  const entry = cache.get(key);
  if (!entry) return undefined;
  const expired = Date.now() - entry.ts > CACHE_TTL_MS;
  if (expired) {
    cache.delete(key);
    return undefined;
  }
  return entry.data;
}

function setCache(key: string, data: unknown) {
  cache.set(key, { ts: Date.now(), data });
}

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const TMDB_API_KEY = process.env.TMDB_API_KEY;

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type"
  );
  next();
});

// Rate limiting básico para proteger as rotas da API
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  limit: 60, // 60 req/min por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Muitas requisições. Tente novamente em instantes." },
});

app.use("/api/", apiLimiter);

app.get("/", (req, res) => {
  res.send("API de filmes funcionando!");
});

app.get("/api/search/movie", async (req, res) => {
  const query = req.query.query as string;

  if (!query) {
    return res
      .status(400)
      .json({ message: "O parâmetro 'query' é obrigatório para a busca." });
  }

  if (!TMDB_API_KEY) {
    console.error(
      "Erro: TMDB_API_KEY não definida no arquivo .env ou no ambiente."
    );
    return res.status(500).json({
      message:
        "Erro interno do servidor: Chave de API não configurada corretamente.",
    });
  }

  try {
    const cacheKey = `search:${query}`;
    const cached = getCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const response = await axios.get(`https://api.themoviedb.org/3/search/movie`, {
      params: {
        api_key: TMDB_API_KEY,
        query: query,
        language: "pt-BR",
      },
    });
    setCache(cacheKey, response.data);
    res.json(response.data);
  } catch (error) {
    console.error("Erro ao buscar filmes da TMDB:", error);
    if (axios.isAxiosError(error) && error.response) {
      console.error(
        "Detalhes do erro da TMDB:",
        error.response.status,
        error.response.data
      );
      return res.status(error.response.status).json({
        message: "Erro ao buscar filmes na API externa.",
        details: error.response.data,
      });
    }
    res
      .status(500)
      .json({ message: "Erro inesperado ao processar a requisição." });
  }
});

app.get("/api/movie/:id", async (req, res) => {
  const movieId = req.params.id;

  if (!movieId) {
    return res
      .status(400)
      .json({ message: "O parâmetro 'id' do filme/série é obrigatório." });
  }

  // Validação de ID numérico
  const numericId = Number(movieId);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return res.status(400).json({ message: "O parâmetro 'id' deve ser um número inteiro válido." });
  }

  if (!TMDB_API_KEY) {
    console.error(
      "Erro: TMDB_API_KEY não definida no arquivo .env ou no ambiente."
    );
    return res.status(500).json({
      message:
        "Erro interno do servidor: Chave de API não configurada corretamente.",
    });
  }

  try {
    const cacheKey = `movie:${numericId}`;
    const cached = getCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const response = await axios.get(`https://api.themoviedb.org/3/movie/${numericId}`, {
      params: {
        api_key: TMDB_API_KEY,
        language: "pt-BR",
        append_to_response: "credits,images,videos",
      },
    });
    setCache(cacheKey, response.data);
    res.json(response.data);
  } catch (error) {
    console.error(
      `Erro ao buscar detalhes do filme ${movieId} da TMDB:`,
      error
    );
    if (axios.isAxiosError(error) && error.response) {
      console.error(
        "Detalhes do erro da TMDB:",
        error.response.status,
        error.response.data
      );
      if (error.response.status === 404) {
        return res
          .status(404)
          .json({ message: "Filme/Série não encontrado(a)." });
      }
      return res.status(error.response.status).json({
        message: "Erro ao buscar detalhes do filme na API externa.",
        details: error.response.data,
      });
    }
    res.status(500).json({
      message: "Erro inesperado ao processar a requisição de detalhes.",
    });
  }
});

app.get("/api/popular", async (req, res) => {
  if (!TMDB_API_KEY) {
    console.error("Erro: TMDB_API_KEY não definida no ambiente.");
    return res.status(500).json({
      message: "Erro interno do servidor: Chave de API não configurada corretamente.",
    });
  }

  try {
    const cacheKey = "popular:day";
    const cached = getCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const response = await axios.get(
      "https://api.themoviedb.org/3/trending/movie/day",
      {
        params: {
          api_key: TMDB_API_KEY,
          language: "pt-BR",
        },
      }
    );
    setCache(cacheKey, response.data);
    res.json(response.data);
  } catch (error) {
    console.error("Erro ao buscar populares da TMDB:", error);
    if (axios.isAxiosError(error) && error.response) {
      return res.status(error.response.status).json({
        message: "Erro ao buscar populares na API externa.",
        details: error.response.data,
      });
    }
    res.status(500).json({ message: "Erro inesperado ao processar a requisição." });
  }
});
app.listen(PORT, () => {
  console.log(`Servidor backend rodando na porta ${PORT}`);
});
