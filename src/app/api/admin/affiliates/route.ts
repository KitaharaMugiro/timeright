import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';
import { generateAffiliateCode } from '@/lib/utils';

export async function GET() {
  try {
    await requireAdmin();
    const supabase = await createServiceClient();

    // Get all affiliate codes with usage counts
    const { data: codes, error } = await (supabase as any)
      .from('affiliate_codes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch affiliate codes:', error);
      return NextResponse.json({ error: 'Failed to fetch codes' }, { status: 500 });
    }

    // Get usage counts for each code
    const codesWithCounts = await Promise.all(
      (codes || []).map(async (code: any) => {
        const { count } = await (supabase as any)
          .from('affiliate_code_uses')
          .select('*', { count: 'exact', head: true })
          .eq('affiliate_code_id', code.id);

        return {
          ...code,
          use_count: count || 0,
        };
      })
    );

    return NextResponse.json({ codes: codesWithCounts });
  } catch (err) {
    console.error('Admin affiliates GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const { name, code: manualCode }: { name: string; code?: string } = await request.json();

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: '名前を入力してください' }, { status: 400 });
    }

    const supabase = await createServiceClient();
    let code = manualCode?.trim().toUpperCase();

    if (code) {
      // Validate manual code
      if (!/^[A-Z0-9]{8}$/.test(code)) {
        return NextResponse.json(
          { error: 'コードは8文字の英数字である必要があります' },
          { status: 400 }
        );
      }

      // Check uniqueness
      const { data: existing } = await (supabase as any)
        .from('affiliate_codes')
        .select('id')
        .eq('code', code)
        .single();

      if (existing) {
        return NextResponse.json(
          { error: 'このコードは既に使用されています' },
          { status: 400 }
        );
      }
    } else {
      // Auto-generate unique code
      let attempts = 0;
      while (attempts < 10) {
        code = generateAffiliateCode();
        const { data: existing } = await (supabase as any)
          .from('affiliate_codes')
          .select('id')
          .eq('code', code)
          .single();

        if (!existing) break;
        attempts++;
      }

      if (attempts >= 10) {
        return NextResponse.json(
          { error: 'コードの生成に失敗しました。再度お試しください' },
          { status: 500 }
        );
      }
    }

    const { data: newCode, error } = await (supabase as any)
      .from('affiliate_codes')
      .insert({ code, name: name.trim() })
      .select()
      .single();

    if (error) {
      console.error('Failed to create affiliate code:', error);
      return NextResponse.json({ error: 'コードの作成に失敗しました' }, { status: 500 });
    }

    return NextResponse.json({ code: newCode });
  } catch (err) {
    console.error('Admin affiliates POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
