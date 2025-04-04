"use client";

import { createClient } from '@/lib/supabase/client';
import { NextResponse } from 'next/server';
import { normalizeSearchTerm } from '@/lib/utils/search';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json([]);
    }

    const normalizedQuery = normalizeSearchTerm(query);
    const supabase = createClient();

    const { data, error } = await supabase
      .from('search_suggestions')
      .select('term, frequency')
      .ilike('term', `${normalizedQuery}%`)
      .order('frequency', { ascending: false })
      .limit(5);

    if (error) throw error;

    return NextResponse.json(data.map(item => item.term));
  } catch (error) {
    console.error('Error fetching search suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suggestions' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { term } = await request.json();
    const normalizedTerm = normalizeSearchTerm(term);
    const supabase = createClient();

    const { error } = await supabase
      .from('search_suggestions')
      .upsert({
        term: normalizedTerm,
        frequency: 1,
        last_searched: new Date().toISOString(),
      }, {
        onConflict: 'term',
        ignoreDuplicates: false,
      });

    if (error) throw error;

    return NextResponse.json({ message: 'Search term recorded' });
  } catch (error) {
    console.error('Error recording search term:', error);
    return NextResponse.json(
      { error: 'Failed to record search term' },
      { status: 500 }
    );
  }
}