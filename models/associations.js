import Users from "./user.model.js";
import Conversation from "./conversation.model.js";
import Messages from "./messages.model.js";

// 1. Many-to-Many: Users belong to many Conversations
Users.belongsToMany(Conversation, { through: 'ConversationParticipants' });
Conversation.belongsToMany(Users, { through: 'ConversationParticipants' });

// 2. One-to-Many: A Conversation has many Messages
Conversation.hasMany(Messages, { foreignKey: 'conversationId' });
Messages.belongsTo(Conversation, { foreignKey: 'conversationId' });

// 3. One-to-Many: A User sends many Messages
Users.hasMany(Messages, { foreignKey: 'senderId' });
Messages.belongsTo(Users, { foreignKey: 'senderId' });