import Users from "./user.model.js";
import Conversation from "./conversation.model.js";
import Messages from "./messages.model.js";
import MessageReadStatus from "./messageReadStatus.model.js";
import ArchivedMessages from "./archivedMessages.model.js";

// 1. Many-to-Many: Users belong to many Conversations
Users.belongsToMany(Conversation, { through: 'ConversationParticipants' });
Conversation.belongsToMany(Users, { through: 'ConversationParticipants' });

// 2. One-to-Many: A Conversation has many Messages
Conversation.hasMany(Messages, { foreignKey: 'conversationId' });
Messages.belongsTo(Conversation, { foreignKey: 'conversationId' });

// 3. One-to-Many: A User sends many Messages
Users.hasMany(Messages, { foreignKey: 'senderId' });
Messages.belongsTo(Users, { foreignKey: 'senderId' });

// 4. Message Read Status
Messages.hasMany(MessageReadStatus, { foreignKey: 'messageId' });
MessageReadStatus.belongsTo(Messages, { foreignKey: 'messageId' });

Users.hasMany(MessageReadStatus, { foreignKey: 'userId' });
MessageReadStatus.belongsTo(Users, { foreignKey:  'userId' });

// 5. ArchivedMessages associations
Conversation.hasMany(ArchivedMessages, { foreignKey: 'conversationId' });
ArchivedMessages.belongsTo(Conversation, { foreignKey: 'conversationId' });

Users.hasMany(ArchivedMessages, { foreignKey: 'senderId' });
ArchivedMessages.belongsTo(Users, { foreignKey: 'senderId' });