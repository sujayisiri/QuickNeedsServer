import { JWTPayload } from "../types";
export declare const generateToken: (payload: JWTPayload) => string;
export declare const verifyToken: (token: string) => JWTPayload | null;
export declare const hashOTP: (otp: string) => string;
export declare const compareOTP: (otp: string, hash: string) => boolean;
export declare const generateOTP: () => string;
export declare const extractToken: (authHeader: string | undefined) => string | null;
//# sourceMappingURL=auth.d.ts.map