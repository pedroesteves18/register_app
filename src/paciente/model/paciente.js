import sequelize from "../../../config/database.js";
import { DataTypes } from 'sequelize';


const Paciente = sequelize.define('Paciente', {
    nome: {
        type: DataTypes.STRING(),
        allowNull: false,
    },
    dot: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    sexo: {
        type: DataTypes.ENUM('masc','fem'),
        allowNull: true
    }
})

export default Paciente