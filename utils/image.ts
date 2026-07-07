import { HivePost } from '../types';
import { sanitizeUrl } from './security';

export const getProxiedImageUrl = (url: string | null, width: number, height: number = 0): string | null => {
  if (!url) return null;
  const sanitized = sanitizeUrl(url);
  if (!sanitized) return null;
  
  if (sanitized.includes('images.hive.blog/') || 
      sanitized.includes('images.ecency.com/') || 
      sanitized.includes('files.peakd.com/')) {
      return sanitized; // avoid double proxying which causes 403
  }
  
  return `https://images.hive.blog/${width}x${height}/${sanitized}`;
}

export const extractImage = (post: HivePost): string | null => {
  try {
    let json;
    if (typeof post.json_metadata === 'string') {
      json = JSON.parse(post.json_metadata);
    } else {
      json = post.json_metadata;
    }

    let imgUrl = null;
    if (json && json.image && Array.isArray(json.image) && json.image.length > 0) {
      imgUrl = json.image[0];
    } else if (json && json.thumbnail) {
      imgUrl = json.thumbnail;
    } else if (json && typeof json.images === 'object') {
       const keys = Object.keys(json.images);
       if (keys.length > 0) {
           imgUrl = json.images[keys[0]];
       }
    } else if (json && json.images && Array.isArray(json.images) && json.images.length > 0) {
       imgUrl = json.images[0];
    }

    if (!imgUrl && post.body) {
      const imgMatch = post.body.match(/!\[.*?\]\((.*?)\)/);
      if (imgMatch && imgMatch[1]) {
          imgUrl = imgMatch[1];
      }
    }

    if (!imgUrl && json) {
        const jsonStr = JSON.stringify(json);
        const imgMatch = jsonStr.match(/(https?:\/\/[^\s<"']+\.(?:png|jpe?g|gif|webp))/i);
        if (imgMatch && imgMatch[1]) {
            imgUrl = imgMatch[1];
        }
    }
    
    if (imgUrl) {
       const sanitized = sanitizeUrl(imgUrl);
       if (sanitized) return sanitized;
    }
    return null;
  } catch (e) {
    return null;
  }
};
