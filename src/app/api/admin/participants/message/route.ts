import { NextRequest, NextResponse } from 'next/server';
import { messagingApi } from '@line/bot-sdk';
import { requireAdmin } from '@/lib/auth';
import { logActivity } from '@/lib/activity-log';

const { MessagingApiClient } = messagingApi;

function getLineClient(): messagingApi.MessagingApiClient | null {
  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

  if (!channelAccessToken) {
    console.warn('LINE_CHANNEL_ACCESS_TOKEN is not set');
    return null;
  }

  return new MessagingApiClient({
    channelAccessToken,
  });
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const { lineUserIds, message } = body;

    if (!lineUserIds || !Array.isArray(lineUserIds) || lineUserIds.length === 0) {
      return NextResponse.json({ error: 'lineUserIds is required' }, { status: 400 });
    }

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return NextResponse.json({ error: 'message is required' }, { status: 400 });
    }

    const client = getLineClient();
    if (!client) {
      return NextResponse.json({ error: 'LINE client not configured' }, { status: 500 });
    }

    const results = { sent: 0, failed: 0, skipped: 0 };

    for (const lineUserId of lineUserIds) {
      if (!lineUserId) {
        results.skipped++;
        continue;
      }

      try {
        await client.pushMessage({
          to: lineUserId,
          messages: [
            {
              type: 'text',
              text: message.trim(),
            },
          ],
        });
        results.sent++;
        console.log(`[LINE] Admin message sent to user ${lineUserId}`);
      } catch (error) {
        console.error(`[LINE] Failed to send admin message to user ${lineUserId}:`, error);
        results.failed++;
      }
    }

    logActivity(admin.id, 'admin_message_send', {
      recipient_count: lineUserIds.length,
      message_preview: message.trim().substring(0, 100),
      results,
    });

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error('Error sending LINE messages:', error);
    if ((error as Error).message === 'Unauthorized' || (error as Error).message === 'Admin access required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
