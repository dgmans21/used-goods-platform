import express, { Request, Response } from 'express';
import cors from 'cors';

import testRoute from './route/test.route';



const app = express();
const port = 4000;


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: ['http://localhost:3000', 'https://www.mydomain.com'], 
  credentials: true
}));




app.use('/api/test', testRoute);

app.get('/', (req: Request, res: Response) => {
  res.send('Hello, TypeScript with Express!');
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});