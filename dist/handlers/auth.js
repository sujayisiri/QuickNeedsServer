"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyOtp = exports.sendOtp = void 0;
const dynamodb_1 = require("../utils/dynamodb");
const response_1 = require("../utils/response");
const auth_1 = require("../utils/auth");
const sms_1 = require("../utils/sms");
// Send OTP to user's phone
const sendOtp = async (event) => {
    try {
        const body = (0, response_1.parseBody)(event.body);
        if (!body || !body.phoneNumber) {
            return (0, response_1.errorResponse)("Phone number is required", 400);
        }
        const { phoneNumber } = body;
        // Validate phone number format (10 digits)
        if (!/^\d{10}$/.test(phoneNumber)) {
            return (0, response_1.errorResponse)("Invalid phone number format", 400);
        }
        // Generate OTP
        const otp = (0, auth_1.generateOTP)();
        const hashedOTP = (0, auth_1.hashOTP)(otp);
        // Store OTP in DynamoDB with TTL (10 minutes)
        const otpRecord = {
            PK: `OTP#${phoneNumber}`,
            SK: "VERIFICATION",
            phoneNumber,
            otp: hashedOTP,
            expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
            attempts: 0,
            verified: false,
            TTL: Math.floor(Date.now() / 1000) + 600, // DynamoDB TTL in seconds
        };
        await (0, dynamodb_1.dbPut)(otpRecord);
        // Send OTP via SMS in production
        if (process.env.STAGE !== "dev") {
            const smsSent = await (0, sms_1.sendOTPSMS)(phoneNumber, otp);
            if (!smsSent) {
                console.warn("Failed to send SMS, but OTP was stored");
            }
        }
        // In production, don't return OTP in response
        console.log(`OTP for ${phoneNumber}: ${otp}`);
        return (0, response_1.successResponse)({
            message: "OTP sent successfully",
            // Remove this in production:
            otp: process.env.STAGE === "dev" ? otp : undefined,
        });
    }
    catch (error) {
        console.error("Send OTP Error:", error);
        return (0, response_1.errorResponse)("Failed to send OTP", 500, error);
    }
};
exports.sendOtp = sendOtp;
// Verify OTP and login user
const verifyOtp = async (event) => {
    try {
        console.log("Verify OTP started");
        const body = (0, response_1.parseBody)(event.body);
        if (!body || !body.phoneNumber || !body.otp) {
            return (0, response_1.errorResponse)("Phone number and OTP are required", 400);
        }
        const { phoneNumber, otp } = body;
        console.log(`Verifying OTP for phone: ${phoneNumber}`);
        // Get OTP record
        console.log("Fetching OTP record from DynamoDB");
        const otpRecord = (await (0, dynamodb_1.dbGet)({
            PK: `OTP#${phoneNumber}`,
            SK: "VERIFICATION",
        }));
        if (!otpRecord) {
            console.log("OTP record not found");
            return (0, response_1.errorResponse)("OTP not found or expired", 400);
        }
        console.log("OTP record found, checking expiry");
        // Check if OTP is expired
        if (otpRecord.expiresAt < Date.now()) {
            return (0, response_1.errorResponse)("OTP has expired", 400);
        }
        // Check if too many attempts
        if (otpRecord.attempts >= 5) {
            return (0, response_1.errorResponse)("Too many failed attempts. Please request a new OTP", 400);
        }
        console.log("Comparing OTP");
        // Verify OTP
        const isValid = (0, auth_1.compareOTP)(otp, otpRecord.otp);
        if (!isValid) {
            console.log("Invalid OTP, incrementing attempts");
            // Increment attempts
            await (0, dynamodb_1.dbPut)({
                ...otpRecord,
                attempts: otpRecord.attempts + 1,
            });
            return (0, response_1.errorResponse)("Invalid OTP", 400);
        }
        console.log("OTP valid, marking as verified");
        // Mark OTP as verified
        await (0, dynamodb_1.dbPut)({
            ...otpRecord,
            verified: true,
        });
        console.log("Fetching user profile");
        // Check if user exists
        let user = (await (0, dynamodb_1.dbGet)({
            PK: `USER#${phoneNumber}`,
            SK: "PROFILE",
        }));
        // Create user if doesn't exist
        if (!user) {
            console.log("Creating new user");
            user = {
                PK: `USER#${phoneNumber}`,
                SK: "PROFILE",
                phoneNumber,
                role: "user", // Default role
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            await (0, dynamodb_1.dbPut)(user);
        }
        else {
            console.log("Updating existing user");
            // Update last login
            user.lastLogin = new Date().toISOString();
            await (0, dynamodb_1.dbPut)(user);
        }
        console.log("Generating JWT token");
        // Generate JWT token
        const token = (0, auth_1.generateToken)({
            phoneNumber: user.phoneNumber,
            role: user.role,
        });
        console.log("Verify OTP successful");
        return (0, response_1.successResponse)({
            message: "Login successful",
            token,
            user: {
                phoneNumber: user.phoneNumber,
                name: user.name,
                role: user.role,
                address: user.address,
            },
        });
    }
    catch (error) {
        console.error("Verify OTP Error:", error);
        return (0, response_1.errorResponse)("Failed to verify OTP", 500, error);
    }
};
exports.verifyOtp = verifyOtp;
//# sourceMappingURL=auth.js.map