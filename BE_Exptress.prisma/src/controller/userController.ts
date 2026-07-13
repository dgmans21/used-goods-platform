import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import bcrypt from 'bcrypt';

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


    const { user_id, pw, nickname, address, address2, point } = req.body;

    try {
     

        const hashedPassword = await bcrypt.hash(pw, 10);



        const user = await prisma.user.create({
            data: {
                user_id,
                pw: hashedPassword,
                nickname,
                address,
                address2,
                point: Number(point),
                created_at: new Date()
            },
        });

    

        const { pw: _, ...userWithoutPassword } = user;

        return res.status(200).json({
            message: "회원가입완료",
            data: userWithoutPassword
        });

    } catch (error) {
        console.error("5. 에러 발생:", error);

        return res.status(500).json({
            message: "Internal server error",
            error: error instanceof Error ? error.message : error
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

