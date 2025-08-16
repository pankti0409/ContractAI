import { Response } from 'express';
declare class ChatController {
    createChat: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    getChats: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    getChatById: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    updateChat: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    deleteChat: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    sendMessage: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    getChatMessages: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    updateMessage: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    deleteMessage: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    searchChats: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    getChatStats: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    exportChat: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    streamMessage: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
}
declare const _default: ChatController;
export default _default;
//# sourceMappingURL=chatController.d.ts.map