import Conversation from "../models/conversation.model.js";
import Users from "../models/user.model.js";
import Messages from "../models/messages.model.js";
import { Op } from "sequelize";
import { Sequelize } from 'sequelize';

export const createOrGetConversation = async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const { participantId } = req.body;

        const existingConversation = await Conversation.findOne({
            where: { type: 'individual' },
            include: [
                {
                    model: Users,
                    attributes: ['id'],
                    where: {
                        id: { [Op.in]: [currentUserId, participantId] }
                    },
                    through: { attributes: [] }
                }
            ],
            group: ['Conversation.id'],
            having: Sequelize.literal('COUNT(User.id) = 2')
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

        const lastMessageSubquery = `(SELECT createdAt FROM Messages WHERE Messages.conversationId = Conversation.id ORDER BY createdAt DESC LIMIT 1)`;

        const conversations = await Conversation.findAll({
            attributes: {
                include: [[Sequelize.literal(lastMessageSubquery), 'lastMessageAt']]
            },
            include: [
                {
                    model: Users,
                    through: { attributes: [] },
                    attributes: ['id', 'name', 'email'] 
                },
                {
                    model: Messages,
                    limit: 1,
                    order: [['createdAt', 'DESC']],
                    attributes: ['id', 'senderId', 'content', 'createdAt']
                }
            ],
            where: {
                '$Users.id$': currentUserId  
            },
            order: [
                [Sequelize.literal('lastMessageAt'), 'DESC'],
                ['createdAt', 'DESC']
            ]
        });

        const formattedConversations = await Promise.all(conversations.map(async (conv) => {
            const participants = await conv.getUsers({ attributes: ['id', 'name', 'email'] });

            const otherParticipant = participants.find(p => p.id !== currentUserId) || participants[0] || null;
            const lastMessage = Array.isArray(conv.Messages) && conv.Messages.length ? conv.Messages[0] : null;

            return {
                conversationId: conv.id,
                participant: otherParticipant,
                lastMessage: lastMessage ? {
                    content: lastMessage.content,
                    timestamp: lastMessage.createdAt
                } : null,
                createdAt: conv.createdAt
            };
        }));

        return res.status(200).json(formattedConversations);
    } catch (error) {
        console.error('Error fetching conversations:', error);
        return res.status(500).json({
            message: 'Error fetching conversations',
            error: error.message
        });
    }
};
