import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { dbGet, dbPut, dbQuery, dbBatchWrite, dbScan } from "../utils/dynamodb";
import { successResponse, errorResponse, parseBody } from "../utils/response";
import { Order } from "../types";
import { v4 as uuidv4 } from "uuid";

// Create new order
export const createOrder = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    const phoneNumber = event.requestContext.authorizer?.phoneNumber;

    if (!phoneNumber) {
      return errorResponse("Unauthorized", 401);
    }

    const body = parseBody<{
      items: Array<{
        productId: string;
        productName: string;
        productImage: string;
        price: number;
        quantity: number;
        unit: string;
      }>;
      deliveryAddress?: object;
    }>(event.body);

    if (!body || !body.items || body.items.length === 0) {
      return errorResponse("Items are required", 400);
    }

    const orderId = uuidv4();
    const now = new Date().toISOString();

    // Calculate total
    const total = body.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    // Create order
    const order: Order & {
      PK: string;
      SK: string;
      GSI1PK: string;
      GSI1SK: string;
      GSI2PK: string;
      GSI2SK: string;
    } = {
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
    await dbPut(order);

    // Batch write items
    const batchItems = orderItems.map((item) => ({
      PutRequest: {
        Item: item,
      },
    }));

    if (batchItems.length > 0) {
      await dbBatchWrite(batchItems);
    }

    return successResponse(
      {
        message: "Order created successfully",
        order: {
          orderId: order.orderId,
          status: order.status,
          total: order.total,
          itemCount: order.itemCount,
          createdAt: order.createdAt,
        },
      },
      201,
    );
  } catch (error) {
    console.error("Create Order Error:", error);
    return errorResponse("Failed to create order", 500, error);
  }
};

// List orders (user sees their orders, admin sees all)
export const listOrders = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    const phoneNumber = event.requestContext.authorizer?.phoneNumber;
    const role = event.requestContext.authorizer?.role;

    if (!phoneNumber) {
      return errorResponse("Unauthorized", 401);
    }

    const status = event.queryStringParameters?.status;
    const limit = parseInt(event.queryStringParameters?.limit || "50");

    let result;

    if (role === "admin") {
      // Admin can see all orders
      if (status) {
        // Filter by status using GSI2
        result = await dbQuery({
          IndexName: "GSI2",
          KeyConditionExpression: "GSI2PK = :status",
          ExpressionAttributeValues: {
            ":status": `STATUS#${status}`,
          },
          ScanIndexForward: false, // Newest first
          Limit: limit,
        });
      } else {
        // Get all orders using Scan
        result = await dbScan({
          FilterExpression: "begins_with(PK, :prefix) AND SK = :sk",
          ExpressionAttributeValues: {
            ":prefix": "ORDER#",
            ":sk": "METADATA",
          },
          Limit: limit,
        });
      }
    } else {
      // User can only see their orders using GSI1
      result = await dbQuery({
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :user",
        ExpressionAttributeValues: {
          ":user": `USER#${phoneNumber}`,
        },
        ScanIndexForward: false, // Newest first
        Limit: limit,
      });
    }

    const orders =
      result.Items?.map((item) => ({
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

    return successResponse({
      orders,
      count: orders.length,
    });
  } catch (error) {
    console.error("List Orders Error:", error);
    return errorResponse("Failed to list orders", 500, error);
  }
};

// Get single order with items
export const getOrder = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    const phoneNumber = event.requestContext.authorizer?.phoneNumber;
    const role = event.requestContext.authorizer?.role;
    const orderId = event.pathParameters?.id;

    console.log("Get Order - Auth Context:", {
      phoneNumber,
      role,
      roleType: typeof role,
      orderId,
      fullAuthorizer: event.requestContext.authorizer,
    });

    if (!phoneNumber || !orderId) {
      return errorResponse("Unauthorized or missing order ID", 401);
    }

    // Get order
    const order = (await dbGet({
      PK: `ORDER#${orderId}`,
      SK: "METADATA",
    })) as (Order & { PK: string; SK: string }) | undefined;

    if (!order) {
      return errorResponse("Order not found", 404);
    }

    console.log("Authorization check:", {
      role,
      orderOwner: order.orderedBy,
      requestingUser: phoneNumber,
      isAdmin: role === "admin",
    });

    // Check authorization (user can only see their orders)
    if (role !== "admin" && order.orderedBy !== phoneNumber) {
      console.log("Access denied - not admin and not order owner");
      return errorResponse("Forbidden", 403);
    }

    // Get order items
    const itemsResult = await dbQuery({
      KeyConditionExpression: "PK = :orderId AND begins_with(SK, :itemPrefix)",
      ExpressionAttributeValues: {
        ":orderId": `ORDER#${orderId}`,
        ":itemPrefix": "ITEM#",
      },
    });

    const items =
      itemsResult.Items?.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        productImage: item.productImage,
        price: item.price,
        quantity: item.quantity,
        unit: item.unit,
        subtotal: item.subtotal,
      })) || [];

    return successResponse({
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
  } catch (error) {
    console.error("Get Order Error:", error);
    return errorResponse("Failed to get order", 500, error);
  }
};

// Update order status (Admin only)
export const updateOrderStatus = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    const role = event.requestContext.authorizer?.role;

    if (role !== "admin") {
      return errorResponse("Forbidden: Admin access required", 403);
    }

    const orderId = event.pathParameters?.id;

    if (!orderId) {
      return errorResponse("Order ID is required", 400);
    }

    const body = parseBody<{
      status: "pending" | "accepted" | "delivered" | "cancelled";
    }>(event.body);

    if (!body || !body.status) {
      return errorResponse("Status is required", 400);
    }

    const validStatuses = ["pending", "accepted", "delivered", "cancelled"];
    if (!validStatuses.includes(body.status)) {
      return errorResponse("Invalid status", 400);
    }

    const order = (await dbGet({
      PK: `ORDER#${orderId}`,
      SK: "METADATA",
    })) as
      | (Order & {
          PK: string;
          SK: string;
          GSI1PK: string;
          GSI1SK: string;
          GSI2PK: string;
          GSI2SK: string;
        })
      | undefined;

    if (!order) {
      return errorResponse("Order not found", 404);
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
    } else if (body.status === "delivered") {
      updatedOrder.deliveredAt = now;
    }

    await dbPut(updatedOrder);

    return successResponse({
      message: "Order status updated successfully",
      order: {
        orderId: updatedOrder.orderId,
        status: updatedOrder.status,
        updatedAt: updatedOrder.updatedAt,
        acceptedAt: updatedOrder.acceptedAt,
        deliveredAt: updatedOrder.deliveredAt,
      },
    });
  } catch (error) {
    console.error("Update Order Status Error:", error);
    return errorResponse("Failed to update order status", 500, error);
  }
};
