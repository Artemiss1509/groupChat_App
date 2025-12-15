import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, BUCKET_NAME } from '../utils/aws.config.js';
import Messages from '../models/messages.model.js';
import Users from '../models/user.model.js';
import Conversation from '../models/conversation.model.js';
import MessageReadStatus from '../models/messageReadStatus.model.js';
import { v4 as uuidv4 } from 'uuid';

export const uploadMedia = async (req, res) => {
    try {
        const senderId = req.user.id;
        const { conversationId } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        if (!conversationId) {
            return res.status(400).json({ message: "Conversation ID is required" });
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

    
        const fileExtension = file.originalname.split('.').pop();
        const fileName = `${uuidv4()}.${fileExtension}`;
        const fileKey = `conversations/${conversationId}/${fileName}`;

    
        const uploadParams = {
            Bucket:  BUCKET_NAME,
            Key: fileKey,
            Body:  file.buffer,
            ContentType: file.mimetype,
            Metadata: {
                originalName: file.originalname,
                uploadedBy: senderId.toString()
            }
        };

        await s3Client.send(new PutObjectCommand(uploadParams));

        
        const mediaType = file.mimetype.startsWith('image/') ? 'image' : 
                         file.mimetype.startsWith('video/') ? 'video' : 'file';


        const newMessage = await Messages.create({
            senderId,
            conversationId,
            content: file.originalname,
            mediaUrl: fileKey,
            mediaType:  mediaType
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


        const io = req.app.get('io');
        io.to(`conversation-${conversationId}`).emit('new-message', messageWithSender);


        const participants = await conversation.getUsers();
        participants.forEach(participant => {
            if (participant.id !== senderId) {
                io.emit('conversation-update', {
                    conversationId,
                    userId: participant.id
                });
            }
        });

        res.status(201).json({
            message: "Media uploaded successfully",
            data: messageWithSender
        });

    } catch (error) {
        console.error('Error uploading media:', error);
        res.status(500).json({
            message: "Error uploading media",
            error: error.message
        });
    }
};

export const getMediaUrl = async (req, res) => {
    try {
        const { fileKey } = req.query;
        const currentUserId = req.user.id;

        const conversationId = fileKey.split('/')[1];
        const conversation = await Conversation.findByPk(conversationId, {
            include:  [{
                model: Users,
                where: { id: currentUserId },
                through: { attributes: [] }
            }]
        });

        if (!conversation) {
            return res.status(403).json({ 
                message: "Access denied" 
            });
        }

        const command = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: fileKey
        });

        const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

        res.status(200).json({ url: signedUrl });

    } catch (error) {
        console.error('Error generating media URL:', error);
        res.status(500).json({
            message: "Error retrieving media",
            error: error.message
        });
    }
};