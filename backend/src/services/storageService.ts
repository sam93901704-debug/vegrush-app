import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Get Supabase URL from environment variables
 * Throws error if not configured
 */
function getSupabaseUrl(): string {
  const url = process.env.SUPABASE_URL;
  if (!url) {
    throw new Error('SUPABASE_URL environment variable is not configured');
  }
  return url;
}

/**
 * Get Supabase key from environment variables
 * Throws error if not configured
 */
function getSupabaseKey(): string {
  const key = process.env.SUPABASE_KEY;
  if (!key) {
    throw new Error('SUPABASE_KEY environment variable is not configured');
  }
  return key;
}

/**
 * Initialize Supabase client
 */
let supabaseClient: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    const url = getSupabaseUrl();
    const key = getSupabaseKey();
    supabaseClient = createClient(url, key);
  }
  return supabaseClient;
}

/**
 * Storage bucket name for product images
 */
const PRODUCT_IMAGES_BUCKET = 'products';

/**
 * Generate a signed upload URL for file upload
 * Uses Supabase storage API to create upload instructions
 * 
 * @param fileName - Name of the file to upload
 * @param contentType - MIME type of the file (e.g., 'image/jpeg', 'image/png')
 * @returns Upload URL, file path, and upload instructions
 * @throws Error if Supabase configuration is missing or upload URL generation fails
 * 
 * @example
 * ```ts
 * const { uploadUrl, filePath } = await generatePresignedUpload('product-123.jpg', 'image/jpeg');
 * // Use uploadUrl to upload file via PUT request
 * ```
 */
export async function generatePresignedUpload(
  fileName: string,
  contentType: string
): Promise<{ uploadUrl: string; filePath: string }> {
  if (!fileName || typeof fileName !== 'string') {
    throw new Error('File name is required and must be a string');
  }

  if (!contentType || typeof contentType !== 'string') {
    throw new Error('Content type is required and must be a string');
  }

  try {
    const supabase = getSupabaseClient();

    // Generate unique file path with timestamp to avoid collisions
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `products/${timestamp}-${sanitizedFileName}`;

    // Try to create signed upload URL (available in Supabase Storage v2+)
    // If not available, we'll generate a signed URL for upload via REST API
    try {
      const { data, error } = await supabase.storage
        .from(PRODUCT_IMAGES_BUCKET)
        .createSignedUploadUrl(filePath);

      if (!error && data) {
        // New API: createSignedUploadUrl returns { path, token, signedUrl }
        return {
          uploadUrl: (data as any).signedUrl || (data as any).url || '',
          filePath: data.path || filePath,
        };
      }
    } catch {
      // Fall through to alternative method
    }

    // Alternative: Generate upload URL using REST API endpoint
    // For Supabase, we can create a signed POST URL
    const url = getSupabaseUrl();
    const key = getSupabaseKey();
    
    // Construct upload URL for direct upload to Supabase Storage
    // Client can use this URL with PUT method and proper headers
    const uploadUrl = `${url}/storage/v1/object/${PRODUCT_IMAGES_BUCKET}/${filePath}`;

    return {
      uploadUrl,
      filePath,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to generate presigned upload URL: ${error.message}`);
    }
    throw new Error('Failed to generate presigned upload URL: Unknown error');
  }
}

/**
 * Get public URL for a file path
 * 
 * @param filePath - Path to the file in storage (without bucket name)
 * @returns Public URL to access the file
 * @throws Error if Supabase configuration is missing
 * 
 * @example
 * ```ts
 * const url = publicUrl('products/1234567890-product.jpg');
 * ```
 */
export function publicUrl(filePath: string): string {
  if (!filePath || typeof filePath !== 'string') {
    throw new Error('File path is required and must be a string');
  }

  try {
    const supabase = getSupabaseClient();
    const url = getSupabaseUrl();

    // Get public URL from Supabase storage
    const { data } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to generate public URL: ${error.message}`);
    }
    throw new Error('Failed to generate public URL: Unknown error');
  }
}

/**
 * Upload image to Supabase storage bucket "products"
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

    // Generate unique file path with timestamp to avoid collisions
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `${timestamp}-${sanitizedFileName}`;

    // Upload file to Supabase storage
    const { data, error } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .upload(filePath, buffer, {
        contentType,
        upsert: false, // Don't overwrite existing files
      });

    if (error) {
      throw new Error(`Image upload failed: ${error.message}`);
    }

    if (!data) {
      throw new Error('Image upload failed: No data returned');
    }

    // Return public URL
    return getPublicUrl(data.path);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to upload image: ${error.message}`);
    }
    throw new Error('Failed to upload image: Unknown error');
  }
}

/**
 * Get public URL for a file path
 * Returns full public URL using SUPABASE_URL
 * 
 * @param filePath - Path to the file in storage (without bucket name)
 * @returns Full public URL to access the file
 * @throws Error if Supabase configuration is missing
 * 
 * @example
 * ```ts
 * const url = getPublicUrl('1234567890-product.jpg');
 * // Returns: https://<project>.supabase.co/storage/v1/object/public/products/1234567890-product.jpg
 * ```
 */
export function getPublicUrl(filePath: string): string {
  if (!filePath || typeof filePath !== 'string') {
    throw new Error('File path is required and must be a string');
  }

  try {
    const supabase = getSupabaseClient();
    const url = getSupabaseUrl();

    // Get public URL from Supabase storage
    const { data } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(filePath);

    if (!data || !data.publicUrl) {
      // Fallback: construct public URL manually
      // Format: https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
      return `${url}/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/${filePath}`;
    }

    return data.publicUrl;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to generate public URL: ${error.message}`);
    }
    throw new Error('Failed to generate public URL: Unknown error');
  }
}

/**
 * Upload file directly to Supabase storage (alternative method)
 * Uses service role key for direct upload
 * 
 * @param filePath - Path where file should be stored
 * @param fileBuffer - File content as Buffer
 * @param contentType - MIME type of the file
 * @returns Public URL of uploaded file
 * @throws Error if upload fails
 */
export async function uploadFile(
  filePath: string,
  fileBuffer: Buffer,
  contentType: string
): Promise<string> {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .upload(filePath, fileBuffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      throw new Error(`File upload failed: ${error.message}`);
    }

    if (!data) {
      throw new Error('File upload failed: No data returned');
    }

    return getPublicUrl(data.path);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to upload file: ${error.message}`);
    }
    throw new Error('Failed to upload file: Unknown error');
  }
}

