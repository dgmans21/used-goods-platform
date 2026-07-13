import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';

/**
 * 보호 라우트에서 사용: 토큰 없거나/유효하지 않으면 401
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';

  if (!token) {
    return res.status(401).json({ message: '인증이 필요합니다. (토큰 없음)' });
  }

  try {
    const payload = verifyAccessToken(token); // { user_id: number }
    (req as any).userId = payload.user_id;
    return next();
  } catch (err: any) {
    if (err.message === 'Token expired') {
      return res.status(401).json({ message: '토큰이 만료되었습니다.' });
    }
    return res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
  }
}