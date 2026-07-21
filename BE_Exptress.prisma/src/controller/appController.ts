import { Request, Response } from 'express';
import { prisma } from '../db';
import axios from 'axios';

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

// 💰 포인트 충전 처리 API (더미)


// 👑 [어드민] 특정 닉네임 유저에게 수동 포인트 지급 API
export const adminGrantPoints = async (req: Request, res: Response): Promise<void> => {
  const { adminUserId, targetNickname, amount } = req.body;

  // 1. 필수 값 유효성 검사
  if (!adminUserId || !targetNickname) {
    res.status(400).json({ error: "어드민 ID와 대상 닉네임이 필요합니다." });
    return;
  }

  const grantAmount = Number(amount);
  if (isNaN(grantAmount) || grantAmount <= 0) {
    res.status(400).json({ error: "올바른 포인트 금액을 입력해 주세요." });
    return;
  }

  try {
    // 2. 요청을 보낸 사람이 진짜 Admin 계정인지 DB 검증
    const adminUser = await prisma.user.findUnique({
      where: { id: Number(adminUserId) },
    });

    if (!adminUser || adminUser.user_id?.toLowerCase() !== "admin@admin.com") {
      res.status(403).json({ error: "관리자 권한이 없습니다." });
      return;
    }

    // 3. 닉네임으로 포인트를 받을 대상 유저 찾기
    const targetUser = await prisma.user.findFirst({
      where: { nickname: targetNickname.trim() },
    });

    if (!targetUser) {
      res.status(404).json({ error: `'${targetNickname}' 닉네임을 가진 유저를 찾을 수 없습니다.` });
      return;
    }

    // 4. Prisma의 increment로 포인트 더해주기 (속도 빠르고 안전!)
    const updatedTargetUser = await prisma.user.update({
      where: { id: targetUser.id },
      data: { 
        point: { increment: grantAmount } 
      },
      select: { id: true, nickname: true, point: true }
    });

    // 5. 성공 응답 (newPoint 반환)
    res.status(200).json({
      message: `'${updatedTargetUser.nickname}'님에게 ${grantAmount.toLocaleString()}P가 성공적으로 지급되었습니다.`,
      newPoint: updatedTargetUser.point,
    });

  } catch (error: any) {
    console.error("❌ 어드민 포인트 지급 중 DB 오류 발생:", error);
    res.status(500).json({ error: "서버 오류로 인해 포인트 지급에 실패했습니다." });
  }
};


// 💰 [포트원 V2] 포인트 결제 검증 및 충전 처리 API
export const chargePoints = async (req: Request, res: Response): Promise<void> => {
  // 프론트엔드에서 넘겨주는 파라미터 (paymentId 필수)
  const { userId, amount, paymentId } = req.body;

  // 1. 필수 입력값 검증
  if (!userId) {
    res.status(400).json({ error: "유저 식별키(userId)가 필요합니다." });
    return;
  }

  if (!paymentId) {
    res.status(400).json({ error: "포트원 결제 고유 번호(paymentId)가 필요합니다." });
    return;
  }

  const chargeAmount = Number(amount);
  if (isNaN(chargeAmount) || chargeAmount <= 0) {
    res.status(400).json({ error: "올바른 충전 금액을 입력해 주세요." });
    return;
  }

  try {
    // 2. 🚀 [핵심 보안] 포트원 V2 서버로 실결제 내역 단건 조회 요청
    const paymentResponse = await axios.get(
      `https://api.portone.io/payments/${paymentId}`,
      {
        headers: {
          Authorization: `PortOne ${process.env.PORTONE_API_SECRET}`,
        },
      }
    );

    const paymentData = paymentResponse.data;

    // 3. 결제 상태 및 금액 위변조 검증
    // - status가 'PAID'(결제 완료)인지 확인
    // - 실제 결제된 금액(amount.total)과 유저가 충전 요청한 금액(chargeAmount)이 일치하는지 확인
    if (paymentData.status !== "PAID" || paymentData.amount.total !== chargeAmount) {
      res.status(400).json({ error: "유효하지 않거나 금액이 일치하지 않는 결제 시도입니다." });
      return;
    }

    // 4. ✅ 검증 통과 시 DB 유저 포인트 증가 처리 (increment 활용)
    const updatedUser = await prisma.user.update({
      where: { id: Number(userId) },
      data: {
        point: { increment: chargeAmount },
      },
      select: { id: true, nickname: true, point: true },
    });

    // 5. 성공 응답
    res.status(200).json({
      message: `${chargeAmount.toLocaleString()} 포인트가 성공적으로 충전되었습니다.`,
      point: updatedUser.point,
    });

  } catch (error: any) {
    // 포트원 서버 응답 에러 또는 DB 에러 세부 로깅
    const errorMessage = error.response?.data?.message || error.message;
    console.error("❌ PG 결제 검증 및 포인트 충전 에러:", errorMessage);

    res.status(500).json({ 
      error: "결제 검증 처리 중 서버 오류가 발생했습니다.",
      details: process.env.NODE_ENV === "development" ? errorMessage : undefined
    });
  }
};

export const createApplication = async (req: Request, res: Response) => {
  const { product_id, buyer_id } = req.body;

  if (!product_id || !buyer_id) {
    return res.status(400).json({ success: false, message: "필수 요청 파라미터가 누락되었습니다." });
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

      // 🚨 1-1. [추가] 상품이 'sale' 상태가 아닌 경우 (이미 예약중이거나 판매완료된 경우)
      if (product.status !== "sale") {
        throw new Error("PRODUCT_NOT_FOR_SALE");
      }

      // 2. 구매자 잔액 조회
      const buyer = await tx.user.findUnique({
        where: { id: Number(buyer_id) },
      });

      if (!buyer) {
        throw new Error("USER_NOT_FOUND");
      }

      // 3. 중복 신청 검사 (이미 'pending' 대기 중인 신청이 있는지 확인)
      const existingOrder = await tx.order.findFirst({
        where: {
          product_id: Number(product_id),
          buyer_id: Number(buyer_id),
          status: "pending",
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
          status: "pending",
        },
      });

      // 🚀 6-1. [핵심 추가] 상품 상태를 'reserved' (거래 협상중)로 변경!
      await tx.product.update({
        where: { id: Number(product_id) },
        data: { status: "reserved" },
      });

      return newOrder;
    });

    return res.status(201).json({
      success: true,
      message: "신청이 성공적으로 완료되었습니다.",
      order: result,
    });
  } catch (error: any) {
    console.error("상품 신청 에러:", error);

    // 🚀 비즈니스 예외 처리
    if (error.message === "PRODUCT_NOT_FOUND") {
      return res.status(200).json({
        success: false,
        code: "PRODUCT_NOT_FOUND",
        message: "존재하지 않는 상품입니다.",
      });
    }

    if (error.message === "PRODUCT_NOT_FOR_SALE") {
      return res.status(200).json({
        success: false,
        code: "PRODUCT_NOT_FOR_SALE",
        message: "현재 구매 신청을 할 수 없는 상품 상태입니다.",
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

    return res.status(500).json({ success: false, message: "신청 처리 중 서버 오류가 발생했습니다." });
  }
};

// 1. 내가 등록한 상품들에 들어온 신청(Order) 목록 조회

export const getReceivedApplications = async (req: Request, res: Response) => {
  const { seller_id } = req.query;

  if (!seller_id || isNaN(Number(seller_id))) {
    return res.status(200).json({ 
      success: false, 
      message: "판매자 정보가 유효하지 않습니다." 
    });
  }

  try {
    const orders = await prisma.order.findMany({
      where: {
        product: {
          seller_id: Number(seller_id),
        },
      },
      include: {
        product: true,
        buyer: { // 👈 'user' 대신 'buyer'로 변경!
          select: {
            id: true,
            nickname: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    return res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error("내가 받은 신청 목록 조회 에러:", error);
    return res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
};




// 2. 받은 신청 승인 및 거절 (POST /api/applications/handle)
export const handleApplicationStatus = async (req: Request, res: Response) => {
  const { order_id, action } = req.body; // action: 'approve' | 'reject'

  if (!order_id || !["approve", "reject"].includes(action)) {
    return res.status(200).json({ 
      success: false, 
      message: "잘못된 요청 파라미터입니다." 
    });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. 주문 조회
      const order = await tx.order.findUnique({
        where: { id: Number(order_id) },
        include: { product: true },
      });

      if (!order) {
        throw new Error("ORDER_NOT_FOUND");
      }

      // 2. 이미 처리된 주문인지 검증
      if (order.status !== "pending") {
        throw new Error("ALREADY_PROCESSED");
      }

      if (action === "approve") {
        // [1] 선택한 주문 승인 처리
        await tx.order.update({
          where: { id: order.id },
          data: { status: "completed" },
        });

        // [2] 해당 상품 품절 처리 (sold_out Enum 사용)
        await tx.product.update({
          where: { id: order.product_id },
          data: { status: "sold_out" },
        });

        // [3] 판매자 포인트 증액
        const updatedSeller = await tx.user.update({
          where: { id: order.product.seller_id },
          data: {
            point: { increment: Number(order.product.price) },
          },
          select: { point: true },
        });

        // 🚀 [4] 핵심: 해당 상품의 '다른 대기 중인 신청들' 자동 거절 및 포인트 환불
        const otherPendingOrders = await tx.order.findMany({
          where: {
            product_id: order.product_id,
            status: "pending",
            id: { not: order.id }, // 현재 승인하는 주문 제외
          },
        });

        if (otherPendingOrders.length > 0) {
          // 다른 대기 주문들을 일괄 'rejected' 상태로 변경
          await tx.order.updateMany({
            where: {
              product_id: order.product_id,
              status: "pending",
              id: { not: order.id },
            },
            data: { status: "rejected" },
          });

          // 다른 신청자들에게 각각 포인트 환불
          for (const otherOrder of otherPendingOrders) {
            await tx.user.update({
              where: { id: otherOrder.buyer_id },
              data: {
                point: { increment: Number(order.product.price) },
              },
            });
          }
        }

        return { 
          message: "구매 신청을 승인하였습니다.",
          newPoint: updatedSeller.point 
        };

      } else {
        // [거절 처리] - 단건 거절
        await tx.order.update({
          where: { id: order.id },
          data: { status: "rejected" },
        });

        // 차감되었던 포인트 구매자에게 환불
        await tx.user.update({
          where: { id: order.buyer_id },
          data: {
            point: { increment: Number(order.product.price) },
          },
        });

        return { 
          message: "구매 신청을 거절하고 포인트를 환불했습니다." 
        };
      }
    });

    return res.status(200).json({ 
      success: true, 
      message: result.message,
      newPoint: result.newPoint // 승인 시 프론트로 갱신 포인트 전달
    });

  } catch (error: any) {
    console.error("신청 처리 에러:", error);

    if (error.message === "ORDER_NOT_FOUND") {
      return res.status(200).json({ success: false, message: "존재하지 않는 신청 내역입니다." });
    }
    if (error.message === "ALREADY_PROCESSED") {
      return res.status(200).json({ success: false, message: "이미 처리 완료된 신청건입니다." });
    }

    return res.status(500).json({ success: false, message: "처리 중 서버 오류가 발생했습니다." });
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