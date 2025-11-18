import { useState } from "react";
import { useRouter } from "next/router";
import { useInfiniteQuery } from "@tanstack/react-query";
import type { InfiniteData } from "@tanstack/react-query";
import { searchMoviesPage, SearchApiResponse, getPopularMoviesPage } from "@/services/MovieApiService";
import Image from "next/image";
import Link from "next/link";
import { MovieResult } from "@/types/movie";
import MovieCard from "@/components/MovieCard";
import SearchBar from "@/components/SearchBar";

export default function Home() {
  const [query, setQuery] = useState("");
  const [enabledSearch, setEnabledSearch] = useState(false);
  const router = useRouter();

  const {
    data: searchPages,
    isLoading,
    isFetching,
    isError,
    error,
    hasNextPage: hasNextSearch,
    fetchNextPage: fetchNextSearch,
    isFetchingNextPage: isFetchingNextSearch,
  } = useInfiniteQuery<SearchApiResponse, Error>({
    queryKey: ["moviesSearch", query],
    queryFn: ({ pageParam = 1 }) => searchMoviesPage(query, pageParam as number),
    enabled: enabledSearch && query.trim() !== "",
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const totalPages = lastPage.total_pages ?? 1;
      const next = allPages.length + 1;
      return next <= totalPages ? next : undefined;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    retry: 3,
  });

  const {
    data: popularPages,
    isLoading: isLoadingPopular,
    isError: isErrorPopular,
    error: errorPopular,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<SearchApiResponse, Error>({
    queryKey: ["popularMovies"],
    queryFn: ({ pageParam = 1 }) => getPopularMoviesPage(pageParam as number),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const totalPages = lastPage.total_pages ?? 1;
      const next = allPages.length + 1;
      return next <= totalPages ? next : undefined;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    retry: 2,
  });

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!query.trim()) return;
    console.log("frontend: submit busca", { query });
    setEnabledSearch(true);
  };

  const handleMovieCardClick = (movieId: number) => {
    console.log("frontend: navegar para detalhes", { id: movieId });
    router.push(`/movies/${movieId}`);
  };

  const displayLoading = isLoading || isFetching;

  const movies: MovieResult[] = (searchPages?.pages || []).flatMap((p: SearchApiResponse) => p.results) || [];
  const popular: MovieResult[] = (popularPages?.pages || []).flatMap((p: SearchApiResponse) => p.results) || [];
  console.log("frontend: listas", { query, enabledSearch, movies: movies.length, popular: popular.length, loading: isLoading || isFetching });

  // Logs reativos para resultados da busca e populares (compatível com React Query v5)
  const pagesSearch = (searchPages as InfiniteData<SearchApiResponse> | undefined)?.pages || [];
  const lastSearch: SearchApiResponse | undefined = pagesSearch[pagesSearch.length - 1];
  const pagesPopular = (popularPages as InfiniteData<SearchApiResponse> | undefined)?.pages || [];
  const lastPopular: SearchApiResponse | undefined = pagesPopular[pagesPopular.length - 1];
  if (lastSearch || lastPopular) {
    console.log("frontend: estado", {
      query,
      search_pages: pagesSearch.length,
      search_last_results: Array.isArray(lastSearch?.results) ? lastSearch!.results.length : 0,
      popular_pages: pagesPopular.length,
      popular_last_results: Array.isArray(lastPopular?.results) ? lastPopular!.results.length : 0,
    });
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full">
        <div className="flex items-center justify-end mb-4">
          <Link href="/assistant" className="text-sm px-3 py-1 rounded-lg bg-green-600 text-white hover:bg-green-700 transition">Assistente</Link>
        </div>
        <h1 className="text-4xl font-extrabold text-white text-center mb-6">
          Encontre Seu Próximo Filme
        </h1>
        <SearchBar
          value={query}
          onChange={(val) => {
            setQuery(val);
            const disable = !val.trim();
            if (disable) {
              setEnabledSearch(false);
            } else {
              setEnabledSearch(true);
            }
            console.log("frontend: change", { value: val, enabledSearch: !disable });
          }}
          onSubmit={handleSearchSubmit}
          onDebouncedChange={(val) => {
            const ok = !!val.trim();
            if (ok) setEnabledSearch(true);
            console.log("frontend: debounced", { value: val, enabledSearch: ok });
          }}
          debounceMs={500}
          placeholder="Busque por filmes ou séries, ex: Barbie, Matrix..."
        />
        {!(enabledSearch && query.trim()) && (
          <div className="mt-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">Populares agora</h2>
            </div>
            {isErrorPopular && (
              <p className="text-red-500 text-center mb-4">{errorPopular?.message}</p>
            )}
            <div className="space-y-6">
              {(isLoadingPopular
                ? (Array.from({ length: 8 }, () => null) as (MovieResult | null)[])
                : (popular as (MovieResult | null)[])
              ).map((item, idx) => (
                <div
                  key={item?.id ?? idx}
                  className="rounded-2xl overflow-hidden cursor-pointer transition-transform duration-300 hover:scale-[1.01] shadow-lg"
                  onClick={() => item && handleMovieCardClick(item.id)}
                >
                  {item ? (
                    item.backdrop_path ? (
                      <div className="relative w-full h-44 sm:h-56 md:h-64 lg:h-72">
                        <Image
                          src={`https://image.tmdb.org/t/p/w780${item.backdrop_path}`}
                          alt={item.title || item.name || "Banner"}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 100vw"
                          className="object-cover"
                          priority={idx === 0}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <h3 className="text-white text-lg font-semibold truncate">
                            {item.title || item.name}
                          </h3>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-800 w-full h-44 sm:h-56 md:h-64 lg:h-72 flex items-center justify-center text-gray-300">
                        {item.title || item.name}
                      </div>
                    )
                  ) : (
                    <div className="bg-gray-800 w-full h-44 sm:h-56 md:h-64 lg:h-72 animate-pulse" />
                  )}
                </div>
              ))}
              {!isLoadingPopular && !isErrorPopular && (
                <div className="flex justify-center mt-4">
                  <button
                    onClick={() => {
                      console.log("frontend: carregar mais populares");
                      fetchNextPage();
                    }}
                    disabled={!hasNextPage || isFetchingNextPage}
                    className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {isFetchingNextPage ? "Carregando..." : hasNextPage ? "Carregar mais" : "Fim"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        {isError && (
          <p className="text-red-500 text-center mb-6 text-lg font-medium">
            Erro: {error?.message}
          </p>
        )}
        {movies.length === 0 &&
          !displayLoading &&
          !isError &&
          query.trim() &&
          enabledSearch && (
            <p className="text-center text-gray-600 dark:text-gray-400 text-lg">
              Nenhum resultado encontrado para{" "}
              <span className="font-semibold">{query}</span>.
            </p>
          )}
        {movies.length === 0 &&
          !displayLoading &&
          !isError &&
          !query.trim() &&
          !enabledSearch && (
            <p className="text-center text-gray-600 dark:text-gray-400 text-lg">
              Comece a buscar filmes ou séries para ver os resultados aqui!
            </p>
          )}
        {displayLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden animate-pulse"
              >
                <div className="w-full h-72 bg-gray-300 dark:bg-gray-700" />
                <div className="p-5 space-y-3">
                  <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-3/4" />
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full" />
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-5/6" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {movies.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                onClick={handleMovieCardClick}
              />
            ))}
          </div>
        )}
        {enabledSearch && query.trim() && !displayLoading && !isError && (
          <div className="flex justify-center mt-6">
            <button
              onClick={() => {
                console.log("frontend: carregar mais resultados", { query });
                fetchNextSearch();
              }}
              disabled={!hasNextSearch || isFetchingNextSearch}
              className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
            >
              {isFetchingNextSearch ? "Carregando..." : hasNextSearch ? "Carregar mais" : "Fim"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
