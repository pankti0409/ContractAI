import { JWTPayload } from '../types';
export declare const generateAccessToken: (payload: Omit<JWTPayload, "iat" | "exp">) => string;
export declare const generateRefreshToken: (payload: Omit<JWTPayload, "iat" | "exp">) => string;
export declare const verifyAccessToken: (token: string) => JWTPayload;
export declare const verifyRefreshToken: (token: string) => JWTPayload;
export declare const extractTokenFromHeader: (authHeader: string | undefined) => string;
export declare const generateTokens: (user: {
    id: string;
    email: string;
    role: string;
}) => {
    accessToken: string;
    refreshToken: string;
};
export declare const getTokenExpiration: (token: string) => Date;
//# sourceMappingURL=jwt.d.ts.map