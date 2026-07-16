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