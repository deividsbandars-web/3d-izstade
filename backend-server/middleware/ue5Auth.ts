import { Request, Response, NextFunction } from 'express';
import { getBackendRuntimeEnv } from '../config/runtimeEnv.js';

/**
 * Middleware to protect Unreal Engine endpoints using a simple API Key.
 * Bypasses full Supabase JWT for the 3D client performance.
 */
export const ue5AuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const apiKey = req.headers['x-warpala-api-key'];

    if (!apiKey) {
        return res.status(401).json({ error: 'UE5 API Key required' });
    }

    const validKey = getBackendRuntimeEnv().ue5SecretKey;

    if (apiKey !== validKey) {
        return res.status(403).json({ error: 'Invalid UE5 API Key' });
    }

    next();
};
