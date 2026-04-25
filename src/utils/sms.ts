import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

const sns = new SNSClient({
  region: process.env.SNS_REGION || process.env.AWS_REGION || "us-east-1",
});

/**
 * Send SMS via AWS SNS
 * @param phoneNumber Phone number in E.164 format (e.g., +919876543210)
 * @param message SMS message to send
 * @returns Promise<boolean> Success status
 */
export const sendSMS = async (
  phoneNumber: string,
  message: string,
): Promise<boolean> => {
  try {
    // Ensure phone number starts with country code
    const formattedPhone = phoneNumber.startsWith("+")
      ? phoneNumber
      : `+91${phoneNumber}`; // Assuming India, change for other countries

    const command = new PublishCommand({
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
  } catch (error) {
    console.error("Failed to send SMS:", error);
    return false;
  }
};

/**
 * Send OTP via SMS
 * @param phoneNumber Phone number
 * @param otp OTP code
 */
export const sendOTPSMS = async (
  phoneNumber: string,
  otp: string,
): Promise<boolean> => {
  const message = `Your QuickNeeds verification code is: ${otp}. Valid for 10 minutes. Do not share this code with anyone.`;
  return sendSMS(phoneNumber, message);
};
