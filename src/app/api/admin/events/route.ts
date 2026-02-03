import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import type { User } from '@/types/database';
import { getCurrentUserId } from '@/lib/auth';

interface CreateEventRequest {
  event_date: string;
  area: string;
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
