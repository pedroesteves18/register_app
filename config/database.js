import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
  process.env.AWS_RDS_DATABASE,
  process.env.AWS_RDS_USER,
  process.env.AWS_RDS_PASSWORD,
  {
    host: process.env.AWS_RDS_HOST,
    dialect: 'postgres',
    port: process.env.AWS_RDS_PORT
  }
);


export default sequelize;