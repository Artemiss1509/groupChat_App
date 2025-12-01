import Conversation from "../models/conversation.model.js";
import Users from "../models/user.model.js";
import Messages from "../models/messages.model.js";
import { Op } from "sequelize";

export const createOrGetConversation = async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const { participantId } = req.body;

        const existingConversation = await Conversation.findOne({
            include: [{
                model: Users,
                where: { id: { [Op.in]: [currentUserId, participantId] } },
                through: { attributes: [] }
            }],
            where: { type: 'individual' }
        });

        if (existingConversation) {
            const participants = await existingConversation.getUsers();
            const participantIds = participants.map(p => p.id).sort();
            const targetIds = [currentUserId, participantId].sort();
            
            if (JSON.stringify(participantIds) === JSON.stringify(targetIds)) {
                return res.status(200).json({ 
                    conversation: existingConversation,
                    isNew: false
                });
            }
        }
        const newConversation = await Conversation.create({
            type: 'individual'
        });

        await newConversation.addUsers([currentUserId, participantId]);

        res.status(201).json({ 
            conversation: newConversation,
            isNew: true
        });

    } catch (error) {
        console.error('Error creating/getting conversation:', error);
        res.status(500).json({ 
            message: "Error creating conversation", 
            error: error.message 
        });
    }
};

export const getUserConversations = async (req, res) => {
    try {
        const currentUserId = req.user.id;

        const conversations = await Conversation.findAll({
            include: [
                {
                    model: Users,
                    through: { attributes: [] },
                    attributes: ['id', 'name', 'email']
                },
                {
                    model: Messages,
                    limit: 1,
                    order: [['timestamp', 'DESC']],
                    attributes: ['content', 'timestamp']
                }
            ],
            where: {
                '$Users.id$': currentUserId
            },
            order: [[Messages, 'timestamp', 'DESC']]
        });

        const formattedConversations = await Promise.all(conversations.map(async (conv) => {
            const participants = await conv.getUsers({
                attributes: ['id', 'name', 'email']
            });
            
            const otherParticipant = participants.find(p => p.id !== currentUserId);
            const lastMessage = conv.Messages && conv.Messages[0];

            return {
                conversationId: conv.id,
                participant: otherParticipant || participants[0],
                lastMessage: lastMessage ? {
                    content: lastMessage.content,
                    timestamp: lastMessage.timestamp
                } : null,
                createdAt: conv.createdAt
            };
        }));

        res.status(200).json(formattedConversations);

    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ 
            message: "Error fetching conversations", 
            error: error.message 
        });
    }
};