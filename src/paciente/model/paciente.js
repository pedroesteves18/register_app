import sequelize from "../../../config/database.js";
import { DataTypes } from 'sequelize';
import  Cirurgia  from '../../cirurgia/model/cirurgia.js'

const Paciente = sequelize.define('Paciente', {
    nome: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    dot: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    sexo: {
        type: DataTypes.ENUM('masc','fem'),
        allowNull: true
    },
    hospital: {
        type: DataTypes.STRING(),
        allowNull: true
    },
    registro: {
        type: DataTypes.STRING(),
        allowNull: true
    },
    historico: {
        type: DataTypes.STRING,
        allowNull: true
    }
})

Paciente.hasMany(Cirurgia, {foreignKey: 'pacienteId'})
Cirurgia.belongsTo(Paciente,{
  foreignKey: 'pacienteId',
  as: 'paciente',
  onDelete: 'CASCADE'
})



export default Paciente