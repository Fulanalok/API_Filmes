import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { askAssistant, AssistantResponse } from "@/services/AssistantService";

export default function AssistantPage() {
  const [q, setQ] = useState("");
  const { mutate, data, isPending } = useMutation<AssistantResponse, Error>({
    mutationFn: (query: string) => askAssistant(query),
  });
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center py-10 px-4">
      <div className="max-w-2xl w-full">
        <h1 className="text-3xl font-bold mb-6">Assistente de Filmes</h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (q.trim()) mutate(q);
          }}
          className="flex gap-2 mb-6"
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Faça uma pergunta, ex: filmes cyberpunk"
            className="flex-grow p-3 border border-gray-700 rounded-lg bg-black text-white"
          />
          <button
            type="submit"
            className="bg-green-600 px-4 py-3 rounded-lg"
            disabled={isPending}
          >
            {isPending ? "Consultando..." : "Perguntar"}
          </button>
        </form>
        {data && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-800 rounded-lg whitespace-pre-line">{data.answer}</div>
            {data.sources?.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-2">Referências</h2>
                <ul className="list-disc pl-5">
                  {data.sources.map((s) => (
                    <li key={s.id}>{s.title}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}