import { messagingApi } from '@line/bot-sdk';
import { getAreaLabel } from '@/lib/utils';

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

    const areaLabel = getAreaLabel(data.area);

    // Build message text
    const message = `マッチングが確定しました！

【日時】${dateStr} ${timeStr}〜
【エリア】${areaLabel}
詳細はアプリをご確認ください。

【当日の流れ】
① 店に行く (お店のURLや予約名はアプリ内に記載)
↓
② みんなが集まったら自己紹介
↓
③ 話題に困ったらゲームをしよう！ (アプリに当日だけ表示されます)
↓
④ 仲が深まったら連絡先などを交換しましょう

当日をお楽しみに！`;

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
  members: Array<{ lineUserId: string | null }>,
  eventDate: string,
  area: string,
  restaurantName: string,
  restaurantUrl?: string | null,
  reservationName?: string | null
): Promise<{ sent: number; failed: number; skipped: number }> {
  const validMembers = members.filter((m): m is { lineUserId: string } => !!m.lineUserId);
  const skipped = members.length - validMembers.length;

  const settled = await Promise.allSettled(
    validMembers.map((member) =>
      sendMatchNotification(member.lineUserId, {
        eventDate,
        area,
        restaurantName,
        restaurantUrl,
        reservationName,
      })
    )
  );

  let sent = 0;
  let failed = 0;
  for (const result of settled) {
    if (result.status === 'fulfilled' && result.value) {
      sent++;
    } else {
      failed++;
    }
  }

  return { sent, failed, skipped };
}

export interface CancellationNotificationData {
  eventDate: string;
  area: string;
}

/**
 * Send LINE push notification to a user about event cancellation
 */
export async function sendCancellationNotification(
  lineUserId: string,
  data: CancellationNotificationData
): Promise<boolean> {
  const client = getLineClient();

  if (!client) {
    console.log(`[LINE] Skipping cancellation notification for user ${lineUserId} - client not configured`);
    return false;
  }

  try {
    const eventDate = new Date(data.eventDate);
    const dateStr = eventDate.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const areaLabel = getAreaLabel(data.area);

    const message = `【イベントキャンセルのお知らせ】

${dateStr}（${areaLabel}）のイベントについてお知らせいたします。

既定の人数が集まらず、マッチングできませんでした。

またのご参加をお待ちしております。`;

    await client.pushMessage({
      to: lineUserId,
      messages: [
        {
          type: 'text',
          text: message,
        },
      ],
    });

    console.log(`[LINE] Cancellation notification sent to user ${lineUserId}`);
    return true;
  } catch (error) {
    console.error(`[LINE] Failed to send cancellation notification to user ${lineUserId}:`, error);
    return false;
  }
}

/**
 * Send cancellation notifications to all participants of an event
 */
export async function sendCancellationNotificationsToMembers(
  members: Array<{ lineUserId: string | null }>,
  eventDate: string,
  area: string
): Promise<{ sent: number; failed: number; skipped: number }> {
  const validMembers = members.filter((m): m is { lineUserId: string } => !!m.lineUserId);
  const skipped = members.length - validMembers.length;

  const settled = await Promise.allSettled(
    validMembers.map((member) =>
      sendCancellationNotification(member.lineUserId, { eventDate, area })
    )
  );

  let sent = 0;
  let failed = 0;
  for (const result of settled) {
    if (result.status === 'fulfilled' && result.value) {
      sent++;
    } else {
      failed++;
    }
  }

  return { sent, failed, skipped };
}

export interface MemberCancelNotificationData {
  canceledMemberName: string;
  eventDate: string;
  restaurantName: string;
}

/**
 * Send LINE notification when a member cancels their attendance
 */
export async function sendMemberCancelNotification(
  lineUserId: string,
  data: MemberCancelNotificationData
): Promise<boolean> {
  const client = getLineClient();

  if (!client) {
    console.log(`[LINE] Skipping member cancel notification for user ${lineUserId} - client not configured`);
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

    const message = `【メンバーキャンセルのお知らせ】

${data.canceledMemberName}さんが${dateStr}のディナーをキャンセルしました。

【日時】${dateStr} ${timeStr}〜
【お店】${data.restaurantName}

他のメンバーと引き続きお楽しみください。`;

    await client.pushMessage({
      to: lineUserId,
      messages: [
        {
          type: 'text',
          text: message,
        },
      ],
    });

    console.log(`[LINE] Member cancel notification sent to user ${lineUserId}`);
    return true;
  } catch (error) {
    console.error(`[LINE] Failed to send member cancel notification to user ${lineUserId}:`, error);
    return false;
  }
}

export interface MemberLateNotificationData {
  lateMemberName: string;
  lateMinutes: number;
  eventDate: string;
  restaurantName: string;
}

/**
 * Send LINE notification when a member reports they will be late
 */
export async function sendMemberLateNotification(
  lineUserId: string,
  data: MemberLateNotificationData
): Promise<boolean> {
  const client = getLineClient();

  if (!client) {
    console.log(`[LINE] Skipping member late notification for user ${lineUserId} - client not configured`);
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

    const message = `【遅刻連絡】

${data.lateMemberName}さんが約${data.lateMinutes}分遅れるとのことです。

【日時】${dateStr} ${timeStr}〜
【お店】${data.restaurantName}

先にお店でお待ちください。`;

    await client.pushMessage({
      to: lineUserId,
      messages: [
        {
          type: 'text',
          text: message,
        },
      ],
    });

    console.log(`[LINE] Member late notification sent to user ${lineUserId}`);
    return true;
  } catch (error) {
    console.error(`[LINE] Failed to send member late notification to user ${lineUserId}:`, error);
    return false;
  }
}

export interface ReminderNotificationData {
  eventDate: string;
  area: string;
  restaurantName: string;
  restaurantUrl?: string | null;
  reservationName?: string | null;
}

/**
 * Send LINE push notification reminder for today's dinner
 */
export async function sendReminderNotification(
  lineUserId: string,
  data: ReminderNotificationData
): Promise<boolean> {
  const client = getLineClient();

  if (!client) {
    console.log(`[LINE] Skipping reminder for user ${lineUserId} - client not configured`);
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

    const areaLabel = getAreaLabel(data.area);

    let message = `【本日のディナーリマインダー】

本日、以下のディナーが予定されています。

【日時】${dateStr} ${timeStr}〜
【お店】${data.restaurantName}`;

    if (data.restaurantUrl) {
      message += `\n${data.restaurantUrl}`;
    }

    message += `\n【エリア】${areaLabel}`;

    if (data.reservationName) {
      message += `\n【予約名】${data.reservationName}`;
    }

    message += `\n\n素敵な時間をお過ごしください！`;

    await client.pushMessage({
      to: lineUserId,
      messages: [
        {
          type: 'text',
          text: message,
        },
      ],
    });

    console.log(`[LINE] Reminder sent to user ${lineUserId}`);
    return true;
  } catch (error) {
    console.error(`[LINE] Failed to send reminder to user ${lineUserId}:`, error);
    return false;
  }
}

/**
 * Send reminder notifications to all members of a match
 */
export async function sendReminderNotificationsToMembers(
  members: Array<{ lineUserId: string | null }>,
  eventDate: string,
  area: string,
  restaurantName: string,
  restaurantUrl?: string | null,
  reservationName?: string | null
): Promise<{ sent: number; failed: number; skipped: number }> {
  const validMembers = members.filter((m): m is { lineUserId: string } => !!m.lineUserId);
  const skipped = members.length - validMembers.length;

  const settled = await Promise.allSettled(
    validMembers.map((member) =>
      sendReminderNotification(member.lineUserId, {
        eventDate,
        area,
        restaurantName,
        restaurantUrl,
        reservationName,
      })
    )
  );

  let sent = 0;
  let failed = 0;
  for (const result of settled) {
    if (result.status === 'fulfilled' && result.value) {
      sent++;
    } else {
      failed++;
    }
  }

  return { sent, failed, skipped };
}
