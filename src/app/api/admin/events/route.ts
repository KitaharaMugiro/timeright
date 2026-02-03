import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import type { User } from '@/types/database';
import { getCurrentUserId } from '@/lib/auth';

interface CreateEventRequest {
  event_date: string;
  area: string;
}

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

type EventTab = 'upcoming' | 'matched' | 'closed';

function getStartOfToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createServiceClient();

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', userId)
      .single();

    if (!userData?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const tabParam = searchParams.get('tab');
    const tab: EventTab = tabParam === 'matched' || tabParam === 'closed' ? tabParam : 'upcoming';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, parseInt(searchParams.get('pageSize') || String(DEFAULT_PAGE_SIZE), 10))
    );
    const offset = (page - 1) * pageSize;

    const today = getStartOfToday().toISOString();

    let eventsQuery = supabase
      .from('events')
      .select('id, event_date, area, status', { count: 'exact' });

    if (tab === 'upcoming') {
      eventsQuery = eventsQuery.eq('status', 'open').gte('event_date', today).order('event_date', { ascending: true });
    } else if (tab === 'matched') {
      eventsQuery = eventsQuery.eq('status', 'matched').gte('event_date', today).order('event_date', { ascending: false });
    } else {
      eventsQuery = eventsQuery.or(`status.eq.closed,event_date.lt.${today}`).order('event_date', { ascending: false });
    }

    const { data: events, count: totalCount, error } = await eventsQuery.range(offset, offset + pageSize - 1);

    if (error) {
      console.error('Error fetching events:', error);
      return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }

    const [upcomingCountRes, matchedCountRes, closedCountRes] = await Promise.all([
      supabase
        .from('events')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'open')
        .gte('event_date', today),
      supabase
        .from('events')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'matched')
        .gte('event_date', today),
      supabase
        .from('events')
        .select('id', { count: 'exact', head: true })
        .or(`status.eq.closed,event_date.lt.${today}`),
    ]);

    return NextResponse.json({
      events: events || [],
      pagination: {
        page,
        pageSize,
        totalCount: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / pageSize),
      },
      counts: {
        upcoming: upcomingCountRes.count || 0,
        matched: matchedCountRes.count || 0,
        closed: closedCountRes.count || 0,
      },
    });
  } catch (err) {
    console.error('Fetch events error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = await createServiceClient();

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    const user = userData as User | null;
    if (!user || !user.is_admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { event_date, area }: CreateEventRequest = await request.json();

    const { data: event, error } = await (supabase
      .from('events') as any)
      .insert({
        event_date,
        area,
        status: 'open',
      })
      .select()
      .single();

    if (error) {
      console.error('Create event error:', error);
      return NextResponse.json(
        { error: 'Failed to create event' },
        { status: 500 }
      );
    }

    return NextResponse.json({ event });
  } catch (err) {
    console.error('Create event error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
