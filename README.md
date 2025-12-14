# 💬 Real-Time Group Chat Application

A full-stack real-time messaging application with Socket.IO integration, supporting both individual and group conversations, multimedia sharing via AWS S3, and real-time typing indicators.

## 🚀 Features

### **Real-Time Communication**
- Instant messaging using Socket.IO
- Real-time typing indicators
- Live message delivery notifications
- Automatic conversation updates

### **Conversation Management**
- Individual (one-on-one) chats
- Group conversations with multiple participants
- Automatic conversation creation and retrieval
- Message read status tracking
- Conversation list with last message preview

### **Multimedia Sharing**
- Upload and share images, videos, and documents
- AWS S3 cloud storage integration
- Pre-signed URLs for secure media access
- Support for multiple file formats (JPEG, PNG, GIF, MP4, PDF, DOC, etc.)
- File size limit:  50MB per upload

### **User Authentication & Security**
- Secure user registration and login
- JWT-based authentication
- Password hashing with bcrypt
- Protected API routes
- Socket.IO authentication middleware

### **User Search & Discovery**
- Search users by name, email, or phone
- Create conversations with searched users
- Exclude current user from search results

## 🛠️ Tech Stack

**Frontend:**
- HTML5, CSS3, JavaScript (Vanilla JS)
- Socket.IO Client
- Real-time DOM manipulation

**Backend:**
- Node.js & Express.js
- Socket.IO Server
- Sequelize ORM
- JWT for authentication
- Multer for file uploads

**Database:**
- MySQL with Sequelize models
- Relational database design with proper associations

**Cloud Services:**
- AWS S3 for media storage
- AWS SDK v3

## 📁 Project Structure

```
groupChat_App/
├── app.js                       # Main application entry point with Socket.IO setup
├── controllers/
│   ├── auth.controller.js       # JWT authentication middleware
│   ├── user. controller.js       # User registration, login, and search
│   ├── conversation.controller.js  # Conversation creation and management
│   ├── messages.controller.js   # Message sending and retrieval
│   └── media. controller.js      # AWS S3 media upload and URL generation
├── models/
│   ├── user.model.js           # User schema
│   ├── conversation.model.js   # Conversation schema (individual/group)
│   ├── messages.model.js       # Message schema with media support
│   ├── messageReadStatus.model.js  # Read receipt tracking
│   └── associations.js         # Database relationships
├── routes/
│   ├── user.routes.js          # User-related endpoints
│   ├── conversation.routes.js  # Conversation endpoints
│   ├── messages.routes.js      # Message endpoints
│   └── media.routes.js         # Media upload endpoints
├── utils/
│   ├── DB.connection.js        # Sequelize database connection
│   ├── socket-io.js            # Socket.IO configuration
│   ├── aws. config.js           # AWS S3 client setup
│   ├── multer.config.js        # File upload configuration
│   └── env.js                  # Environment variables
├── index.html                   # Landing page
├── loginPage.html              # User login interface
├── chatPage.html               # Main chat interface
├── script.js                   # Frontend logic (20KB+)
└── chatStyle.css               # Application styling
```
