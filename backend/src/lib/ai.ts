import axios from "axios";

export type DiscoverParams = {
  sort_by?: string;
  with_genres?: string;
  "primary_release_date.gte"?: string;
  "primary_release_date.lte"?: string;
  "vote_average.gte"?: number;
};

export function extractFilters(query: string): DiscoverParams {
  const q = query.toLowerCase();
  const now = new Date();
  const endYear = now.getFullYear();
  let startYear: number | undefined;
  if (q.includes("últimos 30 anos") || q.includes("ultimos 30 anos") || q.includes("last 30 years")) {
    startYear = endYear - 30;
  }
  const sciFi = q.includes("sci-fi") || q.includes("ficção científica") || q.includes("ficcao cientifica") || q.includes("science fiction");
  const cerebral = q.includes("cerebral") || q.includes("reflexivo") || q.includes("mind-bending") || q.includes("mind bending");
  const params: DiscoverParams = { sort_by: "vote_average.desc" };
  if (sciFi) params.with_genres = "878";
  if (startYear) params["primary_release_date.gte"] = `${startYear}-01-01`;
  params["primary_release_date.lte"] = `${endYear}-12-31`;
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
    if (filters.with_genres) lines.push(`- Gênero: ${filters.with_genres}`);
    if (filters["primary_release_date.gte"]) lines.push(`- Desde: ${filters["primary_release_date.gte"]}`);
    if (filters["primary_release_date.lte"]) lines.push(`- Até: ${filters["primary_release_date.lte"]}`);
    if (filters["vote_average.gte"]) lines.push(`- Nota mínima: ${filters["vote_average.gte"]}`);
  }
  for (const c of context) {
    lines.push(`- ${c.title} (${new Date(c.release_date).getFullYear()}) Nota: ${c.vote_average}`);
  }
  return lines.join("\n");
}