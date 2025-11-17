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
}
