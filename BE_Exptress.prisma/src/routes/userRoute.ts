import express from 'express';
import { Router } from 'express';
import { getUsers, createUser, checkUserId, validatePassword } from '../controller/userController';

const router = Router();
const app=express();
app.use(express.json());

router.get('/users/:id', getUsers);
router.post('/createUser', createUser);
router.post('/checkUserId', checkUserId);
router.post('/validatePassword', validatePassword);
export default router;