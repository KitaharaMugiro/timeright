import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';

const DEFAULT_PAGE_SIZE = 30;
const MAX_PAGE_SIZE = 100;

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const supabase = await createServiceClient();
    const searchParams = request.nextUrl.searchParams;

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, parseInt(searchParams.get('pageSize') || String(DEFAULT_PAGE_SIZE), 10))
    );
    const search = searchParams.get('search')?.trim() || '';

    // Get users (excluding admins)
    let usersQuery = supabase
      .from('users')
      .select('id, display_name, avatar_url, gender, birth_date, job, subscription_status, member_stage, is_identity_verified, line_user_id, created_at', { count: 'exact' })
      .eq('is_admin', false);

    if (search) {
      usersQuery = usersQuery.or(`display_name.ilike.%${search}%,job.ilike.%${search}%`);
    }

    const { data: users, error: usersError, count } = await usersQuery;

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    if (!users || users.length === 0) {
      return NextResponse.json({
        users: [],
        pagination: { page, pageSize, totalCount: 0, totalPages: 0 },
      });
    }

    const userIds = users.map(u => u.id);

    // Fetch participations and reviews concurrently
    const [{ data: participations }, { data: reviews }] = await Promise.all([
      supabase
        .from('participations')
        .select('user_id, created_at, status')
        .in('user_id', userIds),
      supabase
        .from('reviews')
        .select('reviewer_id, created_at')
        .in('reviewer_id', userIds),
    ]);

    // Build maps
    const lastActivityMap: Record<string, string> = {};
    const participationCountMap: Record<string, number> = {};
    const cancelCountMap: Record<string, number> = {};

    participations?.forEach(p => {
      if (!lastActivityMap[p.user_id] || p.created_at > lastActivityMap[p.user_id]) {
        lastActivityMap[p.user_id] = p.created_at;
      }
      participationCountMap[p.user_id] = (participationCountMap[p.user_id] || 0) + 1;
      if (p.status === 'canceled') {
        cancelCountMap[p.user_id] = (cancelCountMap[p.user_id] || 0) + 1;
      }
    });

    reviews?.forEach(r => {
      if (!lastActivityMap[r.reviewer_id] || r.created_at > lastActivityMap[r.reviewer_id]) {
        lastActivityMap[r.reviewer_id] = r.created_at;
      }
    });

    // Merge and sort by last activity (most recent first)
    const usersWithActivity = users.map(user => ({
      ...user,
      last_activity_at: lastActivityMap[user.id] || user.created_at,
      participation_count: participationCountMap[user.id] || 0,
      cancel_count: cancelCountMap[user.id] || 0,
    }));

    usersWithActivity.sort((a, b) =>
      new Date(b.last_activity_at).getTime() - new Date(a.last_activity_at).getTime()
    );

    // Paginate after sorting
    const totalCount = usersWithActivity.length;
    const offset = (page - 1) * pageSize;
    const paginatedUsers = usersWithActivity.slice(offset, offset + pageSize);

    return NextResponse.json({
      users: paginatedUsers,
      pagination: {
        page,
        pageSize,
        totalCount: count ?? totalCount,
        totalPages: Math.ceil((count ?? totalCount) / pageSize),
      },
    });
  } catch (error) {
    console.error('Error in admin users API:', error);
    if ((error as Error).message === 'Unauthorized' || (error as Error).message === 'Admin access required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
