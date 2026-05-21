import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import authRouter from '@v1/routes/auth.route';
import postsRouter from '@v1/routes/posts.route';
import webhookRouter from '@v1/routes/webhook.route';
import { servePolicyPage } from '@/pages/policy.page';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/', (req, res) => {
  res.send('Express server is up and running!');
});
app.get('/policy', servePolicyPage);

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/posts', postsRouter);
app.use('/webhooks', webhookRouter);

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
