import { useRouter } from "next/router";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { getMovieDetails } from "@/services/MovieApiService";
import { MovieDetails } from "@/types/movie";

export default function MovieDetailsPage() {
  const router = useRouter();
  const { id } = router.query;

  const movieId = typeof id === "string" ? parseInt(id, 10) : undefined;

  const {
    data: movie,
    isLoading,
    isError,
    error,
  } = useQuery<MovieDetails, Error>({
    queryKey: ["movieDetails", movieId],
    queryFn: () => getMovieDetails(movieId as number),
    enabled: !!movieId,
    staleTime: 1000 * 60 * 60,
    retry: 2,
  });

  if (router.isFallback || isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-xl text-gray-700 dark:text-gray-300">
          Carregando detalhes do filme...
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center flex-col p-4 text-center">
        <p className="text-xl text-red-600 mb-4">
          Erro ao carregar os detalhes do filme.
        </p>
        <p className="text-gray-300">{error?.message}</p>
        <button
          onClick={() => router.back()}
          className="mt-6 bg-green-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-green-700 transition duration-300">
          Voltar para a busca
        </button>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center flex-col p-4 text-center">
        <p className="text-xl text-gray-700 dark:text-gray-300 mb-4">
          Filme/Série não encontrado(a).
        </p>
        <button
          onClick={() => router.back()}
          className="mt-6 bg-green-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-green-700 transition duration-300">
          Voltar para a busca
        </button>
      </div>
    );
  }

  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : null;

  const director = movie.credits?.crew.find(
    (member) => member.job === "Director"
  );

  const youtubeTrailers = movie.videos?.results.filter(
    (v) => v.site === "YouTube" && v.type === "Trailer"
  );

  return (
    <div className="min-h-screen bg-black text-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto bg-gray-800 rounded-xl shadow-xl overflow-hidden p-6 md:p-10">
        <button
          onClick={() => router.back()}
          className="mb-8 inline-flex items-center text-green-600 hover:text-green-800 transition duration-200 text-lg font-medium">
          <svg
            className="w-6 h-6 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          Voltar para a busca
        </button>

        <div className="md:flex md:space-x-10">
          <div className="md:flex-shrink-0 mb-8 md:mb-0">
            {posterUrl ? (
              <div className="relative w-full md:w-80 h-96 rounded-lg overflow-hidden shadow-lg bg-gray-700 flex items-center justify-center">
                <Image
                  src={posterUrl}
                  alt={movie.title || "Pôster do filme"}
                  fill
                  sizes="(max-width: 768px) 100vw, 320px"
                  className="object-contain rounded-lg"
                  priority
                />
              </div>
            ) : (
              <div className="w-full md:w-80 h-96 bg-gray-700 flex items-center justify-center text-gray-400 text-lg rounded-lg shadow-lg">
                Imagem não disponível
              </div>
            )}
          </div>

          <div className="flex-grow space-y-6">
            <h1 className="text-4xl font-extrabold text-white leading-tight">
              {movie.title}
            </h1>
            {movie.tagline && (
              <p className="text-gray-400 italic text-xl -mt-3">
                {movie.tagline}
              </p>
            )}
            <p className="text-gray-300 text-lg">
              {movie.release_date &&
                `Lançamento: ${new Date(movie.release_date).getFullYear()}`}
              {movie.runtime && ` | Duração: ${movie.runtime} min`}
            </p>

            <div className="flex items-center text-xl text-gray-700 dark:text-gray-200">
              <span className="text-yellow-500 mr-2">★</span>
              <span className="font-semibold">
                {movie.vote_average.toFixed(1)}
              </span>{" "}
              / 10
            </div>

            {movie.genres && movie.genres.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-gray-200 mb-2">
                  Gêneros:
                </h3>
                <div className="flex flex-wrap gap-2">
                  {movie.genres.map((genre) => (
                    <span
                      key={genre.id}
                      className="bg-green-200 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
                      {genre.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {movie.overview && (
              <div>
                <h3 className="text-lg font-bold text-gray-200 mb-2">
                  Sinopse:
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  {movie.overview}
                </p>
              </div>
            )}

            {movie.credits?.cast && movie.credits.cast.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold text-white mb-3">
                  Elenco Principal
                </h2>
                <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                  {movie.credits.cast.slice(0, 6).map((actor) => (
                    <div
                      key={actor.id}
                      className="flex flex-col items-center w-24 text-center">
                      {actor.profile_path ? (
                        <Image
                          src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`}
                          alt={actor.name}
                          width={80}
                          height={80}
                          className="w-20 h-20 rounded-full object-cover mb-1 shadow-md"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-gray-600 flex items-center justify-center mb-1 text-xs text-gray-400 shadow-md">
                          Sem foto
                        </div>
                      )}
                      <span className="text-xs font-semibold text-gray-200">
                        {actor.name}
                      </span>
                      <span className="text-xs text-gray-400">
                        {actor.character}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {director && (
              <div>
                <h3 className="text-lg font-bold text-gray-200 mb-2">
                  Diretor:
                </h3>
                <div className="flex items-center gap-4">
                  {director.profile_path ? (
                    <Image
                      src={`https://image.tmdb.org/t/p/w185${director.profile_path}`}
                      alt={director.name}
                      width={60}
                      height={60}
                      className="w-16 h-16 rounded-full object-cover shadow-md"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-600 flex items-center justify-center text-xs text-gray-400 shadow-md">
                      Sem foto
                    </div>
                  )}
                  <span className="text-lg text-gray-200 font-semibold">
                    {director.name}
                  </span>
                </div>
              </div>
            )}

            {youtubeTrailers && youtubeTrailers.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-bold text-gray-200 mb-4">
                  Trailers:
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {youtubeTrailers.slice(0, 2).map((video) => (
                    <div key={video.id} className="relative pt-[56.25%]">
                      <iframe
                        className="absolute top-0 left-0 w-full h-full rounded-lg shadow-lg"
                        src={`https://www.youtube.com/embed/${video.key}`}
                        title={video.name}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen></iframe>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
