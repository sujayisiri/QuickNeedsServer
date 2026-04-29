import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || "quickneeds-products";

/**
 * Upload an image buffer to S3
 * @param buffer - Image buffer
 * @param contentType - MIME type of the image
 * @param type - Type of image (icon or description)
 * @returns S3 URL of the uploaded image
 */
export const uploadImageToS3 = async (
  buffer: Buffer,
  contentType: string,
  type: "icon" | "description",
): Promise<string> => {
  // Generate unique filename
  const extension = contentType.split("/")[1] || "jpg";
  const filename = `products/${type}-${uuidv4()}.${extension}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: filename,
    Body: buffer,
    ContentType: contentType,
    // Removed ACL - will use bucket policy for public access instead
  });

  await s3Client.send(command);

  // Return the public URL
  return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${filename}`;
};

/**
 * Generate a presigned URL for direct S3 upload from frontend
 * This bypasses API Gateway's 10MB limit
 * @param fileName - Original filename
 * @param contentType - MIME type
 * @param type - Type of image (icon or description)
 * @returns Object with uploadUrl and final imageUrl
 */
export const generatePresignedUploadUrl = async (
  fileName: string,
  contentType: string,
  type: "icon" | "description",
): Promise<{ uploadUrl: string; imageUrl: string }> => {
  // Generate unique filename
  const extension =
    contentType.split("/")[1] || fileName.split(".").pop() || "jpg";
  const filename = `products/${type}-${uuidv4()}.${extension}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: filename,
    ContentType: contentType,
    // Removed ACL - will use bucket policy for public access instead
  });

  // Generate presigned URL (valid for 5 minutes)
  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

  // Generate the final public URL
  const imageUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${filename}`;

  return { uploadUrl, imageUrl };
};

/**
 * Parse multipart/form-data from API Gateway
 * This is a simplified parser for handling single file uploads
 */
export const parseMultipartFormData = (
  body: string,
  contentType: string,
): {
  file: Buffer;
  fileType: string;
  fields: Record<string, string>;
} | null => {
  try {
    // Extract boundary from content-type header
    const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/);
    if (!boundaryMatch) {
      return null;
    }

    const boundary = boundaryMatch[1] || boundaryMatch[2];
    const parts = body.split(`--${boundary}`);

    let fileBuffer: Buffer | null = null;
    let fileType = "";
    const fields: Record<string, string> = {};

    for (const part of parts) {
      if (part.includes("Content-Disposition")) {
        // Extract field name
        const nameMatch = part.match(/name="([^"]+)"/);
        if (!nameMatch) continue;

        const fieldName = nameMatch[1];

        // Check if this is a file field
        const filenameMatch = part.match(/filename="([^"]+)"/);
        const contentTypeMatch = part.match(/Content-Type:\s*(.+)/);

        if (filenameMatch && contentTypeMatch) {
          // This is a file field
          fileType = contentTypeMatch[1].trim();

          // Find the start of the file content (after headers)
          const headerEnd = part.indexOf("\r\n\r\n");
          if (headerEnd !== -1) {
            // Extract file content (everything after headers, minus trailing boundary markers)
            const fileContent = part.substring(headerEnd + 4);
            // Remove trailing newlines and boundary markers
            const cleanContent = fileContent.replace(/\r\n$/, "");
            fileBuffer = Buffer.from(cleanContent, "binary");
          }
        } else {
          // This is a regular text field
          const valueStart = part.indexOf("\r\n\r\n");
          if (valueStart !== -1) {
            const value = part.substring(valueStart + 4).replace(/\r\n$/, "");
            fields[fieldName] = value;
          }
        }
      }
    }

    if (!fileBuffer || !fileType) {
      return null;
    }

    return { file: fileBuffer, fileType, fields };
  } catch (error) {
    console.error("Error parsing multipart form data:", error);
    return null;
  }
};
