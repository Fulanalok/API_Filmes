import axios from "axios";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export interface AssistantSource {
  id: number;
  title: string;
  overview?: string;
  poster_path?: string | null;
  release_date?: string;
  vote_average?: number;
}

export interface AssistantResponse {
  answer: string;
  sources: AssistantSource[];
}

export async function askAssistant(query: string): Promise<AssistantResponse> {
  const resp = await axios.post<AssistantResponse>(`${BACKEND_URL}/api/assistant`, { query });
  return resp.data;
}
