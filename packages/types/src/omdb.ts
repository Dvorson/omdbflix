// OMDB API specific types

// OMDB movie search result
export interface OmdbSearchResult {
  Search: OmdbMovie[];
  totalResults: string;
  Response: string;
  Error?: string;
}

// OMDB movie basic info
export interface OmdbMovie {
  Title: string;
  Year: string;
  imdbID: string;
  Type: string;
  Poster: string;
}

// OMDB movie detailed info
export interface OmdbMovieDetail extends OmdbMovie {
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
  Ratings: { Source: string; Value: string }[];
  Metascore: string;
  imdbRating: string;
  imdbVotes: string;
  DVD?: string;
  BoxOffice?: string;
  Production?: string;
  Website?: string;
}

// OMDB raw search item (for type safety when handling raw API responses)
export interface OmdbRawSearchItem {
  Title?: string;
  Year?: string;
  imdbID: string;
  Type?: string;
  Poster?: string;
} 