"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequired = exports.generateId = exports.parseBody = exports.errorResponse = exports.successResponse = exports.response = void 0;
const response = (statusCode, body, headers = {}) => {
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
exports.response = response;
const successResponse = (data, statusCode = 200) => {
    return (0, exports.response)(statusCode, {
        success: true,
        data,
    });
};
exports.successResponse = successResponse;
const errorResponse = (message, statusCode = 400, error) => {
    console.error("Error:", message, error);
    return (0, exports.response)(statusCode, {
        success: false,
        error: message,
    });
};
exports.errorResponse = errorResponse;
const parseBody = (body) => {
    if (!body)
        return null;
    try {
        return JSON.parse(body);
    }
    catch (error) {
        return null;
    }
};
exports.parseBody = parseBody;
const generateId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
exports.generateId = generateId;
const validateRequired = (data, fields) => {
    for (const field of fields) {
        if (!data[field]) {
            return `Missing required field: ${field}`;
        }
    }
    return null;
};
exports.validateRequired = validateRequired;
//# sourceMappingURL=response.js.map