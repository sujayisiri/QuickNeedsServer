import {
  APIGatewayTokenAuthorizerEvent,
  APIGatewayAuthorizerResult,
} from "aws-lambda";
import { verifyToken } from "../utils/auth";

export const handler = async (
  event: APIGatewayTokenAuthorizerEvent,
): Promise<APIGatewayAuthorizerResult> => {
  try {
    const token = event.authorizationToken.replace("Bearer ", "");
    const decoded = verifyToken(token);

    if (!decoded) {
      throw new Error("Unauthorized");
    }

    return generatePolicy(decoded.phoneNumber, "Allow", event.methodArn, {
      phoneNumber: decoded.phoneNumber,
      role: decoded.role,
    });
  } catch (error) {
    console.error("Authorizer Error:", error);
    throw new Error("Unauthorized");
  }
};

const generatePolicy = (
  principalId: string,
  effect: "Allow" | "Deny",
  resource: string,
  context?: Record<string, any>,
): APIGatewayAuthorizerResult => {
  return {
    principalId,
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: effect,
          Resource: resource,
        },
      ],
    },
    context: context || {},
  };
};
