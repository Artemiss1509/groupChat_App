let socket = null;
let currentConversationId = null;
let currentChatUser = null;
let selectedUsers = [];

function initializeSocket() {
    socket = io('http://localhost:3000', {
        auth: {
            token: localStorage.getItem('token')
        }
    });

    socket.on('connect', () => {
        console.log('Connected to Socket.IO server');
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from Socket.IO server');
    });

    socket.on('new-message', (message) => {
        console.log('Received new message:', message);
        
        if (currentConversationId && message.conversationId === currentConversationId) {
            appendMessage(message);
            markMessagesAsRead(currentConversationId);
        }
    });

    socket.on('conversation-update', (data) => {
        const token = localStorage.getItem('token');
        const payload = JSON.parse(atob(token.split('.')[1]));
        
        if (data.userId === payload.id) {
            loadUserConversations(); 
        }
    });

    socket.on('user-typing', (userName) => {
        showTypingIndicator(userName);
    });

    socket.on('user-stop-typing', () => {
        hideTypingIndicator();
    });
}

function joinConversation(conversationId) {
    if (socket && conversationId) {
        socket.emit('join-conversation', conversationId);
        markMessagesAsRead(conversationId);
    }
}

function leaveConversation(conversationId) {
    if (socket && conversationId) {
        socket.emit('leave-conversation', conversationId);
    }
}

function showTypingIndicator(userName) {
    const container = document.getElementById('messages-container');
    let indicator = document.getElementById('typing-indicator');
    
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'typing-indicator';
        indicator.className = 'typing-indicator';
        indicator.textContent = `${userName} is typing...`;
        container.appendChild(indicator);
    } else {
        indicator.textContent = `${userName} is typing...`;
    }
    
    container.scrollTop = container.scrollHeight;
}

function hideTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
        indicator.remove();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('signupForm');
    const loginForm = document.getElementById('loginForm');
    const newChatBtn = document.getElementById('new-chat-btn');
    const closeModalBtn = document.getElementById('close-modal');
    const searchBtn = document.getElementById('search-submit-btn');
    const createChatBtn = document.getElementById('create-chat-btn');
    const sendBtn = document.getElementById('send-btn');
    const messageInput = document.getElementById('message-input');
    const chatList = document.getElementById('chats-list');
    const mediaBtn = document.getElementById('attach-btn');
    const mediaInput = document.getElementById('media-input');

    const token = localStorage.getItem('token');
    if (token) {
        initializeSocket();
    }

    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
    if (loginForm) {
        loginForm.addEventListener('submit', loginFormSubmit);
    }
    if (newChatBtn) {
        newChatBtn.addEventListener('click', () => {
            selectedUsers = [];
            updateSelectedUsersDisplay();
            document.getElementById('new-chat-modal').style.display = "block";
        });
    }
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            document.getElementById('new-chat-modal').style.display = "none";
            selectedUsers = [];
        });
    }
    if (searchBtn) {
        searchBtn.addEventListener('click', searchResults);
    }
    if (createChatBtn) {
        createChatBtn.addEventListener('click', createChat);
    }
    if (sendBtn) {
        sendBtn.addEventListener('click', sendMessage);
    }
    if (messageInput) {
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });

        let typingTimeout;
        messageInput.addEventListener('input', () => {
            if (currentConversationId && socket) {
                socket.emit('typing', {
                    conversationId: currentConversationId,
                    userName: localStorage.getItem('user') || 'Someone'
                });

                clearTimeout(typingTimeout);
                typingTimeout = setTimeout(() => {
                    socket.emit('stop-typing', {
                        conversationId: currentConversationId
                    });
                }, 1000);
            }
        });
    }

    if (chatList) {
        loadUserConversations();
    }

    if (mediaBtn){
        mediaBtn.addEventListener('click', () => {
            mediaInput.click();
        });

        mediaInput.addEventListener('change', async (event) => {
            const file = event.target.files[0];
            if (file && currentConversationId) {
                await uploadMedia(currentConversationId, file);
                mediaInput.value = '';
            }
        });
    }
});

async function handleFormSubmit(event) {
    event.preventDefault();
    clearError();

    const name = event.target.username.value.trim();
    const email = event.target.email.value.trim();
    const phone = event.target.phone.value.trim();
    const password = event.target.password.value.trim();

    if (!name || !email || !phone || ! password) {
        displayError("All fields are required.");
        return;
    }

    try {
        const response = await axios.post('http://localhost:3000/user/sign-up', {
            name,
            phone,
            email,
            password
        });

        alert('Sign up successful!  Redirecting to login...');
        window.location.href = 'loginPage.html';
    } catch (error) {
        displayError(error.response?.data?.message || 'Sign up failed');
    }
}

function displayError(message) {
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }
}

function clearError() {
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
}

async function loginFormSubmit(event) {
    event.preventDefault();
    clearError();

    const email = event.target.email.value.trim();
    const password = event.target.password.value.trim();

    try {
        const response = await axios.post('http://localhost:3000/user/sign-in', {
            email,
            password
        });

        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', response.data.user.name);
        
        alert('Login successful! ');
        window.location.href = 'chatPage.html';
    } catch (error) {
        displayError(error.response?.data?.message || 'Login failed');
    }
}

async function searchResults() {
    const query = document.getElementById('user-search-input').value.trim();
    console.log('Searching for users with query:', query);
    const token = localStorage.getItem('token');

    if (!query) {
        alert('Please enter a search term');
        return;
    }

    try {
        const response = await axios.get(`http://localhost:3000/user/search?search=${query}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        const users = response.data;
        renderSearchResults(users);
    } catch (error) {
        console.error('Error searching users:', error);
        alert('Error searching users');
    }
}

function renderSearchResults(users) {
    const resultsList = document.getElementById('search-results-list');
    resultsList.innerHTML = '';

    if (users.length === 0) {
        resultsList.innerHTML = '<li>No users found</li>';
        return;
    }

    users.forEach(user => {
        const li = document.createElement('li');
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = user.id;
        checkbox.id = `user-${user.id}`;
        checkbox.checked = selectedUsers.some(u => u.id === user.id);
        
        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                selectedUsers.push(user);
            } else {
                selectedUsers = selectedUsers.filter(u => u.id !== user.id);
            }
            updateSelectedUsersDisplay();
        });

        const label = document.createElement('label');
        label.htmlFor = `user-${user.id}`;
        label.textContent = `${user.name} (${user.email})`;
        label.style.cursor = 'pointer';
        label.style.flex = '1';

        li.appendChild(checkbox);
        li.appendChild(label);
        resultsList.appendChild(li);
    });
}

function updateSelectedUsersDisplay() {
    const container = document.getElementById('selected-users-container');
    const createBtn = document.getElementById('create-chat-btn');
    
    container.innerHTML = '';
    
    if (selectedUsers.length === 0) {
        container.innerHTML = '<span style="color: #999;">No users selected</span>';
        createBtn.disabled = true;
    } else {
        createBtn.disabled = false;
        selectedUsers.forEach(user => {
            const tag = document.createElement('div');
            tag.className = 'selected-user-tag';
            tag.innerHTML = `
                ${user.name}
                <span class="remove-user" data-user-id="${user.id}">×</span>
            `;
            
            tag.querySelector('.remove-user').addEventListener('click', () => {
                selectedUsers = selectedUsers.filter(u => u.id !== user.id);
                updateSelectedUsersDisplay();
                
                const checkbox = document.getElementById(`user-${user.id}`);
                if (checkbox) checkbox.checked = false;
            });
            
            container.appendChild(tag);
        });
    }
}

async function createChat() {
    const modal = document.getElementById('new-chat-modal');
    const token = localStorage.getItem('token');

    if (selectedUsers.length === 0) {
        alert('Please select at least one user');
        return;
    }

    modal.style.display = "none";

    if (currentConversationId) {
        leaveConversation(currentConversationId);
    }

    try {
        const participantIds = selectedUsers.map(u => u.id);
        
        const response = await axios.post('http://localhost:3000/conversation/create',
            { participantIds },
            { headers: { "Authorization": `Bearer ${token}` } }
        );

        currentConversationId = response.data.conversation.id;

        let chatName;
        if (selectedUsers.length === 1) {
            chatName = selectedUsers[0].name;
        } else {
            chatName = selectedUsers.map(u => u.name).join(', ');
        }

        document.getElementById('chat-name').textContent = chatName;
        document.getElementById('chat-status').textContent = 'online';

        joinConversation(currentConversationId);

        if (response.data.isNew) {
            await loadUserConversations();
        }

        await loadMessages(currentConversationId);

        selectedUsers = [];
        console.log(`Chat started with ${chatName}`);
    } catch (error) {
        console.error('Error starting chat:', error);
        alert('Error starting conversation');
    }
}

function addToSidebar(conversation) {
    const chatsList = document.getElementById('chats-list');
    
    const existingChat = chatsList.querySelector(`[data-conversation-id="${conversation.conversationId}"]`);
    if (existingChat) {
        existingChat.remove();
    }

    const chatItem = document.createElement('div');
    chatItem.className = 'chat-item';
    chatItem.dataset.conversationId = conversation.conversationId;

    const displayName = conversation.name;
    const lastMessageText = conversation.lastMessage ?  conversation.lastMessage.content : 'No messages yet';
    const unreadClass = conversation.hasUnreadMessages ? 'unread' :  '';
    
    chatItem.innerHTML = `
        <div class="chat-avatar">${displayName.charAt(0).toUpperCase()}</div>
        <div class="chat-info">
            <h3 class="chat-name">${displayName}</h3>
            <p class="last-message ${unreadClass}">${lastMessageText}</p>
        </div>
        ${conversation.hasUnreadMessages ? '<div class="unread-indicator"></div>' : ''}
    `;

    chatItem.addEventListener('click', () => {
        if (currentConversationId) {
            leaveConversation(currentConversationId);
        }

        currentConversationId = conversation.conversationId;

        joinConversation(conversation.conversationId);

        document.getElementById('chat-name').textContent = displayName;
        document.getElementById('chat-status').textContent = 'online';
        loadMessages(conversation.conversationId);
    });

    chatsList.appendChild(chatItem);
}

async function loadUserConversations() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await axios.get('http://localhost:3000/conversation/list', {
            headers: { "Authorization": `Bearer ${token}` }
        });

        const conversations = response.data;
        const chatsList = document.getElementById('chats-list');
        chatsList.innerHTML = '';

        conversations.forEach(conv => {
            addToSidebar(conv);
        });

        console.log('Loaded conversations:', conversations);
    } catch (error) {
        console.error('Error loading conversations:', error);
    }
}

async function loadMessages(conversationId) {
    const token = localStorage.getItem('token');

    try {
        const response = await axios.get(`http://localhost:3000/messages/${conversationId}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        const messages = response.data;
        displayMessages(messages);
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

function displayMessages(messages) {
    const container = document.getElementById('messages-container');
    container.innerHTML = '';

    messages.forEach(msg => {
        const messageDiv = document.createElement('div');
        const token = localStorage.getItem('token');
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentUserId = payload.id;

        messageDiv.className = msg.senderId === currentUserId ? 'message sent' : 'message received';

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        if (msg.senderId !== currentUserId && msg.User) {
            const senderName = document.createElement('div');
            senderName.style.fontSize = '11px';
            senderName.style.fontWeight = 'bold';
            senderName.style.marginBottom = '4px';
            senderName.style.color = '#075e54';
            senderName.textContent = msg.User.name;
            contentDiv.appendChild(senderName);
        }
        
        const textDiv = document.createElement('div');
        textDiv.textContent = msg.content;
        contentDiv.appendChild(textDiv);

        messageDiv.appendChild(contentDiv);
        container.appendChild(messageDiv);
    });

    container.scrollTop = container.scrollHeight;
}

async function sendMessage() {
    const messageInput = document.getElementById('message-input');
    const content = messageInput.value.trim();
    const token = localStorage.getItem('token');

    if (!content || !currentConversationId) {
        console.log('No message or conversation selected');
        return;
    }

    try {
        await axios.post('http://localhost:3000/messages/send',
            {
                conversationId: currentConversationId,
                content: content
            },
            {
                headers: { "Authorization": `Bearer ${token}` }
            }
        );

        messageInput.value = '';

    } catch (error) {
        console.error('Error sending message:', error);
        alert('Error sending message');
    }
}

async function appendMessage(message) {
    const container = document.getElementById('messages-container');
    const token = localStorage.getItem('token');
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentUserId = payload.id;

    const messageDiv = document.createElement('div');
    messageDiv.className = message.senderId === currentUserId ? 'message sent' : 'message received';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    if (message.senderId !== currentUserId && message.User) {
        const senderName = document.createElement('div');
        senderName.style.fontSize = '11px';
        senderName.style.fontWeight = 'bold';
        senderName.style.marginBottom = '4px';
        senderName.style.color = '#075e54';
        senderName.textContent = message.User.name;
        contentDiv.appendChild(senderName);
    }
    let content = '';

    if (message.mediaUrl) {
        const mediaUrl = await getMediaUrl(message.mediaUrl);
        
        if (message.mediaType === 'image') {
            content = `<img src="${mediaUrl}" alt="${message.content}" class="message-image">`;
        } else if (message.mediaType === 'video') {
            content = `<video src="${mediaUrl}" controls class="message-video"></video>`;
        } else {
            content = `<a href="${mediaUrl}" download="${message.content}" class="message-file">📎 ${message.content}</a>`;
        }
    } else {
        content = `<p>${message.content}</p>`;
    }
    
    const textDiv = document.createElement('div');
    textDiv.innerHTML = content;
    contentDiv.appendChild(textDiv);

    messageDiv.appendChild(contentDiv);
    container.appendChild(messageDiv);

    container.scrollTop = container.scrollHeight;
    
    loadUserConversations();
}

async function markMessagesAsRead(conversationId) {
    const token = localStorage.getItem('token');
    
    try {
        await axios.post('http://localhost:3000/messages/mark-read',
            { conversationId },
            { headers:  { "Authorization": `Bearer ${token}` } }
        );
        
        loadUserConversations();
    } catch (error) {
        console.error('Error marking messages as read:', error);
    }
}

async function uploadMedia(conversationId, file) {
    try {
        const formData = new FormData();
        formData.append('media', file);
        formData.append('conversationId', conversationId);

        const token = localStorage.getItem('token');
        const response = await axios.post('http://localhost:3000/media/upload', formData, {
            headers: {
                'Authorization': `Bearer ${token}`,
            }
        });

        const data = response.data;
        
        if (response.status === 201) {
            console.log('Media uploaded successfully:', data);
            return data;
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Error uploading media:', error);
        alert('Failed to upload media:  ' + error.message);
    }
}

async function getMediaUrl(fileKey) {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:3000/media/url?fileKey=${fileKey}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        const data = response.data;
        return data.url;
    } catch (error) {
        console.error('Error getting media URL:', error);
        return null;
    }
}