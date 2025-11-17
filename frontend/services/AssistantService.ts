import axios from "axios";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export interface AssistantResponse {
  answer: string;
  sources: { id: number; title: string }[];
}

export async function askAssistant(query: string): Promise<AssistantResponse> {
  const resp = await axios.post<AssistantResponse>(`${BACKEND_URL}/api/assistant`, { query });
  return resp.data;
}