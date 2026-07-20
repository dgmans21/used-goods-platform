import { Request, Response } from 'express';
import { prisma } from '../db';
import bcrypt from 'bcrypt';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();
const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY;

const headers = {
    'Authorization': `KakaoAK ${KAKAO_REST_API_KEY}`
};

//bigint serializer 에러 바로 bigint 를 문자로 리턴 함수 세팅
(BigInt.prototype as any).toJSON = function() {
    return this.toString();
};

//회원전체조회
export const getUsers = async (req: Request, res: Response) => {
    const users = await prisma.user.findMany();
    res.json(users);
    };
//회원가입



export const createUser = async (req: Request, res: Response) => {
  const { user_id, pw, nickname, address, address2 } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(pw, 10);

    let userLat: number | null = null;
    let userLng: number | null = null;

    // 카카오 주소 API를 이용한 좌표 변환
    if (address) {
      const kakaoResponse = await axios.get(
        "https://dapi.kakao.com/v2/local/search/address.json",
        {
          headers: {
            Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}`,
          },
          params: {
            query: address,
          },
        }
      );

      const document = kakaoResponse.data.documents?.[0];

      if (document) {
        // x = 경도, y = 위도
        userLng = Number(document.x);
        userLat = Number(document.y);
      }
    }

    const user = await prisma.user.create({
      data: {
        user_id,
        pw: hashedPassword,
        nickname,
        address,
        address2,
        point: 0, // 회원가입 시 기본 포인트
        user_lat: userLat,
        user_lng: userLng,
        created_at: new Date(),
        is_active: "Y",
      },
    });

    const { pw: _, ...userWithoutPassword } = user;

    return res.status(200).json({
      message: "회원가입완료",
      data: userWithoutPassword,
    });
  } catch (error) {
    console.error("createUser error:", error);

    return res.status(500).json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : error,
    });
  }
};

//id중복체크
export const checkUserId = async (req: Request, res: Response) => {
    const {user_id} = req.body;
    const user = await prisma.user.findUnique({
        where: {user_id},
    });
    res.status(200).json({message: 'id중복체크',data: user});
};
//password validation
export const validatePassword = async (req: Request, res: Response) => {
    const { pw } = req.body;

    try {
        if (pw.length < 8) {
            return res.status(400).json({
                message: "비밀번호는 8자 이상이어야 합니다."
            });
        }

        if (pw.length > 50) {
            return res.status(400).json({
                message: "비밀번호는 50자 이하이어야 합니다."
            });
        }

        // 영문 + 특수문자 포함
        const passwordRegex =
            /^(?=.*[A-Za-z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]).{8,16}$/;

        if (!passwordRegex.test(pw)) {
            return res.status(400).json({
                message: "비밀번호는 영문과 특수문자를 각각 1개 이상 포함해야 합니다."
            });
        }

        return res.status(200).json({
            message: "password validation",
            data: pw
        });

    } catch (error) {
        console.error("createUser error:", error);
    
        res.status(500).json({
            message: 'Internal server error',
            error: error instanceof Error ? error.message : error
        });
    }
};
//카카오지도 위도경도 받아오기
export const getKakaoLatLng = async (req: Request, res: Response) => {
    const { address } = req.body;
    const latLng = await getKakaoLatLngFunction(address);
    res.status(200).json({message: '카카오지도 위도경도',data: latLng});
};
//카카오지도 위도경도 받아오기 함수
export const getKakaoLatLngFunction = async (address: string) => {
    const url = `https://dapi.kakao.com/v2/local/search/address.json?query=${address}`;
    const response = await fetch(url);
    const data = await response.json() as {documents: {y: number, x: number}[]};
    return data.documents[0];
};
const toPublicUser = (user: {
  id: number;
  user_id: string | null;
  nickname: string | null;
  address: string | null;
  address2: string | null;
  point: number | null;
  created_at: Date | null;
  updated_at: Date | null;
  is_active: string | null;
  user_lat: number | null;
  user_lng: number | null;
  firebase_uid: string | null;
}) => ({
  id: user.id,
  user_id: user.user_id,
  nickname: user.nickname,
  address: user.address,
  address2: user.address2,
  point: user.point ?? 0,
  created_at: user.created_at,
  updated_at: user.updated_at,
  is_active: user.is_active,
  user_lat: user.user_lat,
  user_lng: user.user_lng,
  firebase_uid: user.firebase_uid,
});

export const login = async (req: Request, res: Response) => {
  try {
    const { user_id, pw } = req.body;

    const user = await prisma.user.findUnique({
      where: { user_id },
    });

    if (!user) {
      return res.status(401).json({
        message: "존재하지 않는 아이디입니다.",
      });
    }

    if (!user.pw) {
      return res.status(401).json({
        message: "비밀번호로 로그인할 수 없는 계정입니다. Google 로그인을 이용해 주세요.",
      });
    }

    const isMatch = await bcrypt.compare(pw, user.pw);

    if (!isMatch) {
      return res.status(401).json({
        message: "비밀번호가 일치하지 않습니다.",
      });
    }

    return res.status(200).json({
      message: "로그인 성공",
      data: toPublicUser(user as any),
    });
  } catch (error) {
    console.error("로그인 오류:", error);

    return res.status(500).json({
      message: "로그인 중 오류가 발생했습니다.",
    });
  }
};

/** Google 로그인: firebase_uid로 조회, 없으면 생성 후 반환 */
import { request, Response as ExpressResponse } from "express";

export const googleLogin = async (req: Request, res: ExpressResponse) => {
  try {
    const { user_id, nickname, address, address2, firebase_uid } = req.body;

    // 1. 필수 값 검증 (이 단계 이후로 두 값은 무조건 문자열입니다)
    if (!firebase_uid || !user_id) {
      return res.status(400).json({
        message: "firebase_uid와 user_id(email)는 필수입니다.",
      });
    }

    // 💡 해결의 핵심: Prisma 7 Strict 타입에 대응하기 위해 확실하게 String으로 단언(Assertion)
    const secureUid = firebase_uid as string;
    const secureEmail = user_id as string;

    // 2. Firebase UID로 기존 가입자 찾기
    const existingByUid = await prisma.user.findUnique({
      where: { 
        user_id: secureUid // 단축 문법 대신 명시적으로 매핑
      },
    });

    if (existingByUid) {
      return res.status(200).json({
        message: "Google 로그인 성공",
        data: toPublicUser(existingByUid as any),
      });
    }

    // 3. 동일 이메일로 이미 가입된 계정이 있으면 firebase_uid만 연동
    const existingByEmail = await prisma.user.findUnique({
      where: { 
        user_id: secureEmail 
      },
    });

    if (existingByEmail) {
      const linked = await prisma.user.update({
        where: { id: existingByEmail.id },
        data: {
          firebase_uid: secureUid,
          nickname: existingByEmail.nickname || (nickname as string)?.trim() || "Google 사용자",
        },
      });

      return res.status(200).json({
        message: "Google 계정 연결 및 로그인 성공",
        data: toPublicUser(linked as any),
      });
    }

    // 4. 신규 가입자 닉네임 유니크 처리
    let uniqueNickname = (nickname as string)?.trim() || "Google 사용자";
    const nicknameTaken = await prisma.user.findUnique({
      where: { nickname: uniqueNickname },
    });
    
    if (nicknameTaken) {
      uniqueNickname = `${uniqueNickname}_${secureUid.slice(0, 6)}`;
    }

    // 5. 신규 구글 유저 데이터베이스 생성
    const created = await prisma.user.create({
      data: {
        user_id: secureEmail,
        pw: null,
        nickname: uniqueNickname,
        address: address || "",
        address2: address2 || "",
        point: 0,
        firebase_uid: secureUid,
        created_at: new Date(),
        is_active: "Y", // 스키마 enum이 문자열 구조라면 그대로 유지
      },
    });

    return res.status(201).json({
      message: "Google 회원가입 및 로그인 성공",
      data: toPublicUser(created as any),
    });
  } catch (error) {
    console.error("Google 로그인 오류:", error);

    return res.status(500).json({
      message: "Google 로그인 중 오류가 발생했습니다.",
      error: error instanceof Error ? error.message : error,
    });
  }
};
export const loginFunction = async (req: Request, res: Response) => {
    try {
      const { user_id, pw } = req.body;
  
      const user = await prisma.user.findUnique({
        where: { user_id },
      });
  
      if (!user) {
        return res.status(401).json({
          message: "존재하지 않는 아이디입니다.",
        });
      }
  
      const isMatch = await bcrypt.compare(pw, user.pw as string);
  
      if (!isMatch) {
        return res.status(401).json({
          message: "비밀번호가 일치하지 않습니다.",
        });
      }
  
      return res.status(200).json({
        message: "로그인 성공",
        data: {
          id: user.id,
          user_id: user.user_id,
          nickname: user.nickname,
          address: user.address,
          address2: user.address2,
          point: user.point ?? 0,
          created_at: user.created_at,
          updated_at: user.updated_at,
          is_active: user.is_active,
          user_lat: user.user_lat,
          user_lng: user.user_lng,
        },
      });
    } catch (error) {
      console.error("로그인 오류:", error);
  
      return res.status(500).json({
        message: "로그인 중 오류가 발생했습니다.",
      });
    }
  };

