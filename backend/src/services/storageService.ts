import { getSupabaseClient, getStorageBucketName } from '../utils/supabaseClient';

/**
 * Upload image to Supabase storage bucket
 * 
 * @param buffer - Image file buffer
 * @param fileName - Name of the file to upload
 * @param contentType - MIME type of the file (e.g., 'image/jpeg', 'image/png')
 * @returns Public URL of uploaded file
 * @throws Error if upload fails
 * 
 * @example
 * ```ts
 * const buffer = Buffer.from(imageData);
 * const publicUrl = await uploadImage(buffer, 'product-123.jpg', 'image/jpeg');
 * ```
 */
export async function uploadImage(
  buffer: Buffer,
  fileName: string,
  contentType: string
): Promise<string> {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw new Error('Buffer is required and must be a Buffer');
  }

  if (!fileName || typeof fileName !== 'string') {
    throw new Error('File name is required and must be a string');
  }

  if (!contentType || typeof contentType !== 'string') {
    throw new Error('Content type is required and must be a string');
  }

  try {
    const supabase = getSupabaseClient();
    const bucketName = getStorageBucketName();

    // Sanitize file name to prevent path traversal
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    
    // Generate unique file path: products/{timestamp}_{filename}
    const timestamp = Date.now();
    const filePath = `products/${timestamp}_${sanitizedFileName}`;

    // Upload file to Supabase storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, buffer, {
        contentType,
        upsert: false, // Don't overwrite existing files
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw new Error(`Image upload failed: ${error.message}`);
    }

    if (!data || !data.path) {
      throw new Error('Image upload failed: No data returned');
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(data.path);

    if (!urlData || !urlData.publicUrl) {
      throw new Error('Failed to generate public URL');
    }

    return urlData.publicUrl;
  } catch (error) {
    console.error('Upload image error:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to upload image: ${error.message}`);
    }
    throw new Error('Failed to upload image: Unknown error');
  }
}
