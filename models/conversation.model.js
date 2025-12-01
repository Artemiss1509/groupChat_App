import { Sequelize, DataTypes } from "sequelize";
import sequelize from "../utils/DB.connection.js";

const Conversation = sequelize.define('Conversation', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    type: {
        type: DataTypes.ENUM('individual', 'group'),
        defaultValue: 'individual'
    },
    name: { 
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    timestamps: true,
});

export default Conversation;