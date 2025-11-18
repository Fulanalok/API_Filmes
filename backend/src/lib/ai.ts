import axios from "axios";

let openAIStatus: { ok: boolean; message?: string; at?: number } | undefined;

export type DiscoverParams = {
  sort_by?: string;
  with_genres?: string;
  "primary_release_date.gte"?: string;
  "primary_release_date.lte"?: string;
  "vote_average.gte"?: number;
  "vote_count.gte"?: number;
  include_adult?: boolean | string;
  region?: string;
  with_original_language?: string;
};

export function extractFilters(query: string): DiscoverParams {
  const q = query.toLowerCase();
  const now = new Date();
  const endYear = now.getFullYear();
  let startYear: number | undefined;
  let endYearOverride: number | undefined;
  if (q.includes("últimos 30 anos") || q.includes("ultimos 30 anos") || q.includes("last 30 years")) {
    startYear = endYear - 30;
  }
  // Décadas
  const decadeMatch = q.match(/anos\s+(\d{2,4})/);
  if (decadeMatch) {
    const d = decadeMatch[1];
    if (d.length === 2) {
      const base = parseInt(d, 10);
      const decadeStart = 1900 + base;
      startYear = decadeStart;
      endYearOverride = decadeStart + 9;
    } else {
      const decadeStart = parseInt(d, 10);
      startYear = decadeStart;
      endYearOverride = decadeStart + 9;
    }
  }

  const genreMap: Record<string, string> = {
    "acao": "28",
    "ação": "28",
    "action": "28",
    "sci-fi": "878",
    "ficção científica": "878",
    "ficcao cientifica": "878",
    "drama": "18",
    "comedia": "35",
    "comédia": "35",
    "thriller": "53",
    "animacao": "16",
    "animação": "16",
    "terror": "27",
    "horror": "27",
    "romance": "10749",
    "aventura": "12",
    "crime": "80",
    "fantasia": "14",
    "melancolico": "18",
    "melancólico": "18",
    "melancholic": "18",
    "triste": "18",
  };

  let detectedGenre: string | undefined;
  for (const key of Object.keys(genreMap)) {
    if (q.includes(key)) {
      detectedGenre = genreMap[key];
      break;
    }
  }

  const cerebral = q.includes("cerebral") || q.includes("reflexivo") || q.includes("mind-bending") || q.includes("mind bending");
  const melancholic = q.includes("melancolico") || q.includes("melancólico") || q.includes("melancholic") || q.includes("triste");
  const wantsEnglish = q.includes("em ingles") || q.includes("em inglês") || q.includes("english");
  const params: DiscoverParams = { sort_by: "popularity.desc", include_adult: false, region: "BR", "vote_count.gte": 200 };
  if (detectedGenre) params.with_genres = detectedGenre;
  if (startYear) params["primary_release_date.gte"] = `${startYear}-01-01`;
  params["primary_release_date.lte"] = `${(endYearOverride ?? endYear)}-12-31`;
  if (cerebral || melancholic) {
    params["vote_average.gte"] = 7;
    params.sort_by = "vote_average.desc";
  }
  if (wantsEnglish) params.with_original_language = "en";
  return params;
}

export async function generateAssistantAnswer(query: string, context: any[], filters?: DiscoverParams, history?: { role: "user" | "assistant"; content: string }[]): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  const summary = summarizeContext(query, context, filters);
  if (!key) {
    console.log("generateAssistantAnswer: OPENAI_API_KEY ausente, retornando resumo");
    openAIStatus = { ok: false, message: "OPENAI_API_KEY ausente", at: Date.now() };
    return summary;
  }
  try {
    const messages: { role: string; content: string }[] = [];
    messages.push({ role: "system", content: "Você é um assistente de filmes. Responda em português de forma natural e breve (1–2 frases). Cite até 3 títulos com ano. Evite linguagem técnica, filtros, notas e datas, a menos que o usuário peça. Termine com uma pergunta curta opcional." });
    if (Array.isArray(history)) {
      for (const m of history) {
        if (!m?.content) continue;
        messages.push({ role: m.role, content: m.content });
      }
    }
    messages.push({ role: "user", content: `Pergunta: ${query}\nContexto:\n${summary}` });
    const resp = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages,
        temperature: 0.3,
        max_tokens: 60,
      },
      { headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" } }
    );
    const content: string = resp.data?.choices?.[0]?.message?.content ?? summary;
    console.log("generateAssistantAnswer: resposta da IA gerada", { length: typeof content === "string" ? content.length : 0 });
    openAIStatus = { ok: true, at: Date.now() };
    const trimmed = (content || "").trim();
    if (trimmed.length > 280) {
      return summary;
    }
    return trimmed;
  } catch (e: any) {
    const msg = e?.response?.data?.error?.message || e?.message || "Falha ao chamar OpenAI";
    openAIStatus = { ok: false, message: msg, at: Date.now() };
    return summary;
  }
}

function summarizeContext(query: string, context: any[], filters?: DiscoverParams): string {
  if (context && context.length > 0) {
    const items = context.slice(0, 3).map((c) => `${c.title} (${new Date(c.release_date).getFullYear()})`);
    return `Algumas sugestões: ${items.join(", ")}. Quer mais opções?`;
  }
  return `Não encontrei boas opções para "${query}". Pode especificar gênero ou período?`;
}

export function getOpenAIStatus() {
  return {
    enabled: !!process.env.OPENAI_API_KEY,
    last: openAIStatus,
  };
}