// src/utils/s3.ts
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "ap-south-2",
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || "quickneeds-products";

export const generatePresignedUploadUrl = async (
  fileName: string,
  contentType: string,
  type: "icon" | "description",
): Promise<{ uploadUrl: string; imageUrl: string }> => {
  const extension =
    contentType.split("/")[1] || fileName.split(".").pop() || "jpg";
  const filename = `products/${type}-${uuidv4()}.${extension}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: filename,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, {
    expiresIn: 300,
    // ↓ This is the key fix — disables the CRC32 checksum requirement
    // Without this, the SDK adds x-amz-checksum-crc32 to the signed URL
    // and S3 then requires that header in the PUT, which the browser doesn't send
    unhoistableHeaders: new Set(["x-amz-checksum-crc32"]),
  });

  const imageUrl = `https://${BUCKET_NAME}.s3.${
    process.env.AWS_REGION || "ap-south-2"
  }.amazonaws.com/${filename}`;

  return { uploadUrl, imageUrl };
};

export const uploadImageToS3 = async (
  buffer: Buffer,
  contentType: string,
  type: "icon" | "description",
): Promise<string> => {
  const extension = contentType.split("/")[1] || "jpg";
  const filename = `products/${type}-${uuidv4()}.${extension}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: filename,
    Body: buffer,
    ContentType: contentType,
  });

  await s3Client.send(command);

  return `https://${BUCKET_NAME}.s3.${
    process.env.AWS_REGION || "ap-south-2"
  }.amazonaws.com/${filename}`;
};

export const parseMultipartFormData = (
  body: string,
  contentType: string,
): {
  file: Buffer;
  fileType: string;
  fields: Record<string, string>;
} | null => {
  try {
    const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/);
    if (!boundaryMatch) return null;

    const boundary = boundaryMatch[1] || boundaryMatch[2];
    const parts = body.split(`--${boundary}`);

    let fileBuffer: Buffer | null = null;
    let fileType = "";
    const fields: Record<string, string> = {};

    for (const part of parts) {
      if (part.includes("Content-Disposition")) {
        const nameMatch = part.match(/name="([^"]+)"/);
        if (!nameMatch) continue;

        const fieldName = nameMatch[1];
        const filenameMatch = part.match(/filename="([^"]+)"/);
        const contentTypeMatch = part.match(/Content-Type:\s*(.+)/);

        if (filenameMatch && contentTypeMatch) {
          fileType = contentTypeMatch[1].trim();
          const headerEnd = part.indexOf("\r\n\r\n");
          if (headerEnd !== -1) {
            const fileContent = part.substring(headerEnd + 4);
            const cleanContent = fileContent.replace(/\r\n$/, "");
            fileBuffer = Buffer.from(cleanContent, "binary");
          }
        } else {
          const valueStart = part.indexOf("\r\n\r\n");
          if (valueStart !== -1) {
            fields[fieldName] = part
              .substring(valueStart + 4)
              .replace(/\r\n$/, "");
          }
        }
      }
    }

    if (!fileBuffer || !fileType) return null;
    return { file: fileBuffer, fileType, fields };
  } catch (error) {
    console.error("Error parsing multipart form data:", error);
    return null;
  }
};
