import { Sequelize, DataTypes } from "sequelize";
import sequelize from "../utils/DB.connection.js";
import Conversation from "./conversation.model.js";
import Users from "./user.model.js";

const Messages = sequelize.define('Message', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    senderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Users,
            key: 'id'
        }
    },
    conversationId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Conversation,
            key: 'id'
        }
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    mediaUrl: {
        type: DataTypes.STRING,
        allowNull: true
    },
    mediaType: {
        type: DataTypes.ENUM('image', 'video', 'file'),
        allowNull: true
    },
    isRead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    timestamps: true,
    updatedAt: false
});

export default Messages;