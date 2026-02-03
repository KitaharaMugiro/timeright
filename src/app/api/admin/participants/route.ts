import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { EventStatus } from '@/types/database';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const VALID_STATUSES: EventStatus[] = ['open', 'matched', 'closed'];

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    // Pagination params
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, parseInt(searchParams.get('pageSize') || String(DEFAULT_PAGE_SIZE), 10))
    );
    const offset = (page - 1) * pageSize;

    // Filter params
    const statusParam = searchParams.get('status');
    const status: EventStatus | null = statusParam && VALID_STATUSES.includes(statusParam as EventStatus)
      ? (statusParam as EventStatus)
      : null;
    const months = parseInt(searchParams.get('months') || '3', 10); // Default: last 3 months

    // Calculate date range
    const fromDate = new Date();
    fromDate.setMonth(fromDate.getMonth() - months);

    // Build events query with filters
    let eventsQuery = supabase
      .from('events')
      .select('id, event_date, area, status', { count: 'exact' })
      .gte('event_date', fromDate.toISOString())
      .order('event_date', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (status) {
      eventsQuery = eventsQuery.eq('status', status);
    }

    const { data: events, error: eventsError, count: totalCount } = await eventsQuery;

    if (eventsError) {
      console.error('Error fetching events:', eventsError);
      return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }

    // Return events list only (participants loaded on demand)
    const result = events?.map(event => ({
      event,
      participantCount: 0, // Will be fetched separately
    }));

    // Get participant counts for these events
    if (events && events.length > 0) {
      const eventIds = events.map(e => e.id);
      const { data: counts } = await supabase
        .from('participations')
        .select('event_id, count:count()')
        .in('event_id', eventIds);

      const countMap: Record<string, number> = {};
      counts?.forEach((row: { event_id: string; count: number | null }) => {
        if (row.event_id) {
          countMap[row.event_id] = Number(row.count || 0);
        }
      });

      result?.forEach(r => {
        r.participantCount = countMap[r.event.id] || 0;
      });
    }

    return NextResponse.json({
      events: result,
      pagination: {
        page,
        pageSize,
        totalCount: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / pageSize),
      },
    });
  } catch (error) {
    console.error('Error in participants API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
