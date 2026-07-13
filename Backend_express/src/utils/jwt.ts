import jwt from 'jsonwebtoken';
import { env } from "process";


interface JwtPayload {
    user_id: number;
}


// AccessToken 검증
export function verifyAccessToken(token: string): JwtPayload {
    try {
      const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string) as JwtPayload;
      return payload;
    } catch (err: any) {
      // 에러 구분 가능
      if (err.name === "TokenExpiredError") {
        throw new Error("Token expired");
      }
      if (err.name === "JsonWebTokenError") {
        throw new Error("Invalid token");
      }
      throw new Error("Token verification failed");
    }
  }



// RefreshToken 검증
export function verifyRefreshToken(token: string): JwtPayload {
    try {
      const payload = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET as string) as JwtPayload;
      return payload;
    } catch (err: any) {
      throw new Error("Refresh token verification failed");
    }
  }