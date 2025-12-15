import Messages from "../models/messages.model.js";
import Users from "../models/user.model.js";
import Conversation from "../models/conversation.model.js";
import MessageReadStatus from "../models/messageReadStatus.model.js";
import ArchivedMessages from "../models/archivedMessages.model.js";
import { Op } from "sequelize";

export const sendMessage = async (req, res) => {
    try {
        const senderId = req.user.id;
        const { conversationId, content } = req.body;

        if (! conversationId || !content) {
            return res.status(400).json({ 
                message: "Conversation ID and content are required" 
            });
        }

        const conversation = await Conversation.findByPk(conversationId, {
            include: [{
                model: Users,
                where: { id: senderId },
                through: { attributes: [] }
            }]
        });

        if (!conversation) {
            return res.status(404).json({ 
                message: "Conversation not found or you are not a participant" 
            });
        }

        const newMessage = await Messages.create({
            senderId,
            conversationId,
            content
        });

        
        await MessageReadStatus.create({
            messageId: newMessage.id,
            userId: senderId
        });

        const messageWithSender = await Messages.findByPk(newMessage.id, {
            include: [{
                model: Users,
                as: 'User',
                attributes: ['id', 'name', 'email']
            }]
        });

    
        const participants = await conversation.getUsers();
        
        const io = req.app.get('io');
        io.to(`conversation-${conversationId}`).emit('new-message', messageWithSender);

    
        participants.forEach(participant => {
            if (participant.id !== senderId) {
                io.emit('conversation-update', {
                    conversationId,
                    userId: participant.id
                });
            }
        });

        res.status(201).json({ 
            message: "Message sent successfully", 
            data: messageWithSender 
        });

    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ 
            message: "Error sending message", 
            error: error.message 
        });
    }
};

export const getConversationMessages = async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const { conversationId } = req.params;

        const conversation = await Conversation.findByPk(conversationId, {
            include:  [{
                model: Users,
                where: { id: currentUserId },
                through: { attributes: [] }
            }]
        });

        if (!conversation) {
            return res.status(404).json({ 
                message: "Conversation not found or you are not a participant" 
            });
        }

        const recentMessages = await Messages.findAll({
            where: { conversationId },
            include: [{
                model: Users,
                as: 'User',
                attributes: ['id', 'name', 'email']
            }],
            order: [['createdAt', 'ASC']]
        });

        const archivedMessages = await ArchivedMessages. findAll({
            where: { conversationId },
            include: [{
                model: Users,
                as: 'User',
                attributes: ['id', 'name', 'email']
            }],
            order: [['originalCreatedAt', 'ASC']]
        });

        const transformedArchivedMessages = archivedMessages.map(msg => ({
            id: msg.originalMessageId,
            senderId:  msg.senderId,
            conversationId: msg.conversationId,
            content: msg.content,
            mediaUrl: msg. mediaUrl,
            mediaType:  msg.mediaType,
            isRead: msg.isRead,
            createdAt: msg.originalCreatedAt,
            User: msg.User,
            isArchived: true
        }));

        const allMessages = [...transformedArchivedMessages, ...recentMessages]. sort((a, b) => 
            new Date(a.createdAt) - new Date(b.createdAt)
        );

        res.status(200).json(allMessages);

    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ 
            message: "Error fetching messages", 
            error: error.message 
        });
    }
};

export const markMessagesAsRead = async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const { conversationId } = req.body;

        const messages = await Messages.findAll({
            where: { 
                conversationId,
                senderId: { [Op.ne]: currentUserId }
            }
        });

        for (const message of messages) {
            await MessageReadStatus.findOrCreate({
                where: {
                    messageId: message.id,
                    userId: currentUserId
                }
            });
        }

        res.status(200).json({ message: "Messages marked as read" });
    } catch (error) {
        console.error('Error marking messages as read:', error);
        res.status(500).json({ 
            message: "Error marking messages as read", 
            error:  error.message 
        });
    }
};