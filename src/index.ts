import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import testRouter from '@v1/routes/test.route';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/', (req, res) => {
  res.send('Express server is up and running!');
});
app.use('/api/v1/test', testRouter);
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});