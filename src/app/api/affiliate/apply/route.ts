import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth();
    const { code }: { code: string } = await request.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'コードを入力してください' },
        { status: 400 }
      );
    }

    const normalized = code.trim().toUpperCase();

    if (!/^[A-Z0-9]{8}$/.test(normalized)) {
      return NextResponse.json(
        { error: 'アフィリエイトコードは8文字の英数字です' },
        { status: 400 }
      );
    }

    const supabase = await createServiceClient();

    // Find the affiliate code
    const { data: affiliateCode, error: findError } = await (supabase as any)
      .from('affiliate_codes')
      .select('id, code, name, is_active')
      .eq('code', normalized)
      .single();

    if (findError || !affiliateCode) {
      return NextResponse.json(
        { error: 'このコードは見つかりません' },
        { status: 404 }
      );
    }

    if (!affiliateCode.is_active) {
      return NextResponse.json(
        { error: 'このコードは現在無効です' },
        { status: 400 }
      );
    }

    // Check if user already used this code
    const { data: existingUse } = await (supabase as any)
      .from('affiliate_code_uses')
      .select('id')
      .eq('affiliate_code_id', affiliateCode.id)
      .eq('user_id', userId)
      .single();

    if (existingUse) {
      return NextResponse.json(
        { error: 'このコードは既に適用済みです' },
        { status: 400 }
      );
    }

    // Record the use
    const { error: insertError } = await (supabase as any)
      .from('affiliate_code_uses')
      .insert({
        affiliate_code_id: affiliateCode.id,
        user_id: userId,
      });

    if (insertError) {
      console.error('Failed to insert affiliate code use:', insertError);
      return NextResponse.json(
        { error: 'コードの適用に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      codeName: affiliateCode.name,
    });
  } catch (err) {
    console.error('Affiliate apply error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
