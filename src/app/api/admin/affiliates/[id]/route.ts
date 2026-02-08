import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const supabase = await createServiceClient();

    // Get code details
    const { data: code, error: codeError } = await (supabase as any)
      .from('affiliate_codes')
      .select('*')
      .eq('id', id)
      .single();

    if (codeError || !code) {
      return NextResponse.json({ error: 'コードが見つかりません' }, { status: 404 });
    }

    // Get usage list with user details
    const { data: uses, error: usesError } = await (supabase as any)
      .from('affiliate_code_uses')
      .select('*, users(id, display_name, avatar_url, created_at)')
      .eq('affiliate_code_id', id)
      .order('created_at', { ascending: false });

    if (usesError) {
      console.error('Failed to fetch uses:', usesError);
    }

    return NextResponse.json({
      code,
      uses: uses || [],
    });
  } catch (err) {
    console.error('Admin affiliate detail GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const supabase = await createServiceClient();

    const updates: Record<string, unknown> = {};

    if (typeof body.is_active === 'boolean') {
      updates.is_active = body.is_active;
    }

    if (typeof body.name === 'string' && body.name.trim()) {
      updates.name = body.name.trim();
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: '更新する内容がありません' }, { status: 400 });
    }

    const { data: updated, error } = await (supabase as any)
      .from('affiliate_codes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update affiliate code:', error);
      return NextResponse.json({ error: '更新に失敗しました' }, { status: 500 });
    }

    return NextResponse.json({ code: updated });
  } catch (err) {
    console.error('Admin affiliate PATCH error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
