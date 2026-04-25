import { APIGatewayProxyResult } from "aws-lambda";

export const response = (
  statusCode: number,
  body: any,
  headers: Record<string, string> = {},
): APIGatewayProxyResult => {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
      ...headers,
    },
    body: JSON.stringify(body),
  };
};

export const successResponse = (data: any, statusCode = 200) => {
  return response(statusCode, {
    success: true,
    data,
  });
};

export const errorResponse = (
  message: string,
  statusCode = 400,
  error?: any,
) => {
  console.error("Error:", message, error);
  return response(statusCode, {
    success: false,
    error: message,
  });
};

export const parseBody = <T>(body: string | null): T | null => {
  if (!body) return null;
  try {
    return JSON.parse(body) as T;
  } catch (error) {
    return null;
  }
};

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const validateRequired = (
  data: any,
  fields: string[],
): string | null => {
  for (const field of fields) {
    if (!data[field]) {
      return `Missing required field: ${field}`;
    }
  }
  return null;
};
