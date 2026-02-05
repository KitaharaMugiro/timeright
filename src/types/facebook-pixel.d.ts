// Facebook Pixel type definitions
type FacebookPixelEvent =
  | 'PageView'
  | 'Lead'
  | 'CompleteRegistration'
  | 'Purchase'
  | 'AddToCart'
  | 'InitiateCheckout'
  | 'Search'
  | 'ViewContent'
  | 'Contact'
  | 'Subscribe';

interface FacebookPixelParams {
  content_name?: string;
  content_category?: string;
  content_ids?: string[];
  content_type?: string;
  value?: number;
  currency?: string;
  num_items?: number;
  status?: string;
}

type FacebookPixelFunction = {
  (command: 'init', pixelId: string): void;
  (command: 'track', event: FacebookPixelEvent, params?: FacebookPixelParams): void;
  (command: 'trackCustom', event: string, params?: FacebookPixelParams): void;
};

declare global {
  interface Window {
    fbq: FacebookPixelFunction;
  }
}

export {};
