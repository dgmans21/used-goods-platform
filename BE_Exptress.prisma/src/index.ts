import express, { Request, Response } from 'express';
import userRoute from './routes/userRoute';
import productRoute from './routes/productRoute';
import cors from 'cors';
import 'dotenv/config';

const app = express();
const port = 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors());

app.use('/api/users', userRoute);
app.use('/api/products', productRoute);
app.get('/', (req: Request, res: Response) => {
  res.send('Hello, TypeScript with Express!');
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});