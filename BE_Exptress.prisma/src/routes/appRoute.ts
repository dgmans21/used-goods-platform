// router/appRouter.ts

import { Router } from 'express';
import { 
  getApplicationsByBuyerId, 
  getReceivedApplications, // 👈 내가 받은 신청 목록 조회
  handleApplicationStatus,   // 👈 받은 신청 승인/거절
  chargePoints, 
  adminGrantPoints,        // 🚀 추가: 어드민 수동 포인트 지급 컨트롤러
  createApplication 
} from '../controller/appController';

const router = Router();

// GET /api/applications?buyer_id=... (내가 보낸 신청 내역)
router.get('/', getApplicationsByBuyerId);

// 🚀 GET /api/applications/received?seller_id=... (내가 받은 신청 내역)
router.get('/received', getReceivedApplications);

// 🚀 POST /api/applications/handle (받은 신청 승인 및 거절)
router.post('/handle', handleApplicationStatus);

// POST /api/applications (상품 신청)
router.post('/', createApplication);

// POST /api/applications/charge (카카오페이 포인트 충전)
router.post('/charge', chargePoints);

// 👑 POST /api/applications/admin-grant (어드민 수동 포인트 지급)
router.post('/admin-grant', adminGrantPoints);

export default router;