import fs from 'fs/promises';
import path from 'path';

// Optional AWS S3 integration
let s3Client: any = null;
const bucketName = process.env.S3_BUCKET_NAME || process.env.AWS_S3_BUCKET;

if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && bucketName) {
  try {
    const { S3Client } = require('@aws-sdk/client-s3');
    s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
      endpoint: process.env.S3_ENDPOINT || undefined, // Useful for MinIO
      forcePathStyle: !!process.env.S3_ENDPOINT,
    });
    console.log('S3 Storage Engine Initialized');
  } catch (err) {
    console.warn('AWS SDK not installed or S3 initialization failed, falling back to Local Storage.');
  }
}

// Local storage folder
const UPLOADS_DIR = path.join(__dirname, '../../public/uploads');

/**
 * Ensures a directory exists
 */
async function ensureDir(dirPath: string) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

export const StorageEngine = {
  /**
   * Saves a file (snapshot state or thumbnail) and returns its accessible URL
   * @param subfolder e.g., 'snapshots' or 'thumbnails'
   * @param filename e.g., 'board_123_162345678.json'
   * @param content Buffer or String content
   */
  async saveFile(subfolder: string, filename: string, content: Buffer | string): Promise<string> {
    const key = `${subfolder}/${filename}`;

    if (s3Client) {
      const { PutObjectCommand } = require('@aws-sdk/client-s3');
      const body = typeof content === 'string' ? Buffer.from(content) : content;
      await s3Client.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: body,
        ContentType: filename.endsWith('.webp') ? 'image/webp' : 'application/json',
      }));
      // If endpoint is set, return custom URL, else return standard S3 URL
      if (process.env.S3_PUBLIC_URL) {
        return `${process.env.S3_PUBLIC_URL}/${bucketName}/${key}`;
      }
      return `https://${bucketName}.s3.amazonaws.com/${key}`;
    } else {
      // Local storage fallback
      const targetDir = path.join(UPLOADS_DIR, subfolder);
      await ensureDir(targetDir);
      const filePath = path.join(targetDir, filename);
      await fs.writeFile(filePath, content);
      
      // Return relative URL that our Express server will serve
      return `/uploads/${subfolder}/${filename}`;
    }
  },

  /**
   * Reads a file and returns its content
   */
  async getFile(urlOrKey: string): Promise<Buffer | string> {
    if (s3Client && (urlOrKey.startsWith('http') || !urlOrKey.startsWith('/uploads'))) {
      const { GetObjectCommand } = require('@aws-sdk/client-s3');
      // Parse key from URL if it's a full URL
      let key = urlOrKey;
      if (urlOrKey.startsWith('http')) {
        const parts = urlOrKey.split(`/${bucketName}/`);
        if (parts.length > 1) {
          key = parts[1];
        } else {
          // Fallback parsing
          const urlObj = new URL(urlOrKey);
          key = urlObj.pathname.replace(/^\//, '');
        }
      }

      const response = await s3Client.send(new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      }));

      // Stream to buffer
      const streamToBuffer = (stream: any): Promise<Buffer> =>
        new Promise((resolve, reject) => {
          const chunks: any[] = [];
          stream.on('data', (chunk: any) => chunks.push(chunk));
          stream.on('error', reject);
          stream.on('end', () => resolve(Buffer.concat(chunks)));
        });

      return streamToBuffer(response.Body);
    } else {
      // Local storage path resolving
      // urlOrKey would be like "/uploads/snapshots/xyz.json"
      const relativePath = urlOrKey.replace(/^\/?uploads\//, '').replace(/^\/?api\/uploads\//, '');
      const filePath = path.join(UPLOADS_DIR, relativePath);
      
      const fileBuffer = await fs.readFile(filePath);
      if (filePath.endsWith('.json')) {
        return fileBuffer.toString('utf-8');
      }
      return fileBuffer;
    }
  }
};
