import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { configDotenv } from 'dotenv';
import connection from './config/connection.js';
import userRoutes from './src/user/routes/user.js';
import pacienteRoutes from './src/paciente/routes/paciente.js'
import cirurgiaRoutes from './src/cirurgia/routes/cirurgia.js'
import axios from 'axios';

configDotenv()
const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/users', userRoutes);
app.use('/pacientes', pacienteRoutes)
app.use('/cirurgias', cirurgiaRoutes)

app.listen(process.env.PORT,  async() => {
  await axios.post()
  console.log('Server running');
  try{
    connection()
  }catch(err){
    throw new Error(`Error connecting to the database: ${err.message}`);
  }
});