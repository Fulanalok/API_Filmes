import Image from "next/image";
import React from "react";
import { MovieResult } from "@/types/movie";

interface MovieCardProps {
  movie: MovieResult;
  onClick: (movieId: number) => void;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie, onClick }) => {
  const imageUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
    : null;

  return (
    <div
      className="
        bg-gray-800 rounded-xl shadow-lg overflow-hidden
        transform transition duration-300 hover:scale-105 hover:shadow-xl
        cursor-pointer
      "
      onClick={() => onClick(movie.id)}>
      {imageUrl ? (
        <div className="relative w-full h-72">
          <Image
            src={imageUrl}
            alt={movie.title || movie.name || "Pôster"}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-contain rounded-t-xl"
            priority={false}
          />
        </div>
      ) : (
        <div className="w-full h-72 bg-gray-700 flex items-center justify-center text-gray-400 font-medium text-lg text-center p-4 rounded-t-xl">
          Imagem não disponível
        </div>
      )}
      <div className="p-5">
        <h2 className="text-xl font-bold text-white mb-2 truncate">
          {movie.title || movie.name}
        </h2>
        <p className="text-gray-300 text-sm line-clamp-3">
          {movie.overview || "Sinopse não disponível."}
        </p>
        {movie.vote_average !== undefined && (
          <div className="flex items-center mt-3 text-sm text-gray-200">
            <span className="text-yellow-500 mr-1">★</span>
            {movie.vote_average.toFixed(1)} / 10
          </div>
        )}
      </div>
    </div>
  );
};

export default MovieCard;
