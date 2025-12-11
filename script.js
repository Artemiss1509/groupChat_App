let socket = null;
let currentConversationId = null;
let currentChatUser = null;

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
    }
}

function leaveConversation(conversationId) {
    if (socket && conversationId) {
        socket.emit('leave-conversation', conversationId);
    }
}

function showTypingIndicator(userName) {
    const container = document.getElementById('messages-container');
    const existingIndicator = document.getElementById('typing-indicator');
    
    if (! existingIndicator) {
        const indicator = document.createElement('div');
        indicator.id = 'typing-indicator';
        indicator.className = 'typing-indicator';
        indicator.textContent = `${userName} is typing...`;
        container.appendChild(indicator);
        container.scrollTop = container.scrollHeight;
    }
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
    const sendBtn = document.getElementById('send-btn');
    const messageInput = document.getElementById('message-input');
    const chatList = document.getElementById('chats-list');

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
            document.getElementById('new-chat-modal').style.display = "block";
        });
    }
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            document.getElementById('new-chat-modal').style.display = "none";
        });
    }
    if (searchBtn) {
        searchBtn.addEventListener('click', searchResults);
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

                console.log("User is typing...", localStorage.getItem('user'));
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
});

async function handleFormSubmit(event) {
    event.preventDefault();
    clearError();

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!name || !email || !phone || ! password) {
        displayError("All fields are required.");
        return;
    }

    try {
        const response = await axios.post('http://localhost:3000/user/sign-up', {
            name, email, phone, password
        });
        alert('Signup successful! Please login.');
        window.location.href = 'loginPage.html';
    } catch (error) {
        if (error.response && error.response.data) {
            displayError(error.response.data.message || 'Signup failed.');
        } else {
            displayError('An error occurred.Please try again.');
        }
    }
}

function displayError(message) {
    const errorDiv = document.getElementById('message');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }
}

function clearError() {
    const errorDiv = document.getElementById('message');
    if (errorDiv) {
        errorDiv.textContent = '';
        errorDiv.style.display = 'none';
    }
}

async function loginFormSubmit(event) {
    event.preventDefault();
    clearError();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    if (! email || !password) {
        displayError("All fields are required.");
        return;
    }

    try {
        const response = await axios.post('http://localhost:3000/user/sign-in', {
            email, password
        });

        const token = response.data.token;
        const user = JSON.stringify(response.data.user.name);
        localStorage.setItem('token', token);
        localStorage.setItem('user', user);
        initializeSocket();
        chatPage();
        
    } catch (error) {
        if (error.response && error.response.data) {
            displayError(error.response.data.message || 'Login failed. Please check your credentials.');
        } else {
            displayError('An error occurred.Please try again.');
        }
    }
}

function chatPage() {
    window.location.href = 'chatPage.html';
}

async function searchResults() {
    const query = document.getElementById('user-search-input').value.trim();
    const token = localStorage.getItem('token');

    if (!query) {
        alert('Please enter a search term');
        return;
    }

    try {
        const response = await axios.get(`http://localhost:3000/user/search? query=${query}`, {
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
        li.textContent = `${user.name} (${user.email})`;
        li.onclick = () => startChat(user);
        resultsList.appendChild(li);
    });
}

async function startChat(user) {
    const modal = document.getElementById('new-chat-modal');
    const token = localStorage.getItem('token');
    modal.style.display = "none";

    if (currentConversationId) {
        leaveConversation(currentConversationId);
    }

    try {
        const response = await axios.post('http://localhost:3000/conversation/create',
            { participantId: user.id },
            { headers: { "Authorization": `Bearer ${token}` } }
        );

        currentConversationId = response.data.conversation.id;
        //currentChatUser = user;

        document.getElementById('chat-name').textContent = user.name;
        document.getElementById('chat-status').textContent = 'online';

        joinConversation(currentConversationId);

        if (response.data.isNew) {
            addToSidebar(user, currentConversationId);
        }

        await loadMessages(currentConversationId);

        console.log(`Chat started with ${user.name}`);
    } catch (error) {
        console.error('Error starting chat:', error);
        alert('Error starting conversation');
    }
}

function addToSidebar(user, conversationId) {
    const chatsList = document.getElementById('chats-list');

    const chatItem = document.createElement('div');
    chatItem.className = 'chat-item';
    chatItem.dataset.conversationId = conversationId;

    chatItem.innerHTML = `
        <div class="chat-avatar">${user.name.charAt(0).toUpperCase()}</div>
        <div class="chat-info">
            <h3 class="chat-name">${user.name}</h3>
            <p id="chat-last-message">Chat</p>
        </div>
    `;

    chatItem.addEventListener('click', () => {
        if (currentConversationId) {
            leaveConversation(currentConversationId);
        }

        currentConversationId = conversationId;
        //currentChatUser = user;

        joinConversation(conversationId);

        document.getElementById('chat-name').textContent = user.name;
        document.getElementById('chat-status').textContent = 'online';
        loadMessages(conversationId);
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
        conversations.forEach(conv => {
            if (conv.participant && conv.lastMessage) {
                addToSidebar(conv.participant, conv.conversationId);
            }
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
        // console.log('messages loaded', messages[messages.length - 1].content);
        // document.getElementById('chat-last-message').textContent = messages[messages.length - 1].content;
        const user = JSON.parse(localStorage.getItem('user'));
        currentChatUser = user
        console.log('Loaded messages:', messages);
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

        messageDiv.className = msg.senderId === currentUserId ?  'message sent' : 'message received';

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = msg.content;

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

function appendMessage(message) {
    const container = document.getElementById('messages-container');
    const token = localStorage.getItem('token');
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentUserId = payload.id;

    const messageDiv = document.createElement('div');
    messageDiv.className = message.senderId === currentUserId ? 'message sent' : 'message received';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = message.content;

    messageDiv.appendChild(contentDiv);
    container.appendChild(messageDiv);

    container.scrollTop = container.scrollHeight;
}