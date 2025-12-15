import { Op } from "sequelize";
import sequelize from "../utils/DB.connection.js";
import Messages from "../models/messages.model.js";
import ArchivedMessages from "../models/archivedMessages.model.js";

export const archiveOldMessages = async () => {
    const transaction = await sequelize.transaction();
    
    try {
        const cutoffTime = new Date();
        cutoffTime.setHours(cutoffTime.getHours() - 24);

        console.log(`[Archive Service] Starting archival process for messages older than ${cutoffTime}`);

        const oldMessages = await Messages.findAll({
            where: {
                createdAt: {
                    [Op.lt]: cutoffTime
                }
            },
            transaction
        });

        if (oldMessages.length === 0) {
            console.log('[Archive Service] No messages to archive');
            await transaction.commit();
            return {
                success: true,
                archivedCount: 0,
                message: 'No messages to archive'
            };
        }

        console.log(`[Archive Service] Found ${oldMessages.length} messages to archive`);

        const archivedData = oldMessages.map(msg => ({
            originalMessageId: msg.id,
            senderId: msg. senderId,
            conversationId: msg.conversationId,
            content: msg.content,
            mediaUrl: msg.mediaUrl,
            mediaType: msg. mediaType,
            isRead:  msg.isRead,
            originalCreatedAt: msg.createdAt,
            archivedAt: new Date()
        }));

        await ArchivedMessages.bulkCreate(archivedData, { transaction });
        console.log(`[Archive Service] Successfully copied ${oldMessages.length} messages to archive`);

        const messageIdsToDelete = oldMessages.map(msg => msg.id);

        const deletedCount = await Messages.destroy({
            where: {
                id: {
                    [Op.in]: messageIdsToDelete
                }
            },
            transaction
        });

        console.log(`[Archive Service] Successfully deleted ${deletedCount} messages from Messages table`);

        await transaction.commit();

        return {
            success: true,
            archivedCount:  deletedCount,
            message: `Successfully archived ${deletedCount} messages`
        };

    } catch (error) {
        await transaction.rollback();
        console.error('Archive Service - Error archiving messages:', error);
        
        return {
            success: false,
            archivedCount: 0,
            error: error.message
        };
    }
};
