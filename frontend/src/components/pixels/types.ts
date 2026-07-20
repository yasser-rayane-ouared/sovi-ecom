export interface Pixel {
  id: string;
  platform: 'meta' | 'tiktok' | 'snapchat';
  pixel_id: string;
  access_token?: string;
  test_event_code?: string;
}

export interface PixelEventData {
  content_name?: string;
  content_names?: string[];
  content_ids?: string[];
  content_type?: string;
  value?: number;
  currency?: string;
  num_items?: number;
  [key: string]: any;
}

export type PixelHealthStatus = 'loading' | 'valid' | 'invalid';
