import express from "express";
import dotenv from "dotenv";
import path from "path";
import axios from "axios";
import bodyParser from "body-parser";
import { generateAssistantAnswer, extractFilters, getOpenAIStatus } from "./lib/ai";
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

function isAffirmativeMoreRequest(text?: string) {
  if (!text) return false;
  const t = text.toLowerCase().trim();
  return (
    t === "quero" ||
    t === "sim" ||
    t.includes("quero mais") ||
    t.includes("mais opções") ||
    t.includes("manda mais") ||
    t.includes("pode ser") ||
    t === "mais"
  );
}

function getBaseQueryAndBatch(history: { role: "user" | "assistant"; content: string }[] | undefined, current?: string) {
  let base = current?.trim();
  let batch = 0;
  if (Array.isArray(history) && isAffirmativeMoreRequest(current)) {
    const rev = [...history].reverse();
    // Find last non-affirmative user message as base
    for (const m of rev) {
      if (m.role !== "user") continue;
      const c = (m.content || "").trim();
      if (!isAffirmativeMoreRequest(c)) {
        base = c;
        break;
      }
    }
    // Count how many affirmative user messages appear after base
    let seenBase = false;
    for (const m of history) {
      if (m.role !== "user") continue;
      const c = (m.content || "").trim();
      if (!seenBase && base && c === base) {
        seenBase = true;
        continue;
      }
      if (seenBase && isAffirmativeMoreRequest(c)) batch++;
    }
  }
  return { baseQuery: base, batchIndex: batch };
}

dotenv.config({ path: path.resolve(process.cwd(), "../.env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const app = express();
app.use(bodyParser.json());
const PORT = process.env.PORT || 5001;
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

app.options("*", (req, res) => {
  res.sendStatus(204);
});

async function fetchMovieDetails(ids: number[], append: string) {
  const details: any[] = [];
  for (const id of ids) {
    const d = await axios.get(`https://api.themoviedb.org/3/movie/${id}`, {
      params: { api_key: TMDB_API_KEY, language: "pt-BR", append_to_response: append },
    });
    details.push(d.data);
  }
  return details;
}

async function searchTop(baseQuery: string, batchIndex: number, pageSize: number) {
  console.log("searchTop: início", { baseQuery, batchIndex, pageSize });
  const start = batchIndex * pageSize;
  const end = start + pageSize;
  let results: any[] = [];
  let details: any[] = [];
  let usedFilters: any | undefined;
  const primeFilters = extractFilters(baseQuery);
  if (primeFilters.with_genres) {
    console.log("searchTop: gênero detectado, usando discover");
    console.log("searchTop: filtros", primeFilters);
    const d1 = await axios.get("https://api.themoviedb.org/3/discover/movie", {
      params: { api_key: TMDB_API_KEY, language: "pt-BR", include_adult: false, region: "BR", ...primeFilters },
    });
    usedFilters = primeFilters;
    const disc = Array.isArray(d1.data?.results) ? d1.data.results : [];
    const top = disc.slice(start, end);
    const ids = top.map((t: any) => t?.id).filter((x: any) => !!x);
    console.log("searchTop: ids selecionados", { count: ids.length, ids });
    details = await fetchMovieDetails(ids, "credits,images,videos,release_dates,external_ids,keywords,translations,recommendations,similar,reviews");
    console.log("searchTop: detalhes carregados", { count: details.length });
    return { top, details, filters: usedFilters };
  }
  console.log("searchTop: tentativa search/movie pt-BR");
  const s1 = await axios.get("https://api.themoviedb.org/3/search/movie", {
    params: { api_key: TMDB_API_KEY, query: baseQuery, language: "pt-BR", include_adult: false },
  });
  results = Array.isArray(s1.data?.results) ? s1.data.results : [];
  console.log("searchTop: resultados pt-BR", { count: results.length });
  if (!results.length) {
    console.log("searchTop: fallback search/movie en-US");
    const s2 = await axios.get("https://api.themoviedb.org/3/search/movie", {
      params: { api_key: TMDB_API_KEY, query: baseQuery, language: "en-US", include_adult: false },
    });
    results = Array.isArray(s2.data?.results) ? s2.data.results : [];
    console.log("searchTop: resultados en-US", { count: results.length });
  }
  if (!results.length) {
    console.log("searchTop: fallback search/multi pt-BR (somente filmes)");
    const s3 = await axios.get("https://api.themoviedb.org/3/search/multi", {
      params: { api_key: TMDB_API_KEY, query: baseQuery, language: "pt-BR", include_adult: false },
    });
    const onlyMovies = Array.isArray(s3.data?.results) ? s3.data.results.filter((r: any) => r.media_type === "movie") : [];
    results = onlyMovies;
    console.log("searchTop: resultados search/multi", { count: results.length });
  }
  if (!results.length) {
    console.log("searchTop: fallback search/collection pt-BR → en-US");
    const c1 = await axios.get("https://api.themoviedb.org/3/search/collection", {
      params: { api_key: TMDB_API_KEY, query: baseQuery, language: "pt-BR" },
    });
    let col = Array.isArray(c1.data?.results) ? c1.data.results[0] : undefined;
    if (!col) {
      const c2 = await axios.get("https://api.themoviedb.org/3/search/collection", {
        params: { api_key: TMDB_API_KEY, query: baseQuery, language: "en-US" },
      });
      col = Array.isArray(c2.data?.results) ? c2.data.results[0] : undefined;
    }
    if (col && col.id) {
      console.log("searchTop: coleção encontrada", { collectionId: col.id, name: col.name });
      const parts = await axios.get(`https://api.themoviedb.org/3/collection/${col.id}`, {
        params: { api_key: TMDB_API_KEY, language: "pt-BR" },
      });
      const list = Array.isArray(parts.data?.parts) ? parts.data.parts : [];
      list.sort((a: any, b: any) => (b.popularity ?? 0) - (a.popularity ?? 0));
      results = list;
      console.log("searchTop: resultados da coleção", { count: results.length });
    }
  }
  let top = results.slice(start, end);
  if (!top.length) {
    console.log("searchTop: fallback discover com filtros extraídos");
    const filters = extractFilters(baseQuery);
    console.log("searchTop: filtros", filters);
    const d1 = await axios.get("https://api.themoviedb.org/3/discover/movie", {
      params: { api_key: TMDB_API_KEY, language: "pt-BR", include_adult: false, region: "BR", ...filters },
    });
    usedFilters = filters;
    const disc = Array.isArray(d1.data?.results) ? d1.data.results : [];
    top = disc.slice(start, end);
    console.log("searchTop: resultados discover (top slice)", { count: top.length });
  }
  const ids = top.map((t: any) => t?.id).filter((x: any) => !!x);
  console.log("searchTop: ids selecionados", { count: ids.length, ids });
  details = await fetchMovieDetails(ids, "credits,images,videos,release_dates,external_ids,keywords,translations,recommendations,similar,reviews");
  console.log("searchTop: detalhes carregados", { count: details.length });
  return { top, details, filters: usedFilters };
}

app.get("/api/search/movie", async (req, res) => {
  const query = req.query.query as string;
  const pageParam = req.query.page as string | undefined;
  const page = pageParam ? Math.max(1, Number(pageParam)) : 1;

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
    console.log("/api/search/movie: início", { query, page });
    const cacheKey = `search:${query}:page:${page}`;
    const cached = getCache(cacheKey);
    if (cached) {
      const cachedAny = cached as any;
      const count = Array.isArray(cachedAny?.results) ? cachedAny.results.length : 0;
      console.log("/api/search/movie: cache hit", { cacheKey, count });
      return res.json(cached);
    }

    const perPage = 20;
    let agg: any[] = [];

    console.log("/api/search/movie: tentativa search/movie pt-BR");
    const s1 = await axios.get("https://api.themoviedb.org/3/search/movie", {
      params: { api_key: TMDB_API_KEY, query, language: "pt-BR", include_adult: false, region: "BR" },
    });
    agg = Array.isArray(s1.data?.results) ? s1.data.results : [];
    console.log("/api/search/movie: resultados pt-BR", { count: agg.length });
    if (!agg.length) {
      console.log("/api/search/movie: fallback search/movie en-US");
      const s2 = await axios.get("https://api.themoviedb.org/3/search/movie", {
        params: { api_key: TMDB_API_KEY, query, language: "en-US", include_adult: false },
      });
      agg = Array.isArray(s2.data?.results) ? s2.data.results : [];
      console.log("/api/search/movie: resultados en-US", { count: agg.length });
    }
    if (!agg.length) {
      console.log("/api/search/movie: fallback search/multi pt-BR (somente filmes)");
      const s3 = await axios.get("https://api.themoviedb.org/3/search/multi", {
        params: { api_key: TMDB_API_KEY, query, language: "pt-BR", include_adult: false },
      });
      const onlyMovies = Array.isArray(s3.data?.results) ? s3.data.results.filter((r: any) => r.media_type === "movie") : [];
      agg = onlyMovies;
      console.log("/api/search/movie: resultados search/multi", { count: agg.length });
    }
    if (!agg.length) {
      console.log("/api/search/movie: fallback search/collection pt-BR → en-US");
      const c1 = await axios.get("https://api.themoviedb.org/3/search/collection", {
        params: { api_key: TMDB_API_KEY, query, language: "pt-BR" },
      });
      let col = Array.isArray(c1.data?.results) ? c1.data.results[0] : undefined;
      if (!col) {
        const c2 = await axios.get("https://api.themoviedb.org/3/search/collection", {
          params: { api_key: TMDB_API_KEY, query, language: "en-US" },
        });
        col = Array.isArray(c2.data?.results) ? c2.data.results[0] : undefined;
      }
      if (col && col.id) {
        console.log("/api/search/movie: coleção encontrada", { collectionId: col.id, name: col.name });
        const parts = await axios.get(`https://api.themoviedb.org/3/collection/${col.id}`, {
          params: { api_key: TMDB_API_KEY, language: "pt-BR" },
        });
        const list = Array.isArray(parts.data?.parts) ? parts.data.parts : [];
        list.sort((a: any, b: any) => (b.popularity ?? 0) - (a.popularity ?? 0));
        agg = list;
        console.log("/api/search/movie: resultados da coleção", { count: agg.length });
      }
    }
    if (!agg.length) {
      console.log("/api/search/movie: fallback discover com filtros extraídos");
      const filters = extractFilters(query);
      console.log("/api/search/movie: filtros", filters);
      const d1 = await axios.get("https://api.themoviedb.org/3/discover/movie", {
        params: { api_key: TMDB_API_KEY, language: "pt-BR", include_adult: false, region: "BR", ...filters },
      });
      agg = Array.isArray(d1.data?.results) ? d1.data.results : [];
      console.log("/api/search/movie: resultados discover", { count: agg.length });
    }

    const seen = new Set<number>();
    const dedup = agg.filter((r: any) => {
      const id = r?.id;
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });

    const total_results = dedup.length;
    const total_pages = Math.max(1, Math.ceil(total_results / perPage));
    const start = (page - 1) * perPage;
    const end = start + perPage;
    const pageResults = dedup.slice(start, end);
    const payload = { results: pageResults, total_pages, total_results, page };
    console.log("/api/search/movie: resposta", { total_results, total_pages, page, page_count: pageResults.length });
    setCache(cacheKey, payload);
    res.json(payload);
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

app.post("/api/assistant", async (req, res) => {
  const { query, history } = req.body as { query?: string; history?: { role: "user" | "assistant"; content: string }[] };
  const effectiveQuery = (query && query.trim()) || (Array.isArray(history) ? [...history].reverse().find(m => m.role === "user" && m.content?.trim())?.content?.trim() : undefined);
  if (!effectiveQuery) {
    return res.status(400).json({ message: "O parâmetro 'query' é obrigatório." });
  }
  if (!TMDB_API_KEY) {
    return res.status(500).json({ message: "Chave de API TMDB ausente." });
  }
  try {
    console.log("/api/assistant: início", { effectiveQuery, hasOpenAIKey: !!process.env.OPENAI_API_KEY });
    const { baseQuery, batchIndex } = getBaseQueryAndBatch(history, effectiveQuery);
    console.log("/api/assistant: baseQuery/batchIndex", { baseQuery, batchIndex });
    const pageSize = 3;
    const { details, filters } = await searchTop(baseQuery!, batchIndex, pageSize);
    console.log("/api/assistant: searchTop retornou", { detailsCount: details.length, filters });
    const answer = await generateAssistantAnswer(baseQuery!, details, filters, history);
    console.log("/api/assistant: answer gerada", { length: typeof answer === "string" ? answer.length : 0 });
    return res.json({
      answer,
      sources: details.map((d) => ({
        id: d.id,
        title: d.title,
        overview: d.overview,
        poster_path: d.poster_path,
        release_date: d.release_date,
        vote_average: d.vote_average,
      })),
    });
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return res.status(error.response.status).json({ message: "Erro ao consultar assistente.", details: error.response.data });
    }
    return res.status(500).json({ message: "Erro inesperado no assistente." });
  }
});

app.get("/api/assistant/status", (req, res) => {
  const st = getOpenAIStatus();
  res.json({ openaiEnabled: st.enabled, lastError: st.last?.ok ? undefined : st.last?.message, lastUpdateAt: st.last?.at });
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
        append_to_response: "credits,images,videos,release_dates,external_ids,keywords,translations,recommendations,similar,reviews",
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
  const pageParam = req.query.page as string | undefined;
  const page = pageParam ? Math.max(1, Number(pageParam)) : 1;
  if (!TMDB_API_KEY) {
    console.error("Erro: TMDB_API_KEY não definida no ambiente.");
    return res.status(500).json({
      message: "Erro interno do servidor: Chave de API não configurada corretamente.",
    });
  }

  try {
    const cacheKey = `popular:day:${page}`;
    const cached = getCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const respPt = await axios.get(
      "https://api.themoviedb.org/3/trending/movie/day",
      {
        params: {
          api_key: TMDB_API_KEY,
          language: "pt-BR",
          page,
        },
      }
    );
    let data = respPt.data;
    const hasResults = Array.isArray(data?.results) && data.results.length > 0;
    if (!hasResults) {
      const respEn = await axios.get(
        "https://api.themoviedb.org/3/trending/movie/day",
        {
          params: {
            api_key: TMDB_API_KEY,
            language: "en-US",
            page,
          },
        }
      );
      data = respEn.data;
    }
    setCache(cacheKey, data);
    res.json(data);
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
app.get("/api/tmdb/*", async (req, res) => {
  const p = (req.params as any)[0] as string | undefined;
  if (!p) {
    return res.status(400).json({ message: "Caminho da TMDB ausente." });
  }
  if (!TMDB_API_KEY) {
    return res.status(500).json({ message: "Chave de API TMDB ausente." });
  }
  try {
    const base = `https://api.themoviedb.org/3/${p}`;
    const params: Record<string, any> = { ...req.query, api_key: TMDB_API_KEY };
    const cacheKey = `tmdb:${p}?${Object.keys({ ...params, api_key: undefined })
      .sort()
      .map((k) => `${k}=${String((params as any)[k])}`)
      .join("&")}`;
    const cached = getCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }
    const response = await axios.get(base, { params });
    setCache(cacheKey, response.data);
    res.json(response.data);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return res.status(error.response.status).json({ message: "Erro ao consultar TMDB.", details: error.response.data });
    }
    return res.status(500).json({ message: "Erro inesperado ao consultar TMDB." });
  }
});
if (require.main === module) {
  const initial = Number(process.env.PORT) || Number(PORT) || 5001;
  const candidates: number[] = [
    initial,
    ...Array.from({ length: 9 }, (_, i) => initial + i + 1),
    0,
  ];
  const tryListen = (idx: number) => {
    const port = candidates[idx] ?? 0;
    const server = app.listen(port);
    server.on("listening", () => {
      const addr = server.address();
      const actualPort = typeof addr === "object" && addr ? addr.port : port;
      console.log(`Servidor backend rodando na porta ${actualPort}`);
    });
    server.on("error", (err: any) => {
      if (err && err.code === "EADDRINUSE" && idx + 1 < candidates.length) {
        console.warn(`Porta ${port} em uso, tentando próxima...`);
        tryListen(idx + 1);
        return;
      }
      console.error("Falha ao iniciar servidor:", err);
      process.exit(1);
    });
  };
  tryListen(0);
}
export { app };
app.post("/api/assistant/stream", async (req, res) => {
  const { query, history } = req.body as { query?: string; history?: { role: "user" | "assistant"; content: string }[] };
  const effectiveQuery = (query && query.trim()) || (Array.isArray(history) ? [...history].reverse().find(m => m.role === "user" && m.content?.trim())?.content?.trim() : undefined);
  if (!effectiveQuery) {
    res.status(400).type("text/plain").write("Parâmetro ausente.");
    return res.end();
  }
  if (!TMDB_API_KEY) {
    res.status(500).type("text/plain").write("Chave TMDB ausente.");
    return res.end();
  }
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  try {
    const { baseQuery, batchIndex } = getBaseQueryAndBatch(history, effectiveQuery);
    const pageSize = 3;
    const { details, filters } = await searchTop(baseQuery!, batchIndex, pageSize);
    const answer = await generateAssistantAnswer(baseQuery!, details, filters, history);
    const tokens = answer.split(/\s+/);
    let i = 0;
    const interval = setInterval(() => {
      if (i >= tokens.length) {
        clearInterval(interval);
        res.end();
      } else {
        const piece = tokens.slice(i, i + 6).join(" ") + " ";
        i += 6;
        res.write(piece);
      }
    }, 40);
  } catch (error) {
    res.status(500).type("text/plain").write("Erro ao processar.");
    res.end();
  }
});
