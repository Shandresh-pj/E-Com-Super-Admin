import { getApiBaseUrl } from '../config/environment';

export interface NormalizedMediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnailUrl?: string;
  title?: string;
}

export class MediaService {
  /**
   * Resolves any backend relative or absolute media URL into a valid HTTPS string
   */
  static resolveUrl(pathOrUrl?: string | null): string {
    if (!pathOrUrl || typeof pathOrUrl !== 'string') {
      return '';
    }

    const trimmed = pathOrUrl.trim();

    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:') || trimmed.startsWith('file://')) {
      return trimmed;
    }

    const baseUrl = getApiBaseUrl().replace(/\/api\/?$/, '');
    const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return `${baseUrl}${cleanPath}`;
  }

  /**
   * Normalizes arbitrary backend media payloads into clean NormalizedMediaItem array
   */
  static normalizeMediaList(
    primaryImg?: string | null,
    additionalImgs?: string | string[] | null,
    videoUrl?: string | null
  ): NormalizedMediaItem[] {
    const list: NormalizedMediaItem[] = [];

    if (primaryImg && typeof primaryImg === 'string' && primaryImg.trim()) {
      const resolved = this.resolveUrl(primaryImg);
      if (resolved) {
        list.push({
          id: 'primary-1',
          type: 'image',
          url: resolved,
          title: 'Primary Product Image',
        });
      }
    }

    if (additionalImgs) {
      const rawItems = Array.isArray(additionalImgs)
        ? additionalImgs
        : additionalImgs.split(',').map((s) => s.trim()).filter(Boolean);

      rawItems.forEach((img, idx) => {
        const resolved = this.resolveUrl(img);
        if (resolved && !list.some((existing) => existing.url === resolved)) {
          list.push({
            id: `gallery-${idx + 1}`,
            type: 'image',
            url: resolved,
            title: `Gallery Photo #${idx + 1}`,
          });
        }
      });
    }

    if (videoUrl && typeof videoUrl === 'string' && videoUrl.trim()) {
      const resolved = this.resolveUrl(videoUrl);
      if (resolved) {
        list.push({
          id: 'video-1',
          type: 'video',
          url: resolved,
          title: 'Product Demonstration Video',
        });
      }
    }

    return list;
  }
}
