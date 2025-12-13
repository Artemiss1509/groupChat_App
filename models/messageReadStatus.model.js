import { Sequelize, DataTypes } from "sequelize";
import sequelize from "../utils/DB.connection.js";
import Messages from "./messages.model.js";
import Users from "./user.model.js";

const MessageReadStatus = sequelize.define('MessageReadStatus', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    messageId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model:  Messages,
            key: 'id'
        }
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Users,
            key: 'id'
        }
    },
    readAt: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.NOW
    }
}, {
    timestamps: false,
    indexes: [
        {
            unique: true,
            fields: ['messageId', 'userId']
        }
    ]
});

export default MessageReadStatus;