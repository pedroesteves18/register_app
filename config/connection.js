import sequelize from "./database.js";
import User from "../src/user/model/user.js";
import Paciente from "../src/paciente/model/paciente.js";
import Cirurgia from "../src/cirurgia/model/cirurgia.js";

const connection = async () => {
  try {
    await sequelize.authenticate();
    console.log('💾 Database connection suceeded');

    await sequelize.sync({alter: true, force: false }); 
    console.log('📦 Tables synchronized');
  } catch (err) {
    console.error('❌ Error in database connection:', err);
  }
}

export default connection

