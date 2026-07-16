import { Request, Response } from 'express';
import { prisma } from '../db';

// 1. 🚀 상품 등록
export const createProduct = async (req: Request, res: Response): Promise<void> => {
  const { name, price, description, image_url, seller_id } = req.body;

  try {
    if (!name || !price || !seller_id) {
       res.status(400).json({ error: "필수 입력 항목(이름, 가격, 판매자 식별키)이 누락되었습니다." });
       return;
    }

    const newProduct = await prisma.product.create({
      data: {
        name,
        price: Number(price),
        description: description || '',
        image_url, 
        seller_id: Number(seller_id), 
      },
    });

    res.status(201).json(newProduct);
  } catch (error) {
    console.error("Error in createProduct:", error);
    res.status(500).json({ error: "상품 등록 중 서버 에러가 발생했습니다." });
  }
};

// 2. 🔍 전체 상품 목록 조회 (🔥 seller_id 필터링 로직 반영 완료!)
export const getProducts = async (req: Request, res: Response): Promise<void> => {
  const { seller_id } = req.query; // 🚀 프론트엔드가 보낸 쿼리 스트링 감지 (?seller_id=...)

  try {
    // 💡 seller_id가 존재하고 올바른 숫자인 경우에만 필터 조건을 생성합니다.
    const whereCondition = seller_id && !isNaN(Number(seller_id))
      ? { seller_id: Number(seller_id) }
      : {};

    const products = await prisma.product.findMany({
      where: whereCondition, // 👈 필터 조건 대입 (없으면 전체 조회)
      // 💡 여기서 Prisma Relation을 사용해 user 테이블을 조인합니다!
      include: {
        user: {
          select: {
            user_id: true,
            nickname: true,
            // pw 같은 민감 정보는 제외하고 필요한 정보만 select 해오는 것이 보안상 안전합니다.
          }
        }
      },
      orderBy: {
        id: 'desc', // 최신 등록 순 정렬
      },
    });
    
    res.status(200).json(products);
  } catch (error) {
    console.error("Error in getProducts:", error);
    res.status(500).json({ error: "상품 목록을 불러오는 중 서버 에러가 발생했습니다." });
  }
};

// 3. 📄 상품 상세정보 단건 조회
export const getProductById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const productData = await prisma.product.findUnique({
      where: { id: Number(id) },
      include: {
        user: {
          select: {
            nickname: true, // 판매자 닉네임 가져오기
          },
        },
      },
    });

    if (!productData) {
      res.status(404).json({ error: "존재하지 않는 상품입니다." });
      return;
    }

    const formattedProduct = {
      id: productData.id,
      name: productData.name,
      price: productData.price,
      description: productData.description,
      image_url: productData.image_url,
      status: productData.status,
      created_at: productData.created_at,
      updated_at: productData.updated_at,
      seller_id: productData.seller_id,
      sellerNickname: productData.user?.nickname || "탈퇴한 회원",
    };

    res.status(200).json(formattedProduct);
  } catch (error) {
    console.error("Error in getProductById:", error);
    res.status(500).json({ error: "상품 상세 조회 중 서버 에러가 발생했습니다." });
  }
};

// 4. ✏️ 상품 수정
export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name, price, description, image_url } = req.body;

  try {
    const exists = await prisma.product.findUnique({
      where: { id: Number(id) },
    });

    if (!exists) {
      res.status(404).json({ error: "수정하려는 상품이 존재하지 않습니다." });
      return;
    }

    const updatedProduct = await prisma.product.update({
      where: { id: Number(id) },
      data: {
        name: name !== undefined ? name : undefined,
        price: price !== undefined ? Number(price) : undefined,
        description: description !== undefined ? description : undefined,
        image_url: image_url !== undefined ? image_url : undefined,
      },
    });

    res.status(200).json(updatedProduct);
  } catch (error) {
    console.error("Error in updateProduct:", error);
    res.status(500).json({ error: "상품 수정 중 서버 에러가 발생했습니다." });
  }
};

// 5. 🗑️ 상품 삭제
export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const exists = await prisma.product.findUnique({
      where: { id: Number(id) },
    });

    if (!exists) {
      res.status(404).json({ error: "삭제하려는 상품이 존재하지 않습니다." });
      return;
    }

    await prisma.product.delete({
      where: { id: Number(id) },
    });

    res.status(200).json({ message: "상품이 정상적으로 삭제되었습니다." });
  } catch (error) {
    console.error("Error in deleteProduct:", error);
    res.status(500).json({ error: "상품 삭제 중 서버 에러가 발생했습니다." });
  }
};