"use client";

import { createClient } from '@/lib/supabase/client';
import { NextResponse } from 'next/server';
import type { EventType, EventData } from '@/lib/services/analytics-service';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { type, data } = await request.json() as { type: EventType; data: EventData };

    const { error } = await supabase
      .from('analytics_events')
      .insert({
        type,
        data,
        timestamp: new Date().toISOString(),
      });

    if (error) throw error;

    return NextResponse.json({ message: 'Event tracked successfully' });
  } catch (error) {
    console.error('Error tracking analytics event:', error);
    return NextResponse.json(
      { error: 'Failed to track event' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user.app_metadata.is_admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const days = parseInt(searchParams.get('days') || '7', 10);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let query = supabase
      .from('analytics_events')
      .select('*')
      .gte('timestamp', startDate.toISOString());

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}