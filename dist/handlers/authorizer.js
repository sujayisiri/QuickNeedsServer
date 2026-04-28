"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const auth_1 = require("../utils/auth");
const handler = async (event) => {
    try {
        const token = event.authorizationToken.replace("Bearer ", "");
        const decoded = (0, auth_1.verifyToken)(token);
        if (!decoded) {
            throw new Error("Unauthorized");
        }
        const policy = generatePolicy(decoded.phoneNumber, "Allow", event.methodArn, {
            phoneNumber: decoded.phoneNumber,
            role: decoded.role,
        });
        return policy;
    }
    catch (error) {
        console.error("Authorizer Error:", error);
        throw new Error("Unauthorized");
    }
};
exports.handler = handler;
const generatePolicy = (principalId, effect, resource, context) => {
    // API Gateway requires context values to be strings, numbers, or booleans
    const stringifiedContext = {};
    if (context) {
        for (const key in context) {
            stringifiedContext[key] = String(context[key]);
        }
    }
    // Use wildcard to allow all methods in the API
    // Extract API Gateway ARN base and append wildcard
    // Example: arn:aws:execute-api:region:account:api-id/stage/METHOD/path -> arn:aws:execute-api:region:account:api-id/*/*
    const resourceParts = resource.split("/");
    const apiGatewayArn = resourceParts.slice(0, 2).join("/") + "/*";
    return {
        principalId,
        policyDocument: {
            Version: "2012-10-17",
            Statement: [
                {
                    Action: "execute-api:Invoke",
                    Effect: effect,
                    Resource: apiGatewayArn,
                },
            ],
        },
        context: stringifiedContext,
    };
};
//# sourceMappingURL=authorizer.js.map