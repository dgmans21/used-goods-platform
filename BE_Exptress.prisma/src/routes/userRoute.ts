import { Router } from 'express';
import { getUsers, createUser, checkUserId, validatePassword, login} from '../controller/userController';

const router = Router();

router.get('/users/:id', getUsers);
router.post('/createUser', createUser);
router.post('/checkUserId', checkUserId);
router.post('/validatePassword', validatePassword);
router.post('/login', login);
export default router;