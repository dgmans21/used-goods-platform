import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 1. 🚀 [기존] 상품 등록 컨트롤러 함수
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

// 2. 🔍 [추가] 전체 상품 목록 조회
export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const products = await prisma.product.findMany({
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

// 3. 📄 [추가] 상품 상세정보 단건 조회 (상세 페이지 대응)
export const getProductById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const product = await prisma.product.findUnique({
      where: { id: Number(id) },
    });

    if (!product) {
      res.status(404).json({ error: "존재하지 않는 상품입니다." });
      return;
    }

    res.status(200).json(product);
  } catch (error) {
    console.error("Error in getProductById:", error);
    res.status(500).json({ error: "상품 상세 조회 중 서버 에러가 발생했습니다." });
  }
};

// 4. ✏️ [추가] 상품 수정
export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name, price, description, image_url } = req.body;

  try {
    // 상품 존재 여부 확인
    const exists = await prisma.product.findUnique({
      where: { id: Number(id) },
    });

    if (!exists) {
      res.status(404).json({ error: "수정하려는 상품이 존재하지 않습니다." });
      return;
    }

    // 수정 진행
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

// 5. 🗑️ [추가] 상품 삭제
export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    // 상품 존재 여부 확인
    const exists = await prisma.product.findUnique({
      where: { id: Number(id) },
    });

    if (!exists) {
      res.status(404).json({ error: "삭제하려는 상품이 존재하지 않습니다." });
      return;
    }

    // 삭제 실행
    await prisma.product.delete({
      where: { id: Number(id) },
    });

    res.status(200).json({ message: "상품이 정상적으로 삭제되었습니다." });
  } catch (error) {
    console.error("Error in deleteProduct:", error);
    res.status(500).json({ error: "상품 삭제 중 서버 에러가 발생했습니다." });
  }
};