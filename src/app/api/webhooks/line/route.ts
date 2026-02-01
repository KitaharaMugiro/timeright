import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { messagingApi } from '@line/bot-sdk';
import { createServiceClient } from '@/lib/supabase/server';

const { MessagingApiClient } = messagingApi;

// Verify LINE webhook signature
function verifySignature(body: string, signature: string): boolean {
  const channelSecret = process.env.LINE_CHANNEL_SECRET;
  if (!channelSecret) {
    console.error('LINE_CHANNEL_SECRET is not configured');
    return false;
  }

  const hash = createHmac('sha256', channelSecret)
    .update(body)
    .digest('base64');

  return hash === signature;
}

// Get LINE client for reply messages
function getLineClient(): messagingApi.MessagingApiClient | null {
  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!channelAccessToken) {
    return null;
  }
  return new MessagingApiClient({ channelAccessToken });
}

export async function POST(request: NextRequest) {
  // Get raw body for signature verification
  const body = await request.text();
  const signature = request.headers.get('x-line-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  // Verify signature
  if (!verifySignature(body, signature)) {
    console.error('Invalid LINE webhook signature');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const events = JSON.parse(body).events;
  const supabase = await createServiceClient();
  const lineClient = getLineClient();

  for (const event of events) {
    // Only handle image messages
    if (event.type !== 'message' || event.message?.type !== 'image') {
      continue;
    }

    const lineUserId = event.source?.userId;
    const messageId = event.message.id;
    const replyToken = event.replyToken;

    if (!lineUserId || !messageId) {
      continue;
    }

    // Look up user by LINE user ID
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userData } = await (supabase as any)
      .from('users')
      .select('id, is_identity_verified')
      .eq('line_user_id', lineUserId)
      .single();

    const user = userData as { id: string; is_identity_verified: boolean } | null;

    if (!user) {
      // User not registered
      if (lineClient && replyToken) {
        try {
          await lineClient.replyMessage({
            replyToken,
            messages: [
              {
                type: 'text',
                text: 'アカウントが見つかりませんでした。先にアプリでアカウント登録を完了してください。',
              },
            ],
          });
        } catch (err) {
          console.error('[LINE Webhook] Failed to send reply:', err);
        }
      }
      continue;
    }

    if (user.is_identity_verified) {
      // Already verified
      if (lineClient && replyToken) {
        try {
          await lineClient.replyMessage({
            replyToken,
            messages: [
              {
                type: 'text',
                text: 'すでに本人確認が完了しています。ありがとうございます！',
              },
            ],
          });
        } catch (err) {
          console.error('[LINE Webhook] Failed to send reply:', err);
        }
      }
      continue;
    }

    // Check for existing pending request
    const { data: existingRequest } = (await supabase
      .from('identity_verification_requests')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .single()) as { data: { id: string } | null };

    if (existingRequest) {
      // Already has pending request
      if (lineClient && replyToken) {
        try {
          await lineClient.replyMessage({
            replyToken,
            messages: [
              {
                type: 'text',
                text: '本人確認の申請を受付済みです。運営からの確認をお待ちください（通常2〜3日）。',
              },
            ],
          });
        } catch (err) {
          console.error('[LINE Webhook] Failed to send reply:', err);
        }
      }
      continue;
    }

    // Create verification request
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: insertError } = await (supabase as any)
      .from('identity_verification_requests')
      .insert({
        user_id: user.id,
        line_user_id: lineUserId,
        line_message_id: messageId,
        status: 'pending',
      });

    if (insertError) {
      console.error('[LINE Webhook] Failed to create verification request:', insertError);
      continue;
    }

    console.log(`[LINE Webhook] Created verification request for user ${user.id}`);

    // Send confirmation message
    if (lineClient && replyToken) {
      try {
        await lineClient.replyMessage({
          replyToken,
          messages: [
            {
              type: 'text',
              text: '身分証明書を受け取りました。運営が確認いたしますので、2〜3日お待ちください。確認完了後、本人確認済みバッジがプロフィールに表示されます。',
            },
          ],
        });
      } catch (err) {
        console.error('[LINE Webhook] Failed to send reply:', err);
      }
    }
  }

  return NextResponse.json({ received: true });
}
