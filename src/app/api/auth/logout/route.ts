import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });

  response.cookies.delete('user_id');
  response.cookies.delete('line_user_id');

  return response;
}
