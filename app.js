import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import connection from './config/connection.js';
import userRoutes from './src/user/routes/user.js';

dotenv.config();
const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/users', userRoutes);
app.listen(process.env.PORT, () => {
  console.log(`Server running at http://localhost:${process.env.PORT}`);
  try{
    connection()
  }catch(err){
    throw new Error(`Error connecting to the database: ${err.message}`);
  }
});