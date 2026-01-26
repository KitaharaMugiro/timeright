// Encode user ID to referral code (Base64 URL-safe)
export function encodeReferralCode(userId: string): string {
  return Buffer.from(userId).toString('base64url');
}

// Decode referral code to user ID
export function decodeReferralCode(code: string): string | null {
  try {
    return Buffer.from(code, 'base64url').toString('utf-8');
  } catch {
    return null;
  }
}
