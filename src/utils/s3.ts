import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

// ↓ Disable checksum at client level — this stops the SDK from adding
//   x-amz-checksum-crc32 and x-amz-sdk-checksum-algorithm to the signature
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "ap-south-2",
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
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
