import type { Pixel, PixelEventData } from "./types";

export function generateEventId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

const loadMetaPixel = (pixelId: string) => {
  if (typeof window === "undefined" || !pixelId) return;
  const cleanPixelId = pixelId.trim();
  if (!cleanPixelId) return;

  const w = window as any;
  w._meta_initialized_pixels = w._meta_initialized_pixels || new Set<string>();
  if (w._meta_initialized_pixels.has(cleanPixelId)) {
    return;
  }
  w._meta_initialized_pixels.add(cleanPixelId);

  if (!w.fbq) {
    w.fbq = function () {
      w.fbq.callMethod ? w.fbq.callMethod.apply(w.fbq, arguments) : w.fbq.queue.push(arguments);
    };
    if (!w._fbq) w._fbq = w.fbq;
    w.fbq.push = w.fbq;
    w.fbq.loaded = true;
    w.fbq.version = '2.0';
    w.fbq.queue = [];

    const s = document.createElement("script");
    s.async = true;
    s.src = "https://connect.facebook.net/en_US/fbevents.js";
    const first = document.getElementsByTagName("script")[0];
    if (first && first.parentNode) {
      first.parentNode.insertBefore(s, first);
    } else {
      document.head.appendChild(s);
    }
  }

  w.fbq('init', cleanPixelId);
  w.fbq('track', 'PageView');
};

const loadTikTokPixel = (pixelId: string) => {
  if (typeof window === "undefined" || !pixelId) return;
  const cleanPixelId = pixelId.trim();
  if (!cleanPixelId) return;

  const w = window as any;
  if (w.ttq) { w.ttq.load(cleanPixelId); w.ttq.page(); return; }
  w.ttq = w.ttq || [];
  w.ttq.methods = ["track", "once", "screen", "em", "ee", "user", "load"];
  w.ttq.factory = function (t: string) {
    return function () {
      const e = Array.prototype.slice.call(arguments);
      e.unshift(t); w.ttq.push(e); return w.ttq;
    };
  };
  for (let i = 0; i < w.ttq.methods.length; i++) {
    w.ttq[w.ttq.methods[i]] = w.ttq.factory(w.ttq.methods[i]);
  }
  w.ttq.load(cleanPixelId);
  w.ttq.page();
  const s = document.createElement("script");
  s.async = true;
  s.src = "https://analytics.tiktok.com/i18n/pixel/events.js";
  const first = document.getElementsByTagName("script")[0];
  if (first && first.parentNode) {
    first.parentNode.insertBefore(s, first);
  } else {
    document.head.appendChild(s);
  }
};

const loadSnapchatPixel = (pixelId: string) => {
  if (typeof window === "undefined" || !pixelId) return;
  const cleanPixelId = pixelId.trim();
  if (!cleanPixelId) return;

  const w = window as any;
  if (w.snaptr) { w.snaptr('init', cleanPixelId); w.snaptr('track', 'PAGE_VIEW'); return; }
  w.snaptr = function () {
    w.snaptr.handleRequest
      ? w.snaptr.handleRequest.apply(w.snaptr, arguments)
      : w.snaptr.queue.push(arguments);
  };
  w.snaptr.queue = [];
  const s = document.createElement("script");
  s.async = true;
  s.src = "https://sc-static.net/scevent.min.js";
  const first = document.getElementsByTagName("script")[0];
  if (first && first.parentNode) {
    first.parentNode.insertBefore(s, first);
  } else {
    document.head.appendChild(s);
  }
  w.snaptr('init', cleanPixelId);
  w.snaptr('track', 'PAGE_VIEW');
};

export const initializePixels = (pixels: Pixel[]) => {
  if (typeof window === "undefined" || !pixels || !Array.isArray(pixels)) return;
  pixels.forEach((pixel) => {
    if (!pixel.pixel_id) return;
    try {
      if (pixel.platform === 'meta') loadMetaPixel(pixel.pixel_id);
      else if (pixel.platform === 'tiktok') loadTikTokPixel(pixel.pixel_id);
      else if (pixel.platform === 'snapchat') loadSnapchatPixel(pixel.pixel_id);
    } catch (e) {
      console.error("Error loading pixel:", pixel, e);
    }
  });
};

export const deduplicatePixels = (pixels: Pixel[]): Pixel[] => {
  if (!Array.isArray(pixels)) return [];
  const seen = new Set<string>();
  return pixels.filter((p) => {
    if (!p || !p.pixel_id) return false;
    const cleanId = p.pixel_id.trim();
    if (!cleanId || seen.has(cleanId)) return false;
    seen.add(cleanId);
    return true;
  });
};

export const trackPixelEvent = (
  pixels: Pixel[],
  eventName: string,
  eventData: PixelEventData = {},
  eventId?: string
) => {
  if (typeof window === "undefined" || !pixels || !Array.isArray(pixels)) return;
  const w = window as any;
  const eid = eventId || generateEventId();

  pixels.forEach((pixel) => {
    if (!pixel.pixel_id) return;
    const cleanPixelId = pixel.pixel_id.trim();
    if (!cleanPixelId) return;

    try {
      if (pixel.platform === 'meta') {
        loadMetaPixel(cleanPixelId);
        if (w.fbq) {
          w.fbq('trackSingle', cleanPixelId, eventName, eventData, { eventID: eid });
        }
      } else if (pixel.platform === 'tiktok' && w.ttq) {
        w.ttq.track(eventName, eventData);
      } else if (pixel.platform === 'snapchat' && w.snaptr) {
        const snapEventMap: Record<string, string> = {
          ViewContent: 'VIEW_CONTENT',
          AddToCart: 'ADD_CART',
          InitiateCheckout: 'START_CHECKOUT',
          Purchase: 'PURCHASE',
        };
        w.snaptr('track', snapEventMap[eventName] || eventName, eventData);
      }
    } catch (e) {
      console.error("Error tracking pixel event:", pixel, eventName, e);
    }
  });

  return eid;
};

export const validateMetaPixel = async (pixelId: string): Promise<{ valid: boolean; name?: string; error?: string }> => {
  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${pixelId.trim()}?fields=name,id`,
      { method: 'GET' }
    );
    const data = await res.json();
    if (data.error) {
      return { valid: false, error: data.error.message || 'Pixel not found' };
    }
    if (data.id) {
      return { valid: true, name: data.name };
    }
    return { valid: false, error: 'Unknown response from Meta' };
  } catch (e: any) {
    return { valid: false, error: e.message || 'Network error' };
  }
};
