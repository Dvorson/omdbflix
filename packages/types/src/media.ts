// Movie type for search results
export interface Movie {
  imdbID: string;
  Title: string;
  Year: string;
  Type: string;
  Poster: string;
}

// Movie details type for the detail page
export interface MovieDetails extends Movie {
  Rated?: string;
  Released?: string;
  Runtime?: string;
  Genre?: string;
  Director?: string;
  Writer?: string;
  Actors?: string;
  Plot?: string;
  Language?: string;
  Country?: string;
  Awards?: string;
  Ratings?: Rating[];
  Metascore?: string;
  imdbRating?: string;
  imdbVotes?: string;
  DVD?: string;
  BoxOffice?: string;
  Production?: string;
  Website?: string;
}

// Rating type for movie ratings
export interface Rating {
  Source: string;
  Value: string;
}

// Search result type from API
export interface SearchResult {
  Search: MovieDetails[]; // Use MovieDetails here for consistency if API returns full details
  totalResults: string;
  Response: string;
  Error?: string;
}

// Search params for filtering
export interface SearchParams {
  query: string;
  type?: string;
  year?: string;
  page?: number;
} 