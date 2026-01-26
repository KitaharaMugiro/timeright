import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { encodeReferralCode } from '@/lib/referral';

export async function GET() {
  try {
    const user = await requireAuth();

    const referralCode = encodeReferralCode(user.id);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://timeright.com';
    const referralUrl = `${baseUrl}?ref=${referralCode}`;

    return NextResponse.json({
      referralCode,
      referralUrl,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
