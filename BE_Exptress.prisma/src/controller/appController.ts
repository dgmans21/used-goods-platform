import { Request, Response } from 'express';
import { prisma } from '../db';

// 🔍 1. [수정 완료] 내 신청 내역 조회 (application -> order 테이블 및 실제 Prisma 연동 버전)
export const getApplicationsByBuyerId = async (req: Request, res: Response): Promise<void> => {
  const { buyer_id } = req.query;

  try {
    if (!buyer_id) {
      res.status(400).json({ error: "구매자 식별키(buyer_id)가 필요합니다." });
      return;
    }

    // 🚀 application 대신 실제 존재하는 order 테이블을 쿼리합니다.
    // (Prisma Schema 정의에 따라 prisma.order 또는 (prisma as any).order 로 사용 가능합니다)
    const orderData = await (prisma as any).order.findMany({
      where: { buyer_id: Number(buyer_id) },
      include: {
        product: {
          select: {
            name: true,
            price: true,
          }
        }
      },
      orderBy: {
        id: 'desc'
      }
    });

    const formattedApps = orderData.map((order: any) => ({
      id: order.id,
      product_id: order.product_id,
      productName: order.product?.name || "삭제된 상품",
      price: order.product?.price || 0,
      appliedAt: order.created_at || order.createdAt // DB 스키마 필드명(snake/camel)에 맞춰 유연하게 맵핑
    }));

    res.status(200).json(formattedApps);
  } catch (error) {
    console.error("❌ 주문/신청 내역(order) 조회 중 DB 오류 발생:", error);
    res.status(500).json({ error: "주문 내역을 불러오는 중 서버 오류가 발생했습니다." });
  }
};

// 💰 2. [점검 완료] 포인트 충전 처리 API
export const chargePoints = async (req: Request, res: Response): Promise<void> => {
  const { userId, amount } = req.body;

  try {
    // 🚀 [임시 코드] 기존에 포인트가 NULL(또는 없는)인 유저들을 전부 찾아 point를 0으로 강제 업데이트합니다.
    // 이 코드는 한 번 실행된 후 지우셔도 무방합니다.
    await prisma.user.updateMany({
      where: {
        OR: [
          { point: null as any }, // point가 null인 경우
          { point: { equals: undefined } }
        ]
      },
      data: {
        point: 0
      }
    });
    console.log("📢 [성공] 기존 NULL 포인트를 가진 모든 사용자의 포인트를 0으로 초기화 완료했습니다.");

    // -- 이 아래부터는 기존 충전 처리 로직 --
    if (!userId) {
      res.status(400).json({ error: "유저 식별키(userId)가 필요합니다." });
      return;
    }

    const chargeAmount = Number(amount);
    if (isNaN(chargeAmount) || chargeAmount <= 0) {
      res.status(400).json({ error: "올바른 충전 금액을 입력해 주세요." });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: Number(userId) }
    });

    if (!user) {
      res.status(404).json({ error: "존재하지 않는 사용자입니다." });
      return;
    }

    // NULL 방어 처리
    const currentPoint = user.point ?? 0; 
    const nextPoint = currentPoint + chargeAmount;

    const updatedUser = await prisma.user.update({
      where: { id: Number(userId) },
      data: { point: nextPoint },
      select: { id: true, nickname: true, point: true }
    });

    res.status(200).json({
      message: `${chargeAmount.toLocaleString()} 포인트가 성공적으로 충전되었습니다.`,
      point: updatedUser.point, 
    });

  } catch (error: any) {
    console.error("❌ 포인트 충전 중 DB 오류 발생:", error);
    res.status(500).json({ error: "서버 오류로 인해 포인트 충전에 실패했습니다." });
  }
};
export const createApplication = async (req: Request, res: Response) => {
  const { product_id, buyer_id } = req.body;

  if (!product_id || !buyer_id) {
    return res.status(400).json({ message: "필수 요청 파라미터가 누락되었습니다." });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. 상품 존재 및 가격 조회
      const product = await tx.product.findUnique({
        where: { id: Number(product_id) },
      });

      if (!product) {
        throw new Error("PRODUCT_NOT_FOUND");
      }

      // 2. 구매자 잔액 조회
      const buyer = await tx.user.findUnique({
        where: { id: Number(buyer_id) },
      });

      if (!buyer) {
        throw new Error("USER_NOT_FOUND");
      }

      // 🚨 3. 중복 신청 검사 (이미 'pending' 대기 중인 신청이 있는지 확인)
      const existingOrder = await tx.order.findFirst({
        where: {
          product_id: Number(product_id),
          buyer_id: Number(buyer_id),
          status: 'pending',
        },
      });

      if (existingOrder) {
        throw new Error("ALREADY_APPLIED");
      }

      // 4. 포인트 부족 여부 체크
      const currentPoint = buyer.point ?? 0;
      if (currentPoint < product.price) {
        throw new Error("INSUFFICIENT_POINTS");
      }

      // 5. 구매자 포인트 차감 (Prisma atomic decrement 사용)
      await tx.user.update({
        where: { id: Number(buyer_id) },
        data: { 
          point: {
            decrement: Number(product.price)
          } 
        },
      });

      // 6. order 테이블 생성
      const newOrder = await tx.order.create({
        data: {
          product_id: Number(product_id),
          buyer_id: Number(buyer_id),
          status: 'pending',
        },
      });

      return newOrder;
    });

    return res.status(201).json({
      message: "신청이 성공적으로 완료되었습니다.",
      order: result,
    });
  } catch (error: any) {
    console.error("상품 신청 에러:", error);

   // 🚀 서버 장애가 아닌 비즈니스 예외들은 200 OK로 반환하여 네트워크 탭/콘솔을 클린하게 유지합니다.
   if (error.message === "PRODUCT_NOT_FOUND") {
    return res.status(200).json({
      success: false,
      code: "PRODUCT_NOT_FOUND",
      message: "존재하지 않는 상품입니다.",
    });
  }

  if (error.message === "USER_NOT_FOUND") {
    return res.status(200).json({
      success: false,
      code: "USER_NOT_FOUND",
      message: "사용자 정보를 찾을 수 없습니다.",
    });
  }

  if (error.message === "ALREADY_APPLIED") {
    return res.status(200).json({
      success: false,
      code: "ALREADY_APPLIED",
      message: "이미 신청하여 승인 대기 중인 상품입니다.",
    });
  }

  if (error.message === "INSUFFICIENT_POINTS") {
    return res.status(200).json({
      success: false,
      code: "INSUFFICIENT_POINTS",
      message: "보유 포인트가 부족합니다.",
    });
  }

    return res.status(500).json({ message: "신청 처리 중 서버 오류가 발생했습니다." });
  }
};

// 🚀 거래 완료 (판매자에게 포인트 지불)
export const completeApplication = async (req: Request, res: Response) => {
  const { order_id } = req.body;

  try {
    await prisma.$transaction(async (tx) => {
      // 1. 주문 정보 및 상품/판매자 조회
      const order = await tx.order.findUnique({
        where: { id: Number(order_id) },
        include: { product: true }
      });

      if (!order || order.status !== 'pending') {
        throw new Error("INVALID_ORDER");
      }

      // 2. 주문 상태를 'completed'로 변경
      await tx.order.update({
        where: { id: order.id },
        data: { status: 'completed' }
      });

      // 3. 판매자(seller)에게 포인트 지급
      await tx.user.update({
        where: { id: order.product.seller_id },
        data: { point: { increment: order.product.price } }
      });
    });

    return res.status(200).json({ message: "거래가 완료되어 판매자에게 포인트가 지불되었습니다." });
  } catch (error: any) {
    return res.status(400).json({ message: "거래 완료 처리 실패" });
  }
};