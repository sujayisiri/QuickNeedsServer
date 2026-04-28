import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { dbGet, dbPut } from "../utils/dynamodb";
import { successResponse, errorResponse, parseBody } from "../utils/response";
import { generateOTP, hashOTP, compareOTP, generateToken } from "../utils/auth";
import { sendOTPSMS } from "../utils/sms";
import { User, OTPRecord } from "../types";

// Send OTP to user's phone
export const sendOtp = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    const body = parseBody<{ phoneNumber: string }>(event.body);

    if (!body || !body.phoneNumber) {
      return errorResponse("Phone number is required", 400);
    }

    const { phoneNumber } = body;

    // Validate phone number format (10 digits)
    if (!/^\d{10}$/.test(phoneNumber)) {
      return errorResponse("Invalid phone number format", 400);
    }

    // Generate OTP
    const otp = generateOTP();
    const hashedOTP = hashOTP(otp);

    // Store OTP in DynamoDB with TTL (10 minutes)
    const otpRecord: OTPRecord & { PK: string; SK: string; TTL: number } = {
      PK: `OTP#${phoneNumber}`,
      SK: "VERIFICATION",
      phoneNumber,
      otp: hashedOTP,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      attempts: 0,
      verified: false,
      TTL: Math.floor(Date.now() / 1000) + 600, // DynamoDB TTL in seconds
    };

    await dbPut(otpRecord);

    // Send OTP via SMS in production
    if (process.env.STAGE !== "dev") {
      const smsSent = await sendOTPSMS(phoneNumber, otp);
      if (!smsSent) {
        console.warn("Failed to send SMS, but OTP was stored");
      }
    }

    // In production, don't return OTP in response
    console.log(`OTP for ${phoneNumber}: ${otp}`);

    return successResponse({
      message: "OTP sent successfully",
      // Remove this in production:
      otp: process.env.STAGE === "dev" ? otp : undefined,
    });
  } catch (error) {
    console.error("Send OTP Error:", error);
    return errorResponse("Failed to send OTP", 500, error);
  }
};

// Verify OTP and login user
export const verifyOtp = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    console.log("Verify OTP started");
    const body = parseBody<{ phoneNumber: string; otp: string }>(event.body);

    if (!body || !body.phoneNumber || !body.otp) {
      return errorResponse("Phone number and OTP are required", 400);
    }

    const { phoneNumber, otp } = body;
    console.log(`Verifying OTP for phone: ${phoneNumber}`);

    // Get OTP record
    console.log("Fetching OTP record from DynamoDB");
    const otpRecord = (await dbGet({
      PK: `OTP#${phoneNumber}`,
      SK: "VERIFICATION",
    })) as (OTPRecord & { PK: string; SK: string }) | undefined;

    if (!otpRecord) {
      console.log("OTP record not found");
      return errorResponse("OTP not found or expired", 400);
    }

    console.log("OTP record found, checking expiry");
    // Check if OTP is expired
    if (otpRecord.expiresAt < Date.now()) {
      return errorResponse("OTP has expired", 400);
    }

    // Check if too many attempts
    if (otpRecord.attempts >= 5) {
      return errorResponse(
        "Too many failed attempts. Please request a new OTP",
        400,
      );
    }

    console.log("Comparing OTP");
    // Verify OTP
    const isValid = compareOTP(otp, otpRecord.otp);

    if (!isValid) {
      console.log("Invalid OTP, incrementing attempts");
      // Increment attempts
      await dbPut({
        ...otpRecord,
        attempts: otpRecord.attempts + 1,
      });
      return errorResponse("Invalid OTP", 400);
    }

    console.log("OTP valid, marking as verified");
    // Mark OTP as verified
    await dbPut({
      ...otpRecord,
      verified: true,
    });

    console.log("Fetching user profile");
    // Check if user exists
    let user = (await dbGet({
      PK: `USER#${phoneNumber}`,
      SK: "PROFILE",
    })) as (User & { PK: string; SK: string }) | undefined;

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
      await dbPut(user);
    } else {
      console.log("Updating existing user");
      // Update last login
      user.lastLogin = new Date().toISOString();
      await dbPut(user);
    }

    console.log("Generating JWT token");
    // Generate JWT token
    const token = generateToken({
      phoneNumber: user.phoneNumber,
      role: user.role,
    });

    console.log("Verify OTP successful");
    return successResponse({
      message: "Login successful",
      token,
      user: {
        phoneNumber: user.phoneNumber,
        name: user.name,
        role: user.role,
        address: user.address,
      },
    });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    return errorResponse("Failed to verify OTP", 500, error);
  }
};
