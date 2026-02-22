import { BskyAgent } from '@atproto/api';
import { TRPCError } from '@trpc/server';
import sharp from 'sharp';
import { log } from '../../log';

const realisticHeaders: Record<string, string> = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
};

const withTimeout = async <T>(promise: Promise<T>, ms: number): Promise<T> => {
  let timeoutId: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(
        new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Request timed out',
        })
      );
    }, ms);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    if (timeoutId) clearTimeout(timeoutId);
    return result;
  } catch (err) {
    if (timeoutId) clearTimeout(timeoutId);
    throw err;
  }
};

export const uploadImage = async (agent: BskyAgent, imageUrl: string) => {
  try {
    const imgRes = await withTimeout(
      fetch(imageUrl, { headers: realisticHeaders }),
      10_000
    );

    if (!imgRes.ok) {
      throw new Error(`Image fetch failed with status ${imgRes.status}`);
    }

    const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
    const mimeTypeMap: Record<string, string> = {
      'image/jpeg': 'image/jpeg',
      'image/jpg': 'image/jpeg',
      'image/png': 'image/png',
      'image/webp': 'image/webp',
      'image/gif': 'image/gif',
    };
    const encoding = mimeTypeMap[contentType] || 'image/jpeg';

    let arrayBuffer = await imgRes.arrayBuffer();
    let buffer: Buffer = Buffer.from(new Uint8Array(arrayBuffer));

    const maxSize = 1_000_000; // 1 MB
    if (buffer.length > maxSize) {
      log.info('Image too large, compressing', {
        originalSize: buffer.length,
        url: imageUrl,
      });

      buffer = await sharp(buffer)
        .resize(1200, 630, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();

      if (buffer.length > maxSize) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Image too large even after compression',
        });
      }
    }

    const uploadRes = await withTimeout(
      agent.uploadBlob(buffer, { encoding }),
      10_000
    );

    return uploadRes.data.blob;
  } catch (error) {
    log.warn('Thumbnail upload failed', {
      error:
        error instanceof Error
          ? error.stack || error.message
          : JSON.stringify(error),
      imageUrl,
    });
    return null;
  }
};
