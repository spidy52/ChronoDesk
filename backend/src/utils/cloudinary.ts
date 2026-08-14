import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

export const uploadToCloudinary = async (base64Image: string): Promise<string> => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'yofheg0g';
  const apiKey = process.env.CLOUDINARY_API_KEY || '844521521145382';
  const apiSecret = process.env.CLOUDINARY_API_SECRET || '-BNtDW8yd34DIBQS-paidNGzEGk';

  if (!cloudName) {
    throw new Error('Cloudinary Cloud Name is missing. Please set CLOUDINARY_CLOUD_NAME in backend/.env');
  }

  const timestamp = Math.round(new Date().getTime() / 1000);
  const paramsToSign = `timestamp=${timestamp}${apiSecret}`;
  const signature = crypto.createHash('sha1').update(paramsToSign).digest('hex');

  const formData = new FormData();
  formData.append('file', base64Image);
  formData.append('api_key', apiKey);
  formData.append('timestamp', timestamp.toString());
  formData.append('signature', signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  const data = (await response.json()) as any;

  if (!response.ok) {
    const errorDetail = data.error?.message || 'Failed to upload image to Cloudinary';
    console.error('Cloudinary Upload Error:', data);
    throw new Error(`Cloudinary Error: ${errorDetail}. Check CLOUDINARY_CLOUD_NAME in .env`);
  }

  return data.secure_url;
};
