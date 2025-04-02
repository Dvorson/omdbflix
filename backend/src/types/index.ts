// SQLite database types
export interface DBUser {
  id: number;
  email: string;
  password: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface DBFavorite {
  id: number;
  user_id: number;
  movie_id: string;
  created_at: string;
}

// Custom Auth Types
export interface JwtPayload {
  id: number;
}

// API Response Types
export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: {
    id: number;
    name: string;
    email: string;
    favorites?: string[];
  };
  message?: string;
}

export interface FavoritesResponse {
  success: boolean;
  favorites?: string[];
  message?: string;
}

// Movie API Types
export interface MovieSearchResponse {
  Search: MovieResult[];
  totalResults: string;
  Response: string;
  Error?: string;
}

export interface MovieResult {
  Title: string;
  Year: string;
  imdbID: string;
  Type: string;
  Poster: string;
}

export interface MovieDetails {
  Title: string;
  Year: string;
  Rated: string;
  Released: string;
  Runtime: string;
  Genre: string;
  Director: string;
  Writer: string;
  Actors: string;
  Plot: string;
  Language: string;
  Country: string;
  Awards: string;
  Poster: string;
  Ratings: { Source: string; Value: string }[];
  Metascore: string;
  imdbRating: string;
  imdbVotes: string;
  imdbID: string;
  Type: string;
  DVD?: string;
  BoxOffice?: string;
  Production?: string;
  Website?: string;
  Response: string;
  Error?: string;
} 