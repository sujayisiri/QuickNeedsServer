import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { dbGet, dbPut } from "../utils/dynamodb";
import { successResponse, errorResponse, parseBody } from "../utils/response";
import { User } from "../types";

// Get user profile
export const getProfile = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    const authenticatedPhone = event.requestContext.authorizer?.phoneNumber;
    const role = event.requestContext.authorizer?.role;

    if (!authenticatedPhone) {
      return errorResponse("Unauthorized", 401);
    }

    // Allow admin to fetch any user's profile via query parameter
    const requestedPhone = event.queryStringParameters?.phoneNumber;
    
    let phoneNumberToFetch = authenticatedPhone;
    
    // If admin is requesting another user's profile
    if (requestedPhone && requestedPhone !== authenticatedPhone) {
      if (role !== "admin") {
        return errorResponse("Forbidden: Admin access required", 403);
      }
      phoneNumberToFetch = requestedPhone;
    }

    const user = (await dbGet({
      PK: `USER#${phoneNumberToFetch}`,
      SK: "PROFILE",
    })) as (User & { PK: string; SK: string }) | undefined;

    if (!user) {
      return errorResponse("User not found", 404);
    }

    return successResponse({
      phoneNumber: user.phoneNumber,
      name: user.name,
      role: user.role,
      address: user.address,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
    });
  } catch (error) {
    console.error("Get Profile Error:", error);
    return errorResponse("Failed to get profile", 500, error);
  }
};

// Update user profile
export const updateProfile = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    const phoneNumber = event.requestContext.authorizer?.phoneNumber;

    if (!phoneNumber) {
      return errorResponse("Unauthorized", 401);
    }

    const body = parseBody<{
      name?: string;
      address?: {
        flatNumber: string;
        floorNumber: string;
        blockNumber: string;
        address: string;
        landmark: string;
      };
    }>(event.body);

    if (!body) {
      return errorResponse("Invalid request body", 400);
    }

    const user = (await dbGet({
      PK: `USER#${phoneNumber}`,
      SK: "PROFILE",
    })) as (User & { PK: string; SK: string }) | undefined;

    if (!user) {
      return errorResponse("User not found", 404);
    }

    // Update user
    const updatedUser = {
      ...user,
      name: body.name || user.name,
      address: body.address || user.address,
      updatedAt: new Date().toISOString(),
    };

    await dbPut(updatedUser);

    return successResponse({
      message: "Profile updated successfully",
      user: {
        phoneNumber: updatedUser.phoneNumber,
        name: updatedUser.name,
        role: updatedUser.role,
        address: updatedUser.address,
      },
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    return errorResponse("Failed to update profile", 500, error);
  }
};
