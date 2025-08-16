import { Request, Response } from 'express';
declare class AuthController {
    register: (req: Request, res: Response, next: import("express").NextFunction) => void;
    login: (req: Request, res: Response, next: import("express").NextFunction) => void;
    refreshToken: (req: Request, res: Response, next: import("express").NextFunction) => void;
    logout: (req: Request, res: Response, next: import("express").NextFunction) => void;
    logoutAll: (req: Request, res: Response, next: import("express").NextFunction) => void;
    changePassword: (req: Request, res: Response, next: import("express").NextFunction) => void;
    requestPasswordReset: (req: Request, res: Response, next: import("express").NextFunction) => void;
    confirmPasswordReset: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getProfile: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getSessions: (req: Request, res: Response, next: import("express").NextFunction) => void;
    revokeSession: (req: Request, res: Response, next: import("express").NextFunction) => void;
    verifyToken: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
declare const _default: AuthController;
export default _default;
//# sourceMappingURL=authController.d.ts.map