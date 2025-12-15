import Conversation from "../models/conversation.model.js";
import Users from "../models/user.model.js";
import Messages from "../models/messages.model.js";
import MessageReadStatus from "../models/messageReadStatus.model.js";
import { Sequelize } from "sequelize";

export const createOrGetConversation = async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const { participantIds } = req.body;

        if (!participantIds || ! Array.isArray(participantIds) || participantIds.length === 0) {
            return res.status(400).json({ 
                message: "At least one participant ID is required" 
            });
        }

        
        const allParticipantIds = [currentUserId, ...participantIds].sort();
        const conversationType = allParticipantIds.length === 2 ? 'individual' : 'group';

    
        const conversations = await Conversation.findAll({
            include: [{
                model: Users,
                attributes: ['id'],
                through: { attributes: [] }
            }]
        });

    
        for (const conv of conversations) {
            const convParticipantIds = conv.Users.map(u => u.id).sort();
            if (JSON.stringify(convParticipantIds) === JSON.stringify(allParticipantIds)) {
                return res.status(200).json({
                    conversation: conv,
                    isNew: false
                });
            }
        }


        const newConversation = await Conversation.create({
            type: conversationType,
            name: conversationType === 'group' ? req.body.groupName || 'Group Chat' : null
        });

        await newConversation.addUsers(allParticipantIds);

        res.status(201).json({
            conversation: newConversation,
            isNew: true
        });

    } catch (error) {
        console.error('Error creating/getting conversation:', error);
        res.status(500).json({
            message: "Error creating conversation",
            error:  error.message
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
                    attributes: ['id', 'senderId', 'content', 'createdAt'],
                    include: [{
                        model: MessageReadStatus,
                        attributes: ['userId', 'readAt']
                    }]
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
            const lastMessage = Array.isArray(conv.Messages) && conv.Messages.length ? conv.Messages[0] : null;


            let hasUnreadMessages = false;
            if (lastMessage) {
                const readStatus = lastMessage.MessageReadStatuses || [];
                const currentUserRead = readStatus.find(rs => rs.userId === currentUserId);
                hasUnreadMessages = ! currentUserRead && lastMessage.senderId !== currentUserId;
            }


            let displayName;
            let displayParticipants;

            if (conv.type === 'individual') {
                const otherParticipant = participants.find(p => p.id !== currentUserId);
                displayName = otherParticipant ? otherParticipant.name : 'Unknown';
                displayParticipants = [otherParticipant];
            } else {
                displayName = conv.name || participants.map(p => p.name).join(', ');
                displayParticipants = participants;
            }

            return {
                conversationId: conv.id,
                type: conv.type,
                name: displayName,
                participants:  displayParticipants,
                lastMessage: lastMessage ? {
                    content: lastMessage.content,
                    senderId: lastMessage.senderId,
                    timestamp: lastMessage.createdAt
                } : null,
                hasUnreadMessages,
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