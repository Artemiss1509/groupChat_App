import GeminiService from "../utils/gemini.service.js";
import Messages from "../models/messages.model.js";
import Users from "../models/user.model.js";

export const getPredictions = async (req, res) => {
    try {
        const { currentText, conversationId } = req.body;

        if (!currentText || currentText.length < 3) {
            return res.status(200).json({ predictions: [] });
        }

        const recentMessages = await Messages.findAll({
            where: { conversationId },
            include: [{
                model: Users,
                as: 'User',
                attributes: ['name']
            }],
            order: [['createdAt', 'DESC']],
            limit: 5
        });

        const conversationHistory = recentMessages.reverse().map(msg => ({
            senderName: msg.User.name,
            content: msg.content
        }));

        const predictions = await GeminiService.getPredictiveText(
            currentText,
            conversationHistory
        );

        res.status(200).json({ predictions });
    } catch (error) {
        console.error('Error getting predictions:', error);
        res.status(500).json({ 
            message: "Error generating predictions", 
            predictions: [] 
        });
    }
};

export const getSmartReplies = async (req, res) => {
    try {
        const { messageId, conversationId } = req.body;

        if (!messageId || !conversationId) {
            return res.status(400).json({ 
                message: "Message ID and conversation ID are required" 
            });
        }

        const messageToReply = await Messages.findByPk(messageId, {
            include: [{
                model: Users,
                as:  'User',
                attributes:  ['name']
            }]
        });

        if (!messageToReply) {
            return res.status(404).json({ message: "Message not found" });
        }

        const recentMessages = await Messages.findAll({
            where: { conversationId },
            include: [{
                model: Users,
                as: 'User',
                attributes: ['name']
            }],
            order: [['createdAt', 'DESC']],
            limit: 5
        });

        const conversationHistory = recentMessages.reverse().map(msg => ({
            senderName: msg.User.name,
            content: msg.content
        }));

        const smartReplies = await GeminiService.getSmartReplies(
            messageToReply.content,
            conversationHistory
        );

        res.status(200).json({ smartReplies });
    } catch (error) {
        console.error('Error getting smart replies:', error);
        res.status(500).json({ 
            message: "Error generating smart replies", 
            smartReplies: [] 
        });
    }
};