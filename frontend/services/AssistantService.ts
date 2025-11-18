import axios from "axios";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001";

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

export interface AssistantMessage {
  role: "user" | "assistant";
  content: string;
  ts?: number;
}

export async function askAssistant(query: string): Promise<AssistantResponse> {
  const resp = await axios.post<AssistantResponse>(`${BACKEND_URL}/api/assistant`, { query });
  return resp.data;
}

export async function chatAssistant(messages: AssistantMessage[]): Promise<AssistantResponse> {
  const last = [...messages].reverse().find((m) => m.role === "user");
  const resp = await axios.post<AssistantResponse>(`${BACKEND_URL}/api/assistant`, { history: messages, query: last?.content });
  return resp.data;
}

export async function chatAssistantStream(messages: AssistantMessage[], onChunk: (text: string) => void): Promise<void> {
  const last = [...messages].reverse().find((m) => m.role === "user");
  const resp = await fetch(`${BACKEND_URL}/api/assistant/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ history: messages, query: last?.content }),
  });
  const reader = resp.body?.getReader();
  if (!reader) return;
  const decoder = new TextDecoder();
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    onChunk(chunk);
  }
}

export interface AssistantStatus {
  openaiEnabled: boolean;
}

export async function getAssistantStatus(): Promise<AssistantStatus> {
  const resp = await axios.get<AssistantStatus>(`${BACKEND_URL}/api/assistant/status`);
  return resp.data;
}