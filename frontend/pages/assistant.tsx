import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { chatAssistant, chatAssistantStream, AssistantResponse, AssistantMessage, AssistantSource, getAssistantStatus } from "@/services/AssistantService";

export default function AssistantPage() {
  const [q, setQ] = useState("");
  const [messages, setMessages] = useState<AssistantMessage[]>([
    { role: "assistant", content: "Oi! Eu sou seu assistente de filmes. Em que posso ajudar hoje?", ts: Date.now() },
  ]);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [sources, setSources] = useState<AssistantSource[]>([]);
  const [aiStatus, setAiStatus] = useState<{ openaiEnabled: boolean } | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const { mutate, isPending } = useMutation<AssistantResponse, Error, AssistantMessage[]>({
    mutationFn: chatAssistant,
    onSuccess: (data) => {
      setErrorMsg("");
      setSources(data?.sources || []);
      console.log("frontend: assistente onSuccess", { sources: (data?.sources || []).length });
    },
    onError: (err) => {
      const msg = err?.message || "Falha ao consultar assistente.";
      setMessages((prev) => [...prev, { role: "assistant", content: msg, ts: Date.now() }]);
      setErrorMsg(msg);
      console.log("frontend: assistente onError", { message: msg });
    },
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem("assistant-chat");
      if (raw) {
        const parsed = JSON.parse(raw) as AssistantMessage[];
        if (Array.isArray(parsed) && parsed.length > 0) setMessages(parsed);
      }
      getAssistantStatus().then((s) => { setAiStatus(s); console.log("frontend: assistente status", s); }).catch((e) => { console.log("frontend: assistente status erro", e instanceof Error ? e.message : String(e)); });
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("assistant-chat", JSON.stringify(messages));
    } catch {}
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const sendMessage = async (text: string) => {
    const next: AssistantMessage[] = [...messages, { role: "user", content: text, ts: Date.now() }];
    setMessages(next);
    setQ("");
    setIsStreaming(true);
    console.log("frontend: assistente enviar", { text });
    const ts = Date.now();
    setMessages((prev) => [...prev, { role: "assistant", content: "", ts }]);
    try {
      await chatAssistantStream(next, (chunk) => {
        console.log("frontend: assistente chunk", { length: chunk.length });
        setMessages((prev) => {
          const updated = [...prev];
          const idx = updated.length - 1;
          if (idx >= 0 && updated[idx].role === "assistant") {
            updated[idx] = { ...updated[idx], content: (updated[idx].content || "") + chunk };
          }
          return updated;
        });
      });
      setErrorMsg("");
      console.log("frontend: assistente streaming concluído");
      mutate(next);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Falha ao consultar assistente.";
      setErrorMsg(msg);
      console.log("frontend: assistente erro", { message: msg });
    } finally {
      setIsStreaming(false);
      console.log("frontend: assistente fim", { isStreaming: false });
    }
  };
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center py-10 px-4">
      <div className="max-w-2xl w-full">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold">Assistente de Filmes</h1>
          {aiStatus && (
            <span className={`px-2 py-1 rounded text-sm ${aiStatus.openaiEnabled ? "bg-green-700" : "bg-gray-700"}`}>
              {aiStatus.openaiEnabled ? "IA ativa" : "Modo básico"}
            </span>
          )}
          <Link href="/" className="ml-auto text-sm px-3 py-1 rounded-lg bg-green-600 text-white hover:bg-green-700 transition">
            Voltar para busca
          </Link>
        </div>
        <p className="text-gray-300 mb-6">Converse e receba recomendações com contexto e fontes confiáveis.</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (q.trim()) {
              sendMessage(q.trim());
            }
          }}
          className="flex gap-2 mb-6"
        >
          <textarea
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (q.trim()) {
                  sendMessage(q.trim());
                }
              }
            }}
            rows={3}
            placeholder="Pergunte como se estivesse falando com um humano"
            className="flex-grow p-3 border border-gray-700 rounded-lg bg-black text-white"
          />
          <button
            type="submit"
            className="bg-green-600 px-4 py-3 rounded-lg"
            disabled={isPending || isStreaming || !q.trim()}
          >
            Perguntar
          </button>
        </form>
        <div className="flex gap-2 flex-wrap mb-6">
          <button className="ml-auto px-3 py-1 rounded-full bg-red-700 text-white hover:bg-red-800" onClick={() => {
            setMessages([{ role: "assistant", content: "Oi! Eu sou seu assistente de filmes. Em que posso ajudar hoje?", ts: Date.now() }]);
            setErrorMsg("");
          }}>Limpar</button>
        </div>
        {messages.length > 0 && (
          <div ref={scrollRef} className="space-y-3 mb-6 max-h-[60vh] overflow-y-auto">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} px-1`}>
                {m.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-green-700 text-white flex items-center justify-center mr-2">🎬</div>
                )}
                <div className={`max-w-[80%] ${m.role === "user" ? "bg-gray-700" : "bg-gray-800"} text-white p-4 rounded-2xl border border-gray-600`}>
                  <div className="text-base leading-relaxed">{m.content}</div>
                </div>
                {m.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-gray-600 text-white flex items-center justify-center ml-2">🧑</div>
                )}
              </div>
            ))}
            <div className="flex justify-center py-2">
              <button
                className="px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600"
                disabled={isPending || isStreaming}
                onClick={() => sendMessage("quero")}
              >
                Ver próximos
              </button>
            </div>
          </div>
        )}
        {errorMsg && (
          <div className="mb-4 text-sm text-red-400">{errorMsg}</div>
        )}
        {sources.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xl font-semibold">Referências</h2>
            {sources.map((s) => (
              <div key={s.id} className="flex gap-3 p-3 bg-gray-800 rounded-lg">
                {s.poster_path ? (
                  <div className="relative w-20 h-28 flex-shrink-0">
                    <Image
                      src={`https://image.tmdb.org/t/p/w185${s.poster_path}`}
                      alt={s.title}
                      fill
                      sizes="80px"
                      className="object-cover rounded"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-28 bg-gray-700 rounded flex items-center justify-center text-xs text-gray-300">Sem pôster</div>
                )}
                <div className="flex-1">
                  <Link href={`/movies/${s.id}`} className="text-white font-semibold hover:underline">
                    {s.title}
                  </Link>
                  <div className="text-sm text-gray-300">
                    {s.release_date ? new Date(s.release_date).getFullYear() : "—"}
                  </div>
                  {s.overview && (
                    <p className="mt-1 text-sm text-gray-300 line-clamp-3">{s.overview}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
      </div>
    </div>
  );
}