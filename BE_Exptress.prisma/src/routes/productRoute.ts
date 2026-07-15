import { Router } from 'express';
import { 
  createProduct, 
  getProducts, 
  getProductById, 
  updateProduct, 
  deleteProduct 
} from '../controller/productController';

const router = Router();

// 🚀 '/api/products'를 모두 지우고 간단한 경로로 수정합니다!
router.post('/', createProduct);         // POST http://localhost:5000/api/products (등록)
router.get('/', getProducts);           // GET  http://localhost:5000/api/products (목록 조회)
router.get('/:id', getProductById);     // GET  http://localhost:5000/api/products/:id (단건 상세조회)
router.put('/:id', updateProduct);       // PUT  http://localhost:5000/api/products/:id (수정)
router.delete('/:id', deleteProduct);    // DELETE http://localhost:5000/api/products/:id (삭제)

export default router;