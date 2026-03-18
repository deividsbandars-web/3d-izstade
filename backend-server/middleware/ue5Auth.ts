import { Request, Response, NextFunction } from 'express';
import { getSupabase } from '../services/supabase.js';

/**
 * Middleware to protect Unreal Engine endpoints using a simple API Key.
 * Bypasses full Supabase JWT for the 3D client performance.
 */
export const ue5AuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const apiKey = req.headers['x-warpala-api-key'];

    if (!apiKey) {
        return res.status(401).json({ error: 'UE5 API Key required' });
    }

    // In a real scenario, we'd check against the `api_keys` table.
    // For this prototype, we'll use a secret defined in .env or a hardcoded fallback.
    const validKey = process.env.UE5_SECRET_KEY || 'warpala-ue5-bridge-2026';

    if (apiKey !== validKey) {
        return res.status(403).json({ error: 'Invalid UE5 API Key' });
    }

    next();
};
