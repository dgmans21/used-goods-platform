// router/appRouter.ts

import { Router } from 'express';
import { 
  getApplicationsByBuyerId, 
  chargePoints, 
  createApplication 
} from '../controller/appController';

const router = Router();

// GET http://localhost:5000/api/applications?buyer_id=...
router.get('/', getApplicationsByBuyerId);

// 🚀 POST http://localhost:5000/api/applications (상품 신청)
// '/applications'가 아니라 '/' 로 적어주셔야 합쳐져서 '/api/applications'가 됩니다!
router.post('/', createApplication);

// 🚀 POST http://localhost:5000/api/applications/charge (포인트 충전)
router.post('/charge', chargePoints);

export default router;