import { useState } from "react";
import { useRouter } from "next/router";
import { useQuery } from "@tanstack/react-query";
import { searchMovies, SearchApiResponse, getPopularMovies } from "@/services/MovieApiService";
import Image from "next/image";
import { MovieResult } from "@/types/movie";
import MovieCard from "@/components/MovieCard";
import SearchBar from "@/components/SearchBar";

export default function Home() {
  const [query, setQuery] = useState("");
  const [enabledSearch, setEnabledSearch] = useState(false);
  const router = useRouter();

  const {
    data: moviesData,
    isLoading,
    isFetching,
    isError,
    error,
  } = useQuery<SearchApiResponse, Error>({
    queryKey: ["moviesSearch", query],
    queryFn: () => searchMovies(query),
    enabled: enabledSearch && query.trim() !== "",
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    retry: 3,
  });

  const {
    data: popularData,
    isLoading: isLoadingPopular,
    isError: isErrorPopular,
    error: errorPopular,
  } = useQuery<SearchApiResponse, Error>({
    queryKey: ["popularMovies"],
    queryFn: () => getPopularMovies(),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    retry: 2,
  });

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!query.trim()) return;
    setEnabledSearch(true);
  };

  const handleMovieCardClick = (movieId: number) => {
    router.push(`/movies/${movieId}`);
  };

  const displayLoading = isLoading || isFetching;

  const movies: MovieResult[] = moviesData?.results || [];
  const popular: MovieResult[] = popularData?.results || [];

  return (
    <div className="min-h-screen bg-black flex flex-col items-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full">
        <h1 className="text-4xl font-extrabold text-white text-center mb-6">
          Encontre Seu Próximo Filme
        </h1>
        <SearchBar
          value={query}
          onChange={(val) => {
            setQuery(val);
            if (!val.trim()) setEnabledSearch(false);
          }}
          onSubmit={handleSearchSubmit}
          onDebouncedChange={(val) => {
            if (val.trim()) setEnabledSearch(true);
          }}
          debounceMs={500}
          placeholder="Busque por filmes ou séries, ex: Barbie, Matrix..."
        />
        <div className="mt-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">Populares agora</h2>
          </div>
          {isErrorPopular && (
            <p className="text-red-500 text-center mb-4">{errorPopular?.message}</p>
          )}
          <div className="space-y-6">
            {(isLoadingPopular ? Array.from({ length: 6 }) : popular.slice(0, 6)).map((item, idx) => (
              <div
                key={item ? item.id : idx}
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
                        priority={false}
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
          </div>
        </div>
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
      </div>
    </div>
  );
}
