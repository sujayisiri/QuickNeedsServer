"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendOTPSMS = exports.sendSMS = void 0;
const client_sns_1 = require("@aws-sdk/client-sns");
const sns = new client_sns_1.SNSClient({
    region: process.env.SNS_REGION || process.env.AWS_REGION || "us-east-1",
});
/**
 * Send SMS via AWS SNS
 * @param phoneNumber Phone number in E.164 format (e.g., +919876543210)
 * @param message SMS message to send
 * @returns Promise<boolean> Success status
 */
const sendSMS = async (phoneNumber, message) => {
    try {
        // Ensure phone number starts with country code
        const formattedPhone = phoneNumber.startsWith("+")
            ? phoneNumber
            : `+91${phoneNumber}`; // Assuming India, change for other countries
        const command = new client_sns_1.PublishCommand({
            PhoneNumber: formattedPhone,
            Message: message,
            MessageAttributes: {
                "AWS.SNS.SMS.SMSType": {
                    DataType: "String",
                    StringValue: "Transactional", // Use Transactional for OTP
                },
            },
        });
        await sns.send(command);
        console.log(`SMS sent successfully to ${phoneNumber}`);
        return true;
    }
    catch (error) {
        console.error("Failed to send SMS:", error);
        return false;
    }
};
exports.sendSMS = sendSMS;
/**
 * Send OTP via SMS
 * @param phoneNumber Phone number
 * @param otp OTP code
 */
const sendOTPSMS = async (phoneNumber, otp) => {
    const message = `Your QuickNeeds verification code is: ${otp}. Valid for 10 minutes. Do not share this code with anyone.`;
    return (0, exports.sendSMS)(phoneNumber, message);
};
exports.sendOTPSMS = sendOTPSMS;
//# sourceMappingURL=sms.js.map