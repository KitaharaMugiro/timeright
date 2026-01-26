import { messagingApi } from '@line/bot-sdk';

const { MessagingApiClient } = messagingApi;

// Initialize LINE Messaging API client
function getLineClient(): messagingApi.MessagingApiClient | null {
  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

  if (!channelAccessToken) {
    console.warn('LINE_CHANNEL_ACCESS_TOKEN is not set. LINE notifications will be skipped.');
    return null;
  }

  return new MessagingApiClient({
    channelAccessToken,
  });
}

export interface MatchNotificationData {
  eventDate: string;
  area: string;
  restaurantName: string;
  restaurantUrl?: string | null;
  reservationName?: string | null;
  memberNames: string[];
}

/**
 * Send LINE push notification to a user about their match result
 */
export async function sendMatchNotification(
  lineUserId: string,
  data: MatchNotificationData
): Promise<boolean> {
  const client = getLineClient();

  if (!client) {
    console.log(`[LINE] Skipping notification for user ${lineUserId} - client not configured`);
    return false;
  }

  try {
    const eventDate = new Date(data.eventDate);
    const dateStr = eventDate.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const timeStr = eventDate.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const areaLabels: Record<string, string> = {
      shibuya: '渋谷',
      ebisu: '恵比寿',
      roppongi: '六本木',
      ginza: '銀座',
      shinjuku: '新宿',
    };
    const areaLabel = areaLabels[data.area] || data.area;

    // Build message text
    let message = `マッチングが確定しました！

【日時】${dateStr} ${timeStr}〜
【エリア】${areaLabel}
【お店】${data.restaurantName}`;

    if (data.restaurantUrl) {
      message += `\n${data.restaurantUrl}`;
    }

    if (data.reservationName) {
      message += `\n【予約名】${data.reservationName}`;
    }

    message += `\n\n【メンバー】\n${data.memberNames.join('\n')}`;

    message += `\n\n当日をお楽しみに！`;

    await client.pushMessage({
      to: lineUserId,
      messages: [
        {
          type: 'text',
          text: message,
        },
      ],
    });

    console.log(`[LINE] Notification sent to user ${lineUserId}`);
    return true;
  } catch (error) {
    console.error(`[LINE] Failed to send notification to user ${lineUserId}:`, error);
    return false;
  }
}

/**
 * Send match notifications to all members of a match
 */
export async function sendMatchNotificationsToMembers(
  members: Array<{ lineUserId: string | null; displayName: string }>,
  eventDate: string,
  area: string,
  restaurantName: string,
  restaurantUrl?: string | null,
  reservationName?: string | null
): Promise<{ sent: number; failed: number; skipped: number }> {
  const memberNames = members.map(m => m.displayName);
  const results = { sent: 0, failed: 0, skipped: 0 };

  for (const member of members) {
    if (!member.lineUserId) {
      results.skipped++;
      continue;
    }

    const success = await sendMatchNotification(member.lineUserId, {
      eventDate,
      area,
      restaurantName,
      restaurantUrl,
      reservationName,
      memberNames,
    });

    if (success) {
      results.sent++;
    } else {
      results.failed++;
    }
  }

  return results;
}
