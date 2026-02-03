import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { deleteSession } from '@/lib/auth';

export async function POST() {
  const response = NextResponse.json({ success: true });

  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session_id')?.value;
  if (sessionId) {
    await deleteSession(sessionId);
  }

  response.cookies.delete('session_id');
  response.cookies.delete('user_id');
  response.cookies.delete('line_user_id');

  return response;
}
