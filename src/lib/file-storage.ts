import fs from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'

export async function saveBase64TourImage(tourId: string, filename: string, base64Data: string) {
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'tours', tourId);
  await fs.mkdir(uploadsDir, { recursive: true });

  const safeName = `${Date.now()}-${filename.replace(/[^a-z0-9._-]/gi, '-')}`;
  const filePath = path.join(uploadsDir, safeName);

  const buffer = Buffer.from(base64Data, 'base64');
  await fs.writeFile(filePath, buffer);

  // Return web-accessible URL
  const url = `/uploads/tours/${tourId}/${safeName}`;
  return url;
}

export function generateId() {
  return randomUUID();
}
