"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateOrderStatus = exports.getOrder = exports.listOrders = exports.createOrder = void 0;
const dynamodb_1 = require("../utils/dynamodb");
const response_1 = require("../utils/response");
const uuid_1 = require("uuid");
const notifications_1 = require("./notifications");
// Create new order
const createOrder = async (event) => {
    try {
        const phoneNumber = event.requestContext.authorizer?.phoneNumber;
        if (!phoneNumber) {
            return (0, response_1.errorResponse)("Unauthorized", 401);
        }
        const body = (0, response_1.parseBody)(event.body);
        if (!body || !body.items || body.items.length === 0) {
            return (0, response_1.errorResponse)("Items are required", 400);
        }
        const orderId = (0, uuid_1.v4)();
        const now = new Date().toISOString();
        // Calculate total
        const total = body.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        // Create order
        const order = {
            PK: `ORDER#${orderId}`,
            SK: "METADATA",
            GSI1PK: `USER#${phoneNumber}`,
            GSI1SK: `ORDER#${now}`,
            GSI2PK: "STATUS#pending",
            GSI2SK: `ORDER#${now}`,
            orderId,
            orderedBy: phoneNumber,
            status: "pending",
            total,
            itemCount: body.items.length,
            deliveryAddress: body.deliveryAddress,
            createdAt: now,
            updatedAt: now,
        };
        // Create order items
        const orderItems = body.items.map((item) => ({
            PK: `ORDER#${orderId}`,
            SK: `ITEM#${item.productId}`,
            orderId,
            productId: item.productId,
            productName: item.productName,
            productImage: item.productImage,
            price: item.price,
            quantity: item.quantity,
            unit: item.unit,
            subtotal: item.price * item.quantity,
        }));
        // Save order and items
        await (0, dynamodb_1.dbPut)(order);
        // Batch write items
        const batchItems = orderItems.map((item) => ({
            PutRequest: {
                Item: item,
            },
        }));
        if (batchItems.length > 0) {
            await (0, dynamodb_1.dbBatchWrite)(batchItems);
        }
        // Send push notification to admins about new order
        try {
            await (0, notifications_1.notifyAdmins)("New Order Received", `Order #${orderId.substring(0, 8)} - ₹${total} (${body.items.length} items)`, {
                orderId,
                type: "new_order",
                total: total.toString(),
            });
        }
        catch (notifError) {
            console.error("Error sending notification to admins:", notifError);
            // Don't fail the order creation if notification fails
        }
        return (0, response_1.successResponse)({
            message: "Order created successfully",
            order: {
                orderId: order.orderId,
                status: order.status,
                total: order.total,
                itemCount: order.itemCount,
                createdAt: order.createdAt,
            },
        }, 201);
    }
    catch (error) {
        console.error("Create Order Error:", error);
        return (0, response_1.errorResponse)("Failed to create order", 500, error);
    }
};
exports.createOrder = createOrder;
// List orders (user sees their orders, admin sees all)
const listOrders = async (event) => {
    try {
        const phoneNumber = event.requestContext.authorizer?.phoneNumber;
        const role = event.requestContext.authorizer?.role;
        if (!phoneNumber) {
            return (0, response_1.errorResponse)("Unauthorized", 401);
        }
        const status = event.queryStringParameters?.status;
        const limit = parseInt(event.queryStringParameters?.limit || "50");
        let result;
        if (role === "admin") {
            // Admin can see all orders
            if (status) {
                // Filter by status using GSI2
                result = await (0, dynamodb_1.dbQuery)({
                    IndexName: "GSI2",
                    KeyConditionExpression: "GSI2PK = :status",
                    ExpressionAttributeValues: {
                        ":status": `STATUS#${status}`,
                    },
                    ScanIndexForward: false, // Newest first
                    Limit: limit,
                });
            }
            else {
                // Get all orders using Scan
                result = await (0, dynamodb_1.dbScan)({
                    FilterExpression: "begins_with(PK, :prefix) AND SK = :sk",
                    ExpressionAttributeValues: {
                        ":prefix": "ORDER#",
                        ":sk": "METADATA",
                    },
                    Limit: limit,
                });
            }
        }
        else {
            // User can only see their orders using GSI1
            result = await (0, dynamodb_1.dbQuery)({
                IndexName: "GSI1",
                KeyConditionExpression: "GSI1PK = :user",
                ExpressionAttributeValues: {
                    ":user": `USER#${phoneNumber}`,
                },
                ScanIndexForward: false, // Newest first
                Limit: limit,
            });
        }
        const orders = result.Items?.map((item) => ({
            orderId: item.orderId,
            orderedBy: item.orderedBy,
            status: item.status,
            total: item.total,
            itemCount: item.itemCount,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            acceptedAt: item.acceptedAt,
            deliveredAt: item.deliveredAt,
        })) || [];
        return (0, response_1.successResponse)({
            orders,
            count: orders.length,
        });
    }
    catch (error) {
        console.error("List Orders Error:", error);
        return (0, response_1.errorResponse)("Failed to list orders", 500, error);
    }
};
exports.listOrders = listOrders;
// Get single order with items
const getOrder = async (event) => {
    try {
        const phoneNumber = event.requestContext.authorizer?.phoneNumber;
        const role = event.requestContext.authorizer?.role;
        const orderId = event.pathParameters?.id;
        if (!phoneNumber || !orderId) {
            return (0, response_1.errorResponse)("Unauthorized or missing order ID", 401);
        }
        // Get order
        const order = (await (0, dynamodb_1.dbGet)({
            PK: `ORDER#${orderId}`,
            SK: "METADATA",
        }));
        if (!order) {
            return (0, response_1.errorResponse)("Order not found", 404);
        }
        // Check authorization (user can only see their orders)
        if (role !== "admin" && order.orderedBy !== phoneNumber) {
            return (0, response_1.errorResponse)("Forbidden", 403);
        }
        // Get order items
        const itemsResult = await (0, dynamodb_1.dbQuery)({
            KeyConditionExpression: "PK = :orderId AND begins_with(SK, :itemPrefix)",
            ExpressionAttributeValues: {
                ":orderId": `ORDER#${orderId}`,
                ":itemPrefix": "ITEM#",
            },
        });
        const items = itemsResult.Items?.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            productImage: item.productImage,
            price: item.price,
            quantity: item.quantity,
            unit: item.unit,
            subtotal: item.subtotal,
        })) || [];
        return (0, response_1.successResponse)({
            order: {
                orderId: order.orderId,
                orderedBy: order.orderedBy,
                status: order.status,
                total: order.total,
                itemCount: order.itemCount,
                deliveryAddress: order.deliveryAddress,
                createdAt: order.createdAt,
                updatedAt: order.updatedAt,
                acceptedAt: order.acceptedAt,
                deliveredAt: order.deliveredAt,
                items,
            },
        });
    }
    catch (error) {
        console.error("Get Order Error:", error);
        return (0, response_1.errorResponse)("Failed to get order", 500, error);
    }
};
exports.getOrder = getOrder;
// Update order status (Admin only)
const updateOrderStatus = async (event) => {
    try {
        const role = event.requestContext.authorizer?.role;
        if (role !== "admin") {
            return (0, response_1.errorResponse)("Forbidden: Admin access required", 403);
        }
        const orderId = event.pathParameters?.id;
        if (!orderId) {
            return (0, response_1.errorResponse)("Order ID is required", 400);
        }
        const body = (0, response_1.parseBody)(event.body);
        if (!body || !body.status) {
            return (0, response_1.errorResponse)("Status is required", 400);
        }
        const validStatuses = ["pending", "accepted", "delivered", "cancelled"];
        if (!validStatuses.includes(body.status)) {
            return (0, response_1.errorResponse)("Invalid status", 400);
        }
        const order = (await (0, dynamodb_1.dbGet)({
            PK: `ORDER#${orderId}`,
            SK: "METADATA",
        }));
        if (!order) {
            return (0, response_1.errorResponse)("Order not found", 404);
        }
        const now = new Date().toISOString();
        // Update order
        const updatedOrder = {
            ...order,
            status: body.status,
            updatedAt: now,
            GSI2PK: `STATUS#${body.status}`, // Update GSI2PK for status queries
        };
        // Add timestamp for status changes
        if (body.status === "accepted") {
            updatedOrder.acceptedAt = now;
        }
        else if (body.status === "delivered") {
            updatedOrder.deliveredAt = now;
        }
        await (0, dynamodb_1.dbPut)(updatedOrder);
        // Send push notification to user about status change
        try {
            if (body.status === "accepted") {
                await (0, notifications_1.notifyUser)(order.orderedBy, "Order Accepted", `Your order #${orderId.substring(0, 8)} has been accepted and is being prepared`, {
                    orderId,
                    type: "order_accepted",
                    status: body.status,
                });
            }
            else if (body.status === "delivered") {
                await (0, notifications_1.notifyUser)(order.orderedBy, "Order Delivered", `Your order #${orderId.substring(0, 8)} has been delivered. Thank you for shopping with us!`, {
                    orderId,
                    type: "order_delivered",
                    status: body.status,
                });
            }
            else if (body.status === "cancelled") {
                await (0, notifications_1.notifyUser)(order.orderedBy, "Order Cancelled", `Your order #${orderId.substring(0, 8)} has been cancelled`, {
                    orderId,
                    type: "order_cancelled",
                    status: body.status,
                });
            }
        }
        catch (notifError) {
            console.error("Error sending notification to user:", notifError);
            // Don't fail the status update if notification fails
        }
        return (0, response_1.successResponse)({
            message: "Order status updated successfully",
            order: {
                orderId: updatedOrder.orderId,
                status: updatedOrder.status,
                updatedAt: updatedOrder.updatedAt,
                acceptedAt: updatedOrder.acceptedAt,
                deliveredAt: updatedOrder.deliveredAt,
            },
        });
    }
    catch (error) {
        console.error("Update Order Status Error:", error);
        return (0, response_1.errorResponse)("Failed to update order status", 500, error);
    }
};
exports.updateOrderStatus = updateOrderStatus;
//# sourceMappingURL=orders.js.map