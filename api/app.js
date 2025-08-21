import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { configDotenv } from 'dotenv';
import connection from './config/connection.js';
import userRoutes from './user/routes/user.js';
import pacienteRoutes from './paciente/routes/paciente.js'
import cirurgiaRoutes from './cirurgia/routes/cirurgia.js'
import proxyRoutes from './jobs/proxy.js'
import userService from './user/service/user.js'

configDotenv()
const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/proxy', proxyRoutes)
app.use('/users', userRoutes);
app.use('/pacientes', pacienteRoutes)
app.use('/cirurgias', cirurgiaRoutes)

app.listen(process.env.PORT,  async() => {
  try{
    await connection()

    await userService.createDefaultUser()
  }catch(err){
    throw new Error(`Error connecting to the database: ${err.message}`);
  }
});