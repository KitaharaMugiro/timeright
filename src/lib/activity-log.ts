import { createClient } from '@supabase/supabase-js';
import type { ActivityAction } from '@/types/database';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Log a user activity. Fire-and-forget: errors are caught and logged,
 * never thrown, so this never blocks or breaks the calling flow.
 */
export async function logActivity(
  userId: string,
  action: ActivityAction,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from('user_activity_logs')
      .insert({
        user_id: userId,
        action,
        metadata: metadata ?? {},
      });

    if (error) {
      console.error(`[ActivityLog] Failed to log ${action} for user ${userId}:`, error);
    }
  } catch (err) {
    console.error(`[ActivityLog] Unexpected error logging ${action} for user ${userId}:`, err);
  }
}

/**
 * Log an admin action on behalf of a user.
 * The admin_user_id is stored in metadata for audit trail.
 */
export async function logAdminActivity(
  targetUserId: string,
  action: ActivityAction,
  adminUserId: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  return logActivity(targetUserId, action, {
    ...metadata,
    admin_user_id: adminUserId,
  });
}
