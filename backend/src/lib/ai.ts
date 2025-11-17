import axios from "axios";

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
  };

  let detectedGenre: string | undefined;
  for (const key of Object.keys(genreMap)) {
    if (q.includes(key)) {
      detectedGenre = genreMap[key];
      break;
    }
  }

  const cerebral = q.includes("cerebral") || q.includes("reflexivo") || q.includes("mind-bending") || q.includes("mind bending");
  const params: DiscoverParams = { sort_by: "popularity.desc", include_adult: false, region: "BR", with_original_language: "en", "vote_count.gte": 200 };
  if (detectedGenre) params.with_genres = detectedGenre;
  if (startYear) params["primary_release_date.gte"] = `${startYear}-01-01`;
  params["primary_release_date.lte"] = `${(endYearOverride ?? endYear)}-12-31`;
  if (cerebral) params["vote_average.gte"] = 7;
  return params;
}

export async function generateAssistantAnswer(query: string, context: any[], filters?: DiscoverParams): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  const summary = summarizeContext(query, context, filters);
  if (!key) {
    return summary;
  }
  try {
    const resp = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Você é um assistente de filmes. Responda em português de forma clara e curta." },
          { role: "user", content: `Pergunta: ${query}\nContexto:\n${summary}` },
        ],
        temperature: 0.3,
      },
      { headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" } }
    );
    const content: string = resp.data?.choices?.[0]?.message?.content ?? summary;
    return content;
  } catch {
    return summary;
  }
}

function summarizeContext(query: string, context: any[], filters?: DiscoverParams): string {
  const lines: string[] = [];
  lines.push(`Consulta: ${query}`);
  if (filters) {
    lines.push(`Filtros:`);
    if (filters.with_genres) {
      const genreName = {
        "28": "Ação",
        "878": "Ficção Científica",
        "18": "Drama",
        "35": "Comédia",
        "53": "Thriller",
        "16": "Animação",
        "27": "Terror",
        "10749": "Romance",
        "12": "Aventura",
        "80": "Crime",
        "14": "Fantasia",
      }[filters.with_genres] || filters.with_genres;
      lines.push(`- Gênero: ${genreName}`);
    }
    if (filters["primary_release_date.gte"]) lines.push(`- Desde: ${filters["primary_release_date.gte"]}`);
    if (filters["primary_release_date.lte"]) lines.push(`- Até: ${filters["primary_release_date.lte"]}`);
    if (filters["vote_average.gte"]) lines.push(`- Nota mínima: ${filters["vote_average.gte"]}`);
    if (filters["vote_count.gte"]) lines.push(`- Mínimo de votos: ${filters["vote_count.gte"]}`);
  }
  for (const c of context) {
    lines.push(`- ${c.title} (${new Date(c.release_date).getFullYear()}) Nota: ${c.vote_average}`);
  }
  return lines.join("\n");
}