import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';
import type { User, Guest, Gender } from '@/types/database';
import { getCurrentUserId } from '@/lib/auth';

interface CreateGuestRequest {
  display_name: string;
  gender: Gender;
  pair_with_guest_id?: string; // If provided, group with this guest
}

// POST - Create a new guest
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
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

    // Check event exists
    const { data: event } = await supabase
      .from('events')
      .select('id')
      .eq('id', eventId)
      .single();

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    const { display_name, gender, pair_with_guest_id }: CreateGuestRequest = await request.json();

    if (!display_name || !gender) {
      return NextResponse.json(
        { error: 'display_name and gender are required' },
        { status: 400 }
      );
    }

    let groupId: string;

    if (pair_with_guest_id) {
      // Get the group_id of the existing guest to pair with
      const { data: existingGuest } = await supabase
        .from('guests')
        .select('group_id')
        .eq('id', pair_with_guest_id)
        .eq('event_id', eventId)
        .single();

      if (!existingGuest) {
        return NextResponse.json(
          { error: 'Guest to pair with not found' },
          { status: 404 }
        );
      }

      groupId = (existingGuest as { group_id: string }).group_id;
    } else {
      // Create a new group
      groupId = uuidv4();
    }

    // Create guest
    const { data: guest, error: insertError } = await (supabase
      .from('guests') as any)
      .insert({
        event_id: eventId,
        display_name,
        gender,
        group_id: groupId,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert guest error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create guest' },
        { status: 500 }
      );
    }

    return NextResponse.json({ guest: guest as Guest });
  } catch (err) {
    console.error('Create guest error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a guest
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
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

    const { guest_id } = await request.json();

    if (!guest_id) {
      return NextResponse.json(
        { error: 'guest_id is required' },
        { status: 400 }
      );
    }

    // Delete guest
    const { error: deleteError } = await supabase
      .from('guests')
      .delete()
      .eq('id', guest_id)
      .eq('event_id', eventId);

    if (deleteError) {
      console.error('Delete guest error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete guest' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Delete guest error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
