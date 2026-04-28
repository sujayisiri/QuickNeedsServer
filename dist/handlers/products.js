"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProduct = exports.updateProduct = exports.createProduct = exports.getProduct = exports.listProducts = void 0;
const dynamodb_1 = require("../utils/dynamodb");
const response_1 = require("../utils/response");
const uuid_1 = require("uuid");
// List all products (with optional category filter)
const listProducts = async (event) => {
    try {
        const category = event.queryStringParameters?.category;
        const limit = parseInt(event.queryStringParameters?.limit || "50");
        let result;
        if (category) {
            // Query by category using GSI1
            result = await (0, dynamodb_1.dbQuery)({
                IndexName: "GSI1",
                KeyConditionExpression: "GSI1PK = :category",
                ExpressionAttributeValues: {
                    ":category": `CATEGORY#${category}`,
                },
                Limit: limit,
            });
        }
        else {
            // Scan all products (no category filter)
            result = await (0, dynamodb_1.dbScan)({
                FilterExpression: "begins_with(PK, :prefix) AND SK = :sk",
                ExpressionAttributeValues: {
                    ":prefix": "PRODUCT#",
                    ":sk": "METADATA",
                },
                Limit: limit,
            });
        }
        const products = result.Items?.map((item) => ({
            productId: item.productId,
            name: item.name,
            price: item.price,
            category: item.category,
            unit: item.unit,
            image: item.image,
            description: item.description,
            barcode: item.barcode,
            stock: item.stock,
            active: item.active,
        })) || [];
        return (0, response_1.successResponse)({
            products,
            count: products.length,
        });
    }
    catch (error) {
        console.error("List Products Error:", error);
        return (0, response_1.errorResponse)("Failed to list products", 500, error);
    }
};
exports.listProducts = listProducts;
// Get single product by ID
const getProduct = async (event) => {
    try {
        const productId = event.pathParameters?.id;
        if (!productId) {
            return (0, response_1.errorResponse)("Product ID is required", 400);
        }
        const product = (await (0, dynamodb_1.dbGet)({
            PK: `PRODUCT#${productId}`,
            SK: "METADATA",
        }));
        if (!product) {
            return (0, response_1.errorResponse)("Product not found", 404);
        }
        return (0, response_1.successResponse)({
            productId: product.productId,
            name: product.name,
            price: product.price,
            category: product.category,
            unit: product.unit,
            image: product.image,
            description: product.description,
            barcode: product.barcode,
            stock: product.stock,
            active: product.active,
        });
    }
    catch (error) {
        console.error("Get Product Error:", error);
        return (0, response_1.errorResponse)("Failed to get product", 500, error);
    }
};
exports.getProduct = getProduct;
// Create new product (Admin only)
const createProduct = async (event) => {
    try {
        const phoneNumber = event.requestContext.authorizer?.phoneNumber;
        const role = event.requestContext.authorizer?.role;
        if (role !== "admin") {
            return (0, response_1.errorResponse)("Forbidden: Admin access required", 403);
        }
        const body = (0, response_1.parseBody)(event.body);
        if (!body) {
            return (0, response_1.errorResponse)("Invalid request body", 400);
        }
        const { name, price, category, unit, image, description, barcode, stock } = body;
        if (!name || !price || !category || !unit || !image) {
            return (0, response_1.errorResponse)("Missing required fields", 400);
        }
        const productId = (0, uuid_1.v4)();
        const now = new Date().toISOString();
        const product = {
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
            description: description || "",
            barcode: barcode || "",
            stock: stock || 0,
            active: true,
            createdAt: now,
            updatedAt: now,
            createdBy: phoneNumber,
        };
        await (0, dynamodb_1.dbPut)(product);
        return (0, response_1.successResponse)({
            message: "Product created successfully",
            product: {
                productId: product.productId,
                name: product.name,
                price: product.price,
                category: product.category,
                unit: product.unit,
                image: product.image,
                description: product.description,
                barcode: product.barcode,
                stock: product.stock,
                active: product.active,
            },
        }, 201);
    }
    catch (error) {
        console.error("Create Product Error:", error);
        return (0, response_1.errorResponse)("Failed to create product", 500, error);
    }
};
exports.createProduct = createProduct;
// Update product (Admin only)
const updateProduct = async (event) => {
    try {
        const role = event.requestContext.authorizer?.role;
        if (role !== "admin") {
            return (0, response_1.errorResponse)("Forbidden: Admin access required", 403);
        }
        const productId = event.pathParameters?.id;
        if (!productId) {
            return (0, response_1.errorResponse)("Product ID is required", 400);
        }
        const body = (0, response_1.parseBody)(event.body);
        if (!body) {
            return (0, response_1.errorResponse)("Invalid request body", 400);
        }
        const product = (await (0, dynamodb_1.dbGet)({
            PK: `PRODUCT#${productId}`,
            SK: "METADATA",
        }));
        if (!product) {
            return (0, response_1.errorResponse)("Product not found", 404);
        }
        // Update product
        const updatedProduct = {
            ...product,
            name: body.name || product.name,
            price: body.price !== undefined ? body.price : product.price,
            category: body.category || product.category,
            unit: body.unit || product.unit,
            image: body.image || product.image,
            description: body.description !== undefined ? body.description : product.description,
            barcode: body.barcode !== undefined ? body.barcode : product.barcode,
            stock: body.stock !== undefined ? body.stock : product.stock,
            active: body.active !== undefined ? body.active : product.active,
            updatedAt: new Date().toISOString(),
            GSI1PK: `CATEGORY#${body.category || product.category}`,
            GSI1SK: `PRODUCT#${body.name || product.name}`,
        };
        await (0, dynamodb_1.dbPut)(updatedProduct);
        return (0, response_1.successResponse)({
            message: "Product updated successfully",
            product: {
                productId: updatedProduct.productId,
                name: updatedProduct.name,
                price: updatedProduct.price,
                category: updatedProduct.category,
                unit: updatedProduct.unit,
                image: updatedProduct.image,
                description: updatedProduct.description,
                barcode: updatedProduct.barcode,
                stock: updatedProduct.stock,
                active: updatedProduct.active,
            },
        });
    }
    catch (error) {
        console.error("Update Product Error:", error);
        return (0, response_1.errorResponse)("Failed to update product", 500, error);
    }
};
exports.updateProduct = updateProduct;
// Delete product (Admin only)
const deleteProduct = async (event) => {
    try {
        const role = event.requestContext.authorizer?.role;
        if (role !== "admin") {
            return (0, response_1.errorResponse)("Forbidden: Admin access required", 403);
        }
        const productId = event.pathParameters?.id;
        if (!productId) {
            return (0, response_1.errorResponse)("Product ID is required", 400);
        }
        const product = await (0, dynamodb_1.dbGet)({
            PK: `PRODUCT#${productId}`,
            SK: "METADATA",
        });
        if (!product) {
            return (0, response_1.errorResponse)("Product not found", 404);
        }
        await (0, dynamodb_1.dbDelete)({
            PK: `PRODUCT#${productId}`,
            SK: "METADATA",
        });
        return (0, response_1.successResponse)({
            message: "Product deleted successfully",
        });
    }
    catch (error) {
        console.error("Delete Product Error:", error);
        return (0, response_1.errorResponse)("Failed to delete product", 500, error);
    }
};
exports.deleteProduct = deleteProduct;
//# sourceMappingURL=products.js.map