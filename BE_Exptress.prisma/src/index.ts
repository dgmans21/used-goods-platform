// 💡 해결의 핵심: 반드시 파일의 맨 첫 번째 줄에서 환경 변수를 로드해야 합니다!
import 'dotenv/config'; 

import express, { Request, Response } from 'express';
import userRoute from './routes/userRoute';
import productRoute from './routes/productRoute';
import appRoute from './routes/appRoute';
import cors from 'cors';

const app = express();
const port = 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors());

app.use('/api/users', userRoute);
app.use('/api/products', productRoute);
app.use('/api/applications', appRoute);

app.get('/', (req: Request, res: Response) => {
  res.send('Hello, TypeScript with Express!');
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});