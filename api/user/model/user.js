import sequelize from "../../config/database.js";
import { DataTypes } from 'sequelize';
import Paciente from '../../paciente/model/paciente.js'

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    access: {
        type: DataTypes.STRING,
        allowNull: false
    }
})

User.hasMany(Paciente, {foreignKey: 'userId'})
Paciente.belongsTo(User,{
  foreignKey: 'userId',
  as: 'user',
  onDelete: 'CASCADE'
})

export default User