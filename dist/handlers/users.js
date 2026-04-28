"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = exports.getProfile = void 0;
const dynamodb_1 = require("../utils/dynamodb");
const response_1 = require("../utils/response");
// Get user profile
const getProfile = async (event) => {
    try {
        const authenticatedPhone = event.requestContext.authorizer?.phoneNumber;
        const role = event.requestContext.authorizer?.role;
        if (!authenticatedPhone) {
            return (0, response_1.errorResponse)("Unauthorized", 401);
        }
        // Allow admin to fetch any user's profile via query parameter
        const requestedPhone = event.queryStringParameters?.phoneNumber;
        let phoneNumberToFetch = authenticatedPhone;
        // If admin is requesting another user's profile
        if (requestedPhone && requestedPhone !== authenticatedPhone) {
            if (role !== "admin") {
                return (0, response_1.errorResponse)("Forbidden: Admin access required", 403);
            }
            phoneNumberToFetch = requestedPhone;
        }
        const user = (await (0, dynamodb_1.dbGet)({
            PK: `USER#${phoneNumberToFetch}`,
            SK: "PROFILE",
        }));
        if (!user) {
            return (0, response_1.errorResponse)("User not found", 404);
        }
        return (0, response_1.successResponse)({
            phoneNumber: user.phoneNumber,
            name: user.name,
            role: user.role,
            address: user.address,
            createdAt: user.createdAt,
            lastLogin: user.lastLogin,
        });
    }
    catch (error) {
        console.error("Get Profile Error:", error);
        return (0, response_1.errorResponse)("Failed to get profile", 500, error);
    }
};
exports.getProfile = getProfile;
// Update user profile
const updateProfile = async (event) => {
    try {
        const phoneNumber = event.requestContext.authorizer?.phoneNumber;
        if (!phoneNumber) {
            return (0, response_1.errorResponse)("Unauthorized", 401);
        }
        const body = (0, response_1.parseBody)(event.body);
        if (!body) {
            return (0, response_1.errorResponse)("Invalid request body", 400);
        }
        const user = (await (0, dynamodb_1.dbGet)({
            PK: `USER#${phoneNumber}`,
            SK: "PROFILE",
        }));
        if (!user) {
            return (0, response_1.errorResponse)("User not found", 404);
        }
        // Update user
        const updatedUser = {
            ...user,
            name: body.name || user.name,
            address: body.address || user.address,
            updatedAt: new Date().toISOString(),
        };
        await (0, dynamodb_1.dbPut)(updatedUser);
        return (0, response_1.successResponse)({
            message: "Profile updated successfully",
            user: {
                phoneNumber: updatedUser.phoneNumber,
                name: updatedUser.name,
                role: updatedUser.role,
                address: updatedUser.address,
            },
        });
    }
    catch (error) {
        console.error("Update Profile Error:", error);
        return (0, response_1.errorResponse)("Failed to update profile", 500, error);
    }
};
exports.updateProfile = updateProfile;
//# sourceMappingURL=users.js.map