import sequelize from "../../../config/database.js";
import { DataTypes } from 'sequelize';

const Cirurgia = sequelize.define('Cirurgia',{
    fotos: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true
    },
    data: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    descrição: {
        type: DataTypes.STRING,
        allowNull: true
    }
})

export default Cirurgia