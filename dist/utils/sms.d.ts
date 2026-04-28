/**
 * Send SMS via AWS SNS
 * @param phoneNumber Phone number in E.164 format (e.g., +919876543210)
 * @param message SMS message to send
 * @returns Promise<boolean> Success status
 */
export declare const sendSMS: (phoneNumber: string, message: string) => Promise<boolean>;
/**
 * Send OTP via SMS
 * @param phoneNumber Phone number
 * @param otp OTP code
 */
export declare const sendOTPSMS: (phoneNumber: string, otp: string) => Promise<boolean>;
//# sourceMappingURL=sms.d.ts.map