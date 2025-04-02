import React from 'react';
import { Metadata } from 'next';
import { getMovieDetails } from '../services/api';
import DetailClient from '../components/DetailClient';
import { MovieDetails } from '@repo/types';

type Params = {
  id: string;
}

// Define the PageProps interface
interface PageProps {
  params: { id: string };
}

export async function generateMetadata({ 
  params 
}: { 
  params: Params
}): Promise<Metadata> {
  const { id } = params;
  
  return {
    title: `Movie Details: ${id}`,
    openGraph: {
      images: [],
    },
  };
}

// Use the PageProps interface for the Page component
export default async function Page({ params }: PageProps) {
  const { id } = params;

  if (!id) {
    return <DetailClient error="Movie ID is required" />;
  }

  try {
    const movie = await getMovieDetails(id);
    return <DetailClient movie={movie} />;
  } catch (error) {
    console.error("Error fetching movie:", error);
    return <DetailClient error="Failed to load movie details" />;
  }
} 