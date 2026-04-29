import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { dbGet, dbPut, dbDelete, dbQuery, dbScan } from "../utils/dynamodb";
import { successResponse, errorResponse, parseBody } from "../utils/response";
import { uploadImageToS3, parseMultipartFormData } from "../utils/s3";
import { Product } from "../types";
import { v4 as uuidv4 } from "uuid";

// List all products (with optional category filter)
export const listProducts = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    const category = event.queryStringParameters?.category;
    const limit = parseInt(event.queryStringParameters?.limit || "50");

    let result;

    if (category) {
      // Query by category using GSI1
      result = await dbQuery({
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :category",
        ExpressionAttributeValues: {
          ":category": `CATEGORY#${category}`,
        },
        Limit: limit,
      });
    } else {
      // Scan all products (no category filter)
      result = await dbScan({
        FilterExpression: "begins_with(PK, :prefix) AND SK = :sk",
        ExpressionAttributeValues: {
          ":prefix": "PRODUCT#",
          ":sk": "METADATA",
        },
        Limit: limit,
      });
    }

    const products =
      result.Items?.map((item) => ({
        productId: item.productId,
        name: item.name,
        price: item.price,
        category: item.category,
        unit: item.unit,
        image: item.image,
        imageUrl: item.imageUrl,
        description: item.description,
        descriptionType: item.descriptionType,
        descriptionImageUrl: item.descriptionImageUrl,
        barcode: item.barcode,
        stock: item.stock,
        active: item.active,
      })) || [];

    return successResponse({
      products,
      count: products.length,
    });
  } catch (error) {
    console.error("List Products Error:", error);
    return errorResponse("Failed to list products", 500, error);
  }
};

// Get single product by ID
export const getProduct = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    const productId = event.pathParameters?.id;

    if (!productId) {
      return errorResponse("Product ID is required", 400);
    }

    const product = (await dbGet({
      PK: `PRODUCT#${productId}`,
      SK: "METADATA",
    })) as (Product & { PK: string; SK: string }) | undefined;

    if (!product) {
      return errorResponse("Product not found", 404);
    }

    return successResponse({
      productId: product.productId,
      name: product.name,
      price: product.price,
      category: product.category,
      unit: product.unit,
      image: product.image,
      imageUrl: product.imageUrl,
      description: product.description,
      descriptionType: product.descriptionType,
      descriptionImageUrl: product.descriptionImageUrl,
      barcode: product.barcode,
      stock: product.stock,
      active: product.active,
    });
  } catch (error) {
    console.error("Get Product Error:", error);
    return errorResponse("Failed to get product", 500, error);
  }
};

// Create new product (Admin only)
export const createProduct = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    const phoneNumber = event.requestContext.authorizer?.phoneNumber;
    const role = event.requestContext.authorizer?.role;

    if (role !== "admin") {
      return errorResponse("Forbidden: Admin access required", 403);
    }

    const body = parseBody<{
      name: string;
      price: number;
      category: string;
      unit: string;
      image: string;
      imageUrl?: string;
      description?: string;
      descriptionType?: "text" | "image";
      descriptionImageUrl?: string;
      barcode?: string;
      stock?: number;
    }>(event.body);

    if (!body) {
      return errorResponse("Invalid request body", 400);
    }

    const {
      name,
      price,
      category,
      unit,
      image,
      imageUrl,
      description,
      descriptionType,
      descriptionImageUrl,
      barcode,
      stock,
    } = body;

    if (!name || !price || !category || !unit || !image) {
      return errorResponse("Missing required fields", 400);
    }

    const productId = uuidv4();
    const now = new Date().toISOString();

    const product: Product & {
      PK: string;
      SK: string;
      GSI1PK: string;
      GSI1SK: string;
    } = {
      PK: `PRODUCT#${productId}`,
      SK: "METADATA",
      GSI1PK: `CATEGORY#${category}`,
      GSI1SK: `PRODUCT#${name}`,
      productId,
      name,
      price,
      category,
      unit,
      image,
      imageUrl: imageUrl || undefined,
      description: description || "",
      descriptionType: descriptionType || "text",
      descriptionImageUrl: descriptionImageUrl || undefined,
      barcode: barcode || "",
      stock: stock || 0,
      active: true,
      createdAt: now,
      updatedAt: now,
      createdBy: phoneNumber,
    };

    await dbPut(product);

    return successResponse(
      {
        message: "Product created successfully",
        product: {
          productId: product.productId,
          name: product.name,
          price: product.price,
          category: product.category,
          unit: product.unit,
          image: product.image,
          imageUrl: product.imageUrl,
          description: product.description,
          descriptionType: product.descriptionType,
          descriptionImageUrl: product.descriptionImageUrl,
          barcode: product.barcode,
          stock: product.stock,
          active: product.active,
        },
      },
      201,
    );
  } catch (error) {
    console.error("Create Product Error:", error);
    return errorResponse("Failed to create product", 500, error);
  }
};

// Update product (Admin only)
export const updateProduct = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    const role = event.requestContext.authorizer?.role;

    if (role !== "admin") {
      return errorResponse("Forbidden: Admin access required", 403);
    }

    const productId = event.pathParameters?.id;

    if (!productId) {
      return errorResponse("Product ID is required", 400);
    }

    const body = parseBody<{
      name?: string;
      price?: number;
      category?: string;
      unit?: string;
      image?: string;
      imageUrl?: string;
      description?: string;
      descriptionType?: "text" | "image";
      descriptionImageUrl?: string;
      barcode?: string;
      stock?: number;
      active?: boolean;
    }>(event.body);

    if (!body) {
      return errorResponse("Invalid request body", 400);
    }

    const product = (await dbGet({
      PK: `PRODUCT#${productId}`,
      SK: "METADATA",
    })) as
      | (Product & { PK: string; SK: string; GSI1PK: string; GSI1SK: string })
      | undefined;

    if (!product) {
      return errorResponse("Product not found", 404);
    }

    // Update product
    const updatedProduct = {
      ...product,
      name: body.name || product.name,
      price: body.price !== undefined ? body.price : product.price,
      category: body.category || product.category,
      unit: body.unit || product.unit,
      image: body.image || product.image,
      imageUrl: body.imageUrl !== undefined ? body.imageUrl : product.imageUrl,
      description:
        body.description !== undefined ? body.description : product.description,
      descriptionType:
        body.descriptionType !== undefined
          ? body.descriptionType
          : product.descriptionType,
      descriptionImageUrl:
        body.descriptionImageUrl !== undefined
          ? body.descriptionImageUrl
          : product.descriptionImageUrl,
      barcode: body.barcode !== undefined ? body.barcode : product.barcode,
      stock: body.stock !== undefined ? body.stock : product.stock,
      active: body.active !== undefined ? body.active : product.active,
      updatedAt: new Date().toISOString(),
      GSI1PK: `CATEGORY#${body.category || product.category}`,
      GSI1SK: `PRODUCT#${body.name || product.name}`,
    };

    await dbPut(updatedProduct);

    return successResponse({
      message: "Product updated successfully",
      product: {
        productId: updatedProduct.productId,
        name: updatedProduct.name,
        price: updatedProduct.price,
        category: updatedProduct.category,
        unit: updatedProduct.unit,
        image: updatedProduct.image,
        imageUrl: updatedProduct.imageUrl,
        description: updatedProduct.description,
        descriptionType: updatedProduct.descriptionType,
        descriptionImageUrl: updatedProduct.descriptionImageUrl,
        barcode: updatedProduct.barcode,
        stock: updatedProduct.stock,
        active: updatedProduct.active,
      },
    });
  } catch (error) {
    console.error("Update Product Error:", error);
    return errorResponse("Failed to update product", 500, error);
  }
};

// Delete product (Admin only)
export const deleteProduct = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    const role = event.requestContext.authorizer?.role;

    if (role !== "admin") {
      return errorResponse("Forbidden: Admin access required", 403);
    }

    const productId = event.pathParameters?.id;

    if (!productId) {
      return errorResponse("Product ID is required", 400);
    }

    const product = await dbGet({
      PK: `PRODUCT#${productId}`,
      SK: "METADATA",
    });

    if (!product) {
      return errorResponse("Product not found", 404);
    }

    await dbDelete({
      PK: `PRODUCT#${productId}`,
      SK: "METADATA",
    });

    return successResponse({
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Delete Product Error:", error);
    return errorResponse("Failed to delete product", 500, error);
  }
};

// Upload product image to S3 (Admin only)
export const uploadImage = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    const role = event.requestContext.authorizer?.role;

    if (role !== "admin") {
      return errorResponse("Forbidden: Admin access required", 403);
    }

    const contentType =
      event.headers["content-type"] || event.headers["Content-Type"] || "";

    if (!contentType.includes("multipart/form-data")) {
      return errorResponse("Content-Type must be multipart/form-data", 400);
    }

    // Parse multipart form data
    const body = event.isBase64Encoded
      ? Buffer.from(event.body || "", "base64").toString("binary")
      : event.body || "";

    const parsedData = parseMultipartFormData(body, contentType);

    if (!parsedData) {
      return errorResponse("Failed to parse form data", 400);
    }

    const { file, fileType, fields } = parsedData;
    const type = fields.type as "icon" | "description";

    // Validate type
    if (type !== "icon" && type !== "description") {
      return errorResponse("Type must be 'icon' or 'description'", 400);
    }

    // Validate file type
    if (!fileType.startsWith("image/")) {
      return errorResponse("File must be an image", 400);
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.length > maxSize) {
      return errorResponse("File size must be less than 5MB", 400);
    }

    // Upload to S3
    const imageUrl = await uploadImageToS3(file, fileType, type);

    return successResponse({
      imageUrl,
      message: "Image uploaded successfully",
    });
  } catch (error) {
    console.error("Upload Image Error:", error);
    return errorResponse("Failed to upload image", 500, error);
  }
};
