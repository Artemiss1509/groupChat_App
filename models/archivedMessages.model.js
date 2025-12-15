import { Sequelize, DataTypes } from "sequelize";
import sequelize from "../utils/DB.connection.js";
import Conversation from "./conversation.model.js";
import Users from "./user.model.js";

const ArchivedMessages = sequelize.define('ArchivedMessage', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    originalMessageId: {
        type:  DataTypes.INTEGER,
        allowNull: false,
        comment: 'Original ID from Messages table'
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
    content:  {
        type: DataTypes. TEXT,
        allowNull: false
    },
    mediaUrl: {
        type: DataTypes.STRING,
        allowNull: true
    },
    mediaType: {
        type: DataTypes. ENUM('image', 'video', 'file'),
        allowNull: true
    },
    isRead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    originalCreatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        comment: 'Original createdAt from Messages table'
    },
    archivedAt:  {
        type: DataTypes. DATE,
        defaultValue: Sequelize.NOW,
        comment: 'When this message was archived'
    }
}, {
    timestamps: true,
    updatedAt: false,
    indexes: [
        {
            fields: ['conversationId']
        },
        {
            fields: ['senderId']
        },
        {
            fields:  ['originalCreatedAt']
        }
    ]
});

export default ArchivedMessages;