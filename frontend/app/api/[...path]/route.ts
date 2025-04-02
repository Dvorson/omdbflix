import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000/api';

type PathParams = {
  path: string[];
}

export async function GET(
  request: NextRequest,
  { params }: { params: PathParams }
) {
  const path = params.path.join('/');
  const url = new URL(request.url);
  const fullUrl = `${BACKEND_URL}/${path}${url.search}`;
  
  try {
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Backend error (${response.status}): ${errorText}`);
      return NextResponse.json(
        { error: `Backend error: ${response.statusText || 'Unknown error'}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error proxying request to ${fullUrl}:`, errorMessage);
    return NextResponse.json(
      { error: `Failed to fetch data from backend: ${errorMessage}` },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: PathParams }
) {
  const path = params.path.join('/');
  const url = new URL(request.url);
  const fullUrl = `${BACKEND_URL}/${path}${url.search}`;
  
  try {
    const body = await request.json();
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Error proxying request to ${fullUrl}:`, error);
    return NextResponse.json(
      { error: 'Failed to post data to backend' },
      { status: 500 }
    );
  }
} 