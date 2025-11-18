import { useRouter } from "next/router";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { getMovieDetails, getWatchProviders, WatchProvidersResponse } from "@/services/MovieApiService";
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

  const {
    data: providers,
  } = useQuery<WatchProvidersResponse, Error>({
    queryKey: ["watchProviders", movieId],
    queryFn: () => getWatchProviders(movieId as number),
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

  const runtimeStr = typeof movie.runtime === "number" && movie.runtime > 0
    ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m`
    : undefined;
  const recs = movie.recommendations?.results?.slice(0, 8) || [];
  const imdbUrl = movie.external_ids?.imdb_id ? `https://www.imdb.com/title/${movie.external_ids.imdb_id}/` : undefined;
  const certificationBR = movie.release_dates?.results?.find(r => r.iso_3166_1 === "BR")?.release_dates?.find(r => r.certification)?.certification;
  const brProviders = providers?.results?.BR;

  const translateProviderName = (name: string) => {
    let n = name;
    n = n.replace(/with ads/gi, "com anúncios");
    n = n.replace(/\bStandard\b/gi, "Padrão");
    n = n.replace(/\bBasic\b/gi, "Básico");
    n = n.replace(/\bPremium\b/gi, "Premium");
    return n;
  };

  const translateCharacter = (ch?: string) => {
    if (!ch) return "";
    let s = ch;
    s = s.replace(/\bYoung\b/gi, "Jovem");
    s = s.replace(/\bOld(er)?\b/gi, "Mais velho");
    s = s.replace(/\bAdult\b/gi, "Adulto");
    s = s.replace(/\bChild\b/gi, "Criança");
    s = s.replace(/\bTeen(ager)?\b/gi, "Adolescente");
    s = s.replace(/\bDetective\b/gi, "Detetive");
    s = s.replace(/\bPolice Officer\b/gi, "Policial");
    s = s.replace(/\bOfficer\b/gi, "Oficial");
    s = s.replace(/\bCaptain\b/gi, "Capitão");
    s = s.replace(/\bDoctor\b/gi, "Doutor");
    s = s.replace(/\bProfessor\b/gi, "Professor");
    s = s.replace(/\bTeacher\b/gi, "Professor(a)");
    s = s.replace(/\bStudent\b/gi, "Estudante");
    s = s.replace(/\bNurse\b/gi, "Enfermeiro(a)");
    s = s.replace(/\bDriver\b/gi, "Motorista");
    s = s.replace(/\bBoss\b/gi, "Chefe");
    s = s.replace(/\bManager\b/gi, "Gerente");
    s = s.replace(/\bAssistant\b/gi, "Assistente");
    s = s.replace(/\bJudge\b/gi, "Juiz(a)");
    s = s.replace(/\bLawyer\b/gi, "Advogado(a)");
    s = s.replace(/\bSoldier\b/gi, "Soldado");
    s = s.replace(/\bAgent\b/gi, "Agente");
    s = s.replace(/\bHimself\b/gi, "Ele mesmo");
    s = s.replace(/\bHerself\b/gi, "Ela mesma");
    s = s.replace(/\bVoice\b/gi, "Voz");
    s = s.replace(/\bNarrator\b/gi, "Narrador(a)");
    s = s.replace(/\buncredited\b/gi, "não creditado");
    s = s.replace(/\bAdditional Voices\b/gi, "Vozes adicionais");
    s = s.replace(/\bParamedic\b/gi, "Paramédico(a)");
    s = s.replace(/\bGuard\b/gi, "Guarda");
    s = s.replace(/\bSecurity\b/gi, "Segurança");
    s = s.replace(/\bCrew\b/gi, "Equipe");
    s = s.replace(/\bMember\b/gi, "Membro");
    s = s.replace(/\bShopkeeper\b/gi, "Lojista");
    s = s.replace(/\bClerk\b/gi, "Atendente");
    s = s.replace(/\bReporter\b/gi, "Repórter");
    s = s.replace(/\bPhotographer\b/gi, "Fotógrafo(a)");
    s = s.replace(/\bWaiter\b/gi, "Garçom/Garçonete");
    s = s.replace(/\bChef\b/gi, "Chef");
    s = s.replace(/\bCook\b/gi, "Cozinheiro(a)");
    s = s.replace(/\bBartender\b/gi, "Barman");
    s = s.replace(/\bBouncer\b/gi, "Segurança");
    s = s.replace(/\bDriver\b/gi, "Motorista");
    s = s.replace(/\bPriest\b/gi, "Padre");
    s = s.replace(/\bMonk\b/gi, "Monge");
    s = s.replace(/\bNun\b/gi, "Freira");
    s = s.replace(/\bKing\b/gi, "Rei");
    s = s.replace(/\bQueen\b/gi, "Rainha");
    s = s.replace(/\bPrince\b/gi, "Príncipe");
    s = s.replace(/\bPrincess\b/gi, "Princesa");
    s = s.replace(/\bMayor\b/gi, "Prefeito(a)");
    s = s.replace(/\bGovernor\b/gi, "Governador(a)");
    s = s.replace(/\bPresident\b/gi, "Presidente");
    s = s.replace(/\bScientist\b/gi, "Cientista");
    s = s.replace(/\bEngineer\b/gi, "Engenheiro(a)");
    s = s.replace(/\bMechanic\b/gi, "Mecânico(a)");
    s = s.replace(/\bFarmer\b/gi, "Agricultor(a)");
    s = s.replace(/\bFisherman\b/gi, "Pescador(a)");
    s = s.replace(/\bPilot\b/gi, "Piloto");
    s = s.replace(/\bSteward(ess)?\b/gi, "Comissário(a)");
    s = s.replace(/\bBanker\b/gi, "Banqueiro(a)");
    s = s.replace(/\bThief\b/gi, "Ladrão/Ladraa");
    s = s.replace(/\bRobber\b/gi, "Assaltante");
    s = s.replace(/\bMurderer\b/gi, "Assassino(a)");
    s = s.replace(/\bKiller\b/gi, "Assassino(a)");
    s = s.replace(/\bHitman\b/gi, "Matador");
    s = s.replace(/\bGangster\b/gi, "Gângster");
    s = s.replace(/\bCriminal\b/gi, "Criminoso(a)");
    s = s.replace(/\bVictim\b/gi, "Vítima");
    s = s.replace(/\bWitness\b/gi, "Testemunha");
    s = s.replace(/\bSurgeon\b/gi, "Cirurgião(ã)");
    s = s.replace(/\bParamedic\b/gi, "Paramédico(a)");
    s = s.replace(/\bFirefighter\b/gi, "Bombeiro(a)");
    s = s.replace(/\bCop\b/gi, "Policial");
    s = s.replace(/\bSheriff\b/gi, "Xerife");
    s = s.replace(/\bDeputy\b/gi, "Deputado(a)");
    s = s.replace(/\bColonel\b/gi, "Coronel");
    s = s.replace(/\bGeneral\b/gi, "General");
    s = s.replace(/\bSergeant\b/gi, "Sargento");
    s = s.replace(/\bLieutenant\b/gi, "Tenente");
    s = s.replace(/\bPrivate\b/gi, "Soldado");
    s = s.replace(/\bCommander\b/gi, "Comandante");
    s = s.replace(/\bPilot\b/gi, "Piloto");
    s = s.replace(/\bAttendant\b/gi, "Atendente");
    s = s.replace(/\bAnnouncer\b/gi, "Locutor(a)");
    s = s.replace(/\bHost\b/gi, "Apresentador(a)");
    s = s.replace(/\bPresenter\b/gi, "Apresentador(a)");
    s = s.replace(/\bTV\b/gi, "TV");
    s = s.replace(/\bRadio\b/gi, "Rádio");
    s = s.replace(/\bShop Owner\b/gi, "Dono(a) da loja");
    s = s.replace(/\bStore Owner\b/gi, "Dono(a) da loja");
    s = s.replace(/\bFather\b/gi, "Pai");
    s = s.replace(/\bMother\b/gi, "Mãe");
    s = s.replace(/\bSon\b/gi, "Filho");
    s = s.replace(/\bDaughter\b/gi, "Filha");
    s = s.replace(/\bBrother\b/gi, "Irmão");
    s = s.replace(/\bSister\b/gi, "Irmã");
    s = s.replace(/\bGrandfather\b/gi, "Avô");
    s = s.replace(/\bGrandmother\b/gi, "Avó");
    s = s.replace(/\bHusband\b/gi, "Marido");
    s = s.replace(/\bWife\b/gi, "Esposa");
    s = s.replace(/\bFiancé(e)?\b/gi, "Noivo(a)");
    s = s.replace(/\bBoyfriend\b/gi, "Namorado");
    s = s.replace(/\bGirlfriend\b/gi, "Namorada");
    s = s.replace(/\bNeighbor\b/gi, "Vizinho(a)");
    s = s.replace(/\bRoommate\b/gi, "Companheiro(a) de quarto");
    s = s.replace(/\bLandlord\b/gi, "Proprietário(a)");
    s = s.replace(/\bJanitor\b/gi, "Zelador(a)");
    s = s.replace(/\bCoach\b/gi, "Treinador(a)");
    s = s.replace(/\bReferee\b/gi, "Árbitro(a)");
    s = s.replace(/\bPlayer\b/gi, "Jogador(a)");
    s = s.replace(/\bFan\b/gi, "Fã");
    s = s.replace(/\bSpectator\b/gi, "Espectador(a)");
    s = s.replace(/\bAnniversary\b/gi, "Aniversário");
    s = s.replace(/\bWedding\b/gi, "Casamento");
    s = s.replace(/\bBride\b/gi, "Noiva");
    s = s.replace(/\bGroom\b/gi, "Noivo");
    s = s.replace(/\bOfficer\b/gi, "Oficial");
    s = s.replace(/\buncredited\b/gi, "não creditado");
    return s;
  };

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
              {runtimeStr && ` | Duração: ${runtimeStr}`}
            </p>
            {(certificationBR || imdbUrl) && (
              <div className="flex flex-wrap gap-4 text-sm text-gray-300">
                {certificationBR && (<span>Classificação (BR): {certificationBR}</span>)}
                {imdbUrl && (<a href={imdbUrl} target="_blank" rel="noreferrer" className="text-green-400 hover:underline">IMDb</a>)}
              </div>
            )}

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


            {brProviders && (
              <div>
                <h3 className="text-lg font-bold text-gray-200 mb-2">Onde assistir (BR)</h3>
                <div className="flex flex-col gap-2 text-sm">
                  {brProviders.flatrate && brProviders.flatrate.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-gray-300">Streaming:</span>
                      {brProviders.flatrate.map(p => (
                        <div key={p.provider_id} className="flex items-center gap-2">
                          {p.logo_path ? (
                            <Image src={`https://image.tmdb.org/t/p/w45${p.logo_path}`} alt={translateProviderName(p.provider_name)} width={24} height={24} />
                          ) : null}
                          <span className="text-gray-200">{translateProviderName(p.provider_name)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {brProviders.rent && brProviders.rent.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-gray-300">Alugar:</span>
                      {brProviders.rent.map(p => (
                        <span key={p.provider_id} className="text-gray-200">{translateProviderName(p.provider_name)}</span>
                      ))}
                    </div>
                  )}
                  {brProviders.buy && brProviders.buy.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-gray-300">Comprar:</span>
                      {brProviders.buy.map(p => (
                        <span key={p.provider_id} className="text-gray-200">{translateProviderName(p.provider_name)}</span>
                      ))}
                    </div>
                  )}
                </div>
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
                        {translateCharacter(actor.character)}
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

            

            {recs.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-bold text-gray-200 mb-3">Recomendações</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {recs.map((r) => (
                    <div key={r.id} className="cursor-pointer" onClick={() => router.push(`/movies/${r.id}`)}>
                      <div className="relative w-full h-48 bg-gray-700 rounded overflow-hidden">
                        {r.poster_path ? (
                          <Image src={`https://image.tmdb.org/t/p/w300${r.poster_path}`} alt={r.title || r.name || "Pôster"} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">Sem pôster</div>
                        )}
                      </div>
                      <div className="mt-2 text-sm text-gray-200 truncate">{r.title || r.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {movie.similar?.results && movie.similar.results.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-bold text-gray-200 mb-3">Títulos semelhantes</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {movie.similar.results.slice(0, 8).map((r) => (
                    <div key={r.id} className="cursor-pointer" onClick={() => router.push(`/movies/${r.id}`)}>
                      <div className="relative w-full h-48 bg-gray-700 rounded overflow-hidden">
                        {r.poster_path ? (
                          <Image src={`https://image.tmdb.org/t/p/w300${r.poster_path}`} alt={r.title || r.name || "Pôster"} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">Sem pôster</div>
                        )}
                      </div>
                      <div className="mt-2 text-sm text-gray-200 truncate">{r.title || r.name}</div>
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