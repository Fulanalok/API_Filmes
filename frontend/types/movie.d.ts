export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path?: string | null;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  profile_path?: string | null;
}

export interface Video {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
}

export interface MovieResult {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  backdrop_path?: string | null;
  overview: string;
  vote_average?: number;
}

export interface SearchApiResponse {
  results: MovieResult[];
}

export interface MovieDetails {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
  genres: { id: number; name: string }[];
  runtime: number;
  credits: {
    cast: CastMember[];
    crew: CrewMember[];
  };
  videos: {
    results: Video[];
  };
  tagline?: string;
  images?: {
    backdrops?: { file_path: string; width: number; height: number }[];
    posters?: { file_path: string; width: number; height: number }[];
  };
  keywords?: {
    keywords?: { id: number; name: string }[];
  };
  recommendations?: {
    results: MovieResult[];
    total_pages?: number;
  };
  similar?: {
    results: MovieResult[];
  };
  external_ids?: {
    imdb_id?: string | null;
    facebook_id?: string | null;
    instagram_id?: string | null;
    twitter_id?: string | null;
  };
  release_dates?: {
    results?: { iso_3166_1: string; release_dates: { certification?: string; release_date?: string }[] }[];
  };
}
