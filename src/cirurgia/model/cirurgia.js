import sequelize from "../../../config/database.js";
import { DataTypes } from 'sequelize';
import Paciente from '../../paciente/model/paciente.js'

const Cirurgia = await sequelize.define('Cirurgia',{
    fotos: {
        type: DataTypes.ARRAY,
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

Cirurgia.belongsTo(Paciente,{foreignKey: 'cirurgiaId'})
Paciente.hasMany(Cirurgia,{
  foreignKey: 'pacienteId',
  as: 'paciente',
  onDelete: 'CASCADE'
})

export default Cirurgia