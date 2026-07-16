import { Router } from 'express';
import { getApplicationsByBuyerId, chargePoints } from '../controller/appController'; // 🚀 chargePoints 추가 임포트

const router = Router();

// GET http://localhost:5000/api/applications?buyer_id=...
router.get('/', getApplicationsByBuyerId);

// 🚀 POST http://localhost:5000/api/applications/charge
router.post('/charge', chargePoints);

export default router;