import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { askAssistant, AssistantResponse, AssistantSource } from "@/services/AssistantService";

export default function AssistantPage() {
  const [q, setQ] = useState("");
  const { mutate, data, isPending } = useMutation<AssistantResponse, Error, string>({
    mutationFn: askAssistant,
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
          <div className="space-y-6">
            <div className="p-4 bg-gray-800 rounded-lg whitespace-pre-line">{data.answer}</div>
            {data.sources?.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-2">Referências</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {data.sources.map((s: AssistantSource) => (
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
                        <div className="w-20 h-28 bg-gray-700 rounded flex items-center justify-center text-xs text-gray-300">Sem pôster</n+                        </div>
                      )}
                      <div className="flex-1">
                        <Link href={`/movies/${s.id}`} className="text-white font-semibold hover:underline">
                          {s.title}
                        </Link>
                        <div className="text-sm text-gray-300">
                          {(s.release_date ? new Date(s.release_date).getFullYear() : "—")}{" "}
                          {typeof s.vote_average === "number" && ` • ${s.vote_average.toFixed(1)}`}
                        </div>
                        {s.overview && (
                          <p className="mt-1 text-sm text-gray-300 line-clamp-3">{s.overview}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}