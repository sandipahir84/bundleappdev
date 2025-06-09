import fs from 'fs/promises';
import path from 'path';

/**
 * Upload files to the public directory and return their URLs
 * @param {File[]} files - Array of files to upload
 * @param {string} subDir - Subdirectory within uploads (e.g., 'mixmatch', 'products')
 * @param {string} origin - Origin URL for generating public URLs
 * @returns {Promise<Array>} - Array of file objects with path, url, type, and name
 */
export async function uploadFiles(files, subDir, origin) {
  if (!files || files.length === 0) {
    return [];
  }
  // 📂 Full real path (for saving file on server)
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', subDir);

  // 🌐 Public URL path (for returning to frontend)
  const uploadDirPath = path.join('uploads', subDir);

  // Ensure upload directory exists
  await fs.mkdir(uploadDir, { recursive: true });

  // Process files
  const uploadedFiles = await Promise.all(
    files.map(async (file) => {
      if (file instanceof File) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const fileName = `${Date.now()}-${file.name}`;
        const filePath = path.join(uploadDir, fileName);

        // Save file to disk
        await fs.writeFile(filePath, buffer);

        // Return the file object
        const publicUrl = `uploads/${subDir}/${fileName}`;
        return {
          path: `${uploadDirPath}/${fileName}`,
          url: publicUrl,
          type: file.type,
          name: file.name,
          fileName
        };
      }
      return null;
    })
  );

  return uploadedFiles.filter(file => file !== null);
}
