import axios from "axios";
import { MovieResult, MovieDetails } from "@/types/movie";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001";

export interface ApiErrorResponse {
  message: string;
  details?: unknown;
}

export interface SearchApiResponse {
  results: MovieResult[];
  total_pages?: number;
  total_results?: number;
  page?: number;
}

export const searchMovies = async (
  query: string
): Promise<SearchApiResponse> => {
  if (!query.trim()) {
    return { results: [] };
  }
  try {
    const response = await axios.get<SearchApiResponse>(
      `${BACKEND_URL}/api/search/movie`,
      {
        params: { query },
      }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const errorData: ApiErrorResponse = error.response.data;
      throw new Error(
        errorData.message || `Erro do servidor (${error.response.status}).`
      );
    }
    throw new Error(
      "Não foi possível conectar ao servidor. Verifique sua conexão."
    );
  }
};

export const searchMoviesPage = async (
  query: string,
  page: number
): Promise<SearchApiResponse> => {
  try {
    const response = await axios.get<SearchApiResponse>(
      `${BACKEND_URL}/api/search/movie`,
      {
        params: { query, page },
      }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const errorData: ApiErrorResponse = error.response.data;
      throw new Error(
        errorData.message || `Erro do servidor (${error.response.status}).`
      );
    }
    throw new Error(
      "Não foi possível conectar ao servidor. Verifique sua conexão."
    );
  }
};

export interface CountryProviders {
  link?: string;
  flatrate?: { provider_id: number; provider_name: string; logo_path?: string | null }[];
  rent?: { provider_id: number; provider_name: string; logo_path?: string | null }[];
  buy?: { provider_id: number; provider_name: string; logo_path?: string | null }[];
}

export interface WatchProvidersResponse {
  results: { [countryCode: string]: CountryProviders };
}

export const getWatchProviders = async (
  id: number
): Promise<WatchProvidersResponse> => {
  try {
    const response = await axios.get<WatchProvidersResponse>(
      `${BACKEND_URL}/api/tmdb/movie/${id}/watch/providers`
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const errorData: ApiErrorResponse = error.response.data;
      throw new Error(
        errorData.message || `Erro do servidor (${error.response.status}).`
      );
    }
    throw new Error(
      "Não foi possível conectar ao servidor. Verifique sua conexão."
    );
  }
};

export const getMovieDetails = async (id: number): Promise<MovieDetails> => {
  try {
    const response = await axios.get<MovieDetails>(
      `${BACKEND_URL}/api/movie/${id}`
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const errorData: ApiErrorResponse = error.response.data;
      throw new Error(
        errorData.message || `Erro do servidor (${error.response.status}).`
      );
    }
    throw new Error(
      "Não foi possível conectar ao servidor. Verifique sua conexão."
    );
  }
};

export const getPopularMovies = async (): Promise<SearchApiResponse> => {
  try {
    const response = await axios.get<SearchApiResponse>(
      `${BACKEND_URL}/api/popular`
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const errorData: ApiErrorResponse = error.response.data;
      throw new Error(
        errorData.message || `Erro do servidor (${error.response.status}).`
      );
    }
    throw new Error(
      "Não foi possível conectar ao servidor. Verifique sua conexão."
    );
  }
};

export const getPopularMoviesPage = async (page: number): Promise<SearchApiResponse> => {
  try {
    const response = await axios.get<SearchApiResponse>(
      `${BACKEND_URL}/api/popular`,
      { params: { page } }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const errorData: ApiErrorResponse = error.response.data;
      throw new Error(
        errorData.message || `Erro do servidor (${error.response.status}).`
      );
    }
    throw new Error(
      "Não foi possível conectar ao servidor. Verifique sua conexão."
    );
  }
};
