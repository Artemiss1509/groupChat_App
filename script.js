let ws = null;
let currentConversationId = null;
let currentChatUser = null;

document.addEventListener('DOMContentLoaded', ()=>{
    const signUp = document.getElementById('signupForm')
    const logIn = document.getElementById('loginForm')
    const modal = document.getElementById('new-chat-modal');
    const newChatBtn = document.getElementById('new-chat-btn');
    const closeModal = document.getElementById('close-modal');
    const searchBtn = document.getElementById('search-submit-btn');
    const searchInput = document.getElementById('user-search-input');
    const resultsList = document.getElementById('search-results-list');
    const sendBtn = document.getElementById('send-btn');
    const messageInput = document.getElementById('message-input');
    const chatList = document.getElementById('chats-list');

    if(signUp){
        signUp.addEventListener('submit', handleFormSubmit)
    }
    if(logIn){
        logIn.addEventListener('submit', loginFormSubmit)
    }
    if(newChatBtn){
        newChatBtn.onclick = () => {
            modal.style.display = "flex";
            searchInput.focus();
        }
    }
    if(closeModal){
        closeModal.onclick = () => {
            modal.style.display = "none";
            resultsList.innerHTML = '';
        }
    }
    if(searchBtn){
        searchBtn.addEventListener('click', searchResults)
    }
    if(sendBtn){
        sendBtn.addEventListener('click', sendMessage)
    }
    if(messageInput){
        messageInput.addEventListener('keypress', (e) => {
            if(e.key === 'Enter'){
                sendMessage();
            }
        })
    }

    if(chatList){
        loadUserConversations();
        initializeWebSocket(); 
    }
})

function initializeWebSocket() {
    const token = localStorage.getItem('token');
    if (!token) return;

    ws = new WebSocket('ws://localhost:3000');

    ws.onopen = () => {
        console.log('WebSocket connected');
        ws.send(JSON.stringify({
            type: 'auth',
            token: token
        }));
    };

    ws.onmessage = (event) => {
        try {
            const message = JSON.parse(event.data);
            
            if (message.type === 'auth') {
                console.log('WebSocket authentication:', message.status);
            }
            
            if (message.type === 'new_message') {
                const newMessage = message.data;
                
                if (newMessage.conversationId === currentConversationId) {
                    appendMessage(newMessage);
                }
            }
        } catch (error) {
            console.error('Error handling WebSocket message:', error);
        }
    };

    ws.onclose = () => {
        console.log('WebSocket disconnected');
        setTimeout(initializeWebSocket, 3000);
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };
}

async function handleFormSubmit(event) {
    event.preventDefault();

    const data = {
        name: event.target.username.value,
        phone: event.target.phone.value,
        email: event.target.email.value,
        password: event.target.password.value
    }

    try {
        await axios.post('http://localhost:3000/user/sign-up', data)
            .then(response => {
                console.log(response.data);
                alert('User signed up successfully!');
                clearError();
                document.getElementById('signupForm').reset();
            })
            .catch(error => {
                console.error('Sign-up error', error);
                displayError(error.response.data.message);
                return;
            });
    } catch (error) {
        console.error('Form submit request error', error);
    }
}

function displayError(message) {
    const errorDiv = document.getElementById('message');
    errorDiv.innerText = message;
    errorDiv.style.display = 'block';
}

function clearError() {
    const errorDiv = document.getElementById('message');
    errorDiv.innerText = '';
    errorDiv.style.display = 'none';
}

async function loginFormSubmit(event) {
    event.preventDefault();

    const data = {
        email: event.target.email.value,
        password: event.target.password.value
    }

    try {
        await axios.post('http://localhost:3000/user/sign-in', data)
            .then(response => {
                const token = response.data.token;
                localStorage.setItem('token', token);
                chatPage();
            })
            .catch(error => {
                console.error('Sign-in error', error);
                displayError(error.response.data.message);
                return;
            });
    } catch (error) {
        console.error('Login form submit request error', error);
    }
}

function chatPage(){
    window.location.href = 'chatPage.html';
}

async function searchResults() {
    const searchInput = document.getElementById('user-search-input');
    const token = localStorage.getItem('token');
    const query = searchInput.value;
    if (!query) return;

    try {
        const response = await axios.get(`http://localhost:3000/user/search?search=${query}`, {headers: { "Authorization": `Bearer ${token}` }});
        
        renderSearchResults(response.data);
    } catch (error) {
        console.error("Search failed", error);
        alert("Error searching for user");
    }
}

function renderSearchResults(users) {
    const resultsList = document.getElementById('search-results-list');
    resultsList.innerHTML = '';
    
    if(users.length === 0) {
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
    
    try {
        const response = await axios.post('http://localhost:3000/conversation/create', 
            { participantId: user.id },
            {headers: { "Authorization": `Bearer ${token}` }}
        );

        currentConversationId = response.data.conversation.id;
        currentChatUser = user;

        document.getElementById('chat-name').textContent = user.name;
        document.getElementById('chat-status').textContent = 'online';
        
        if(response.data.isNew){
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
    const chatList = document.getElementById('chats-list');
    
    const existingChats = chatList.querySelectorAll('.chat-item');
    for (let chat of existingChats) {
        if (chat.dataset.userId == user.id) {
            console.log(`Chat with ${user.name} already exists in sidebar`);
            return;
        }
    }
    
    const div = document.createElement('div');
    div.className = 'chat-item'; 
    div.textContent = user.name;
    div.dataset.userId = user.id;
    div.dataset.conversationId = conversationId;
    div.onclick = () => {
        currentConversationId = conversationId;
        currentChatUser = user;
        document.getElementById('chat-name').textContent = user.name;
        document.getElementById('chat-status').textContent = 'online';
        loadMessages(conversationId);
    }; 
    chatList.appendChild(div);
}

async function loadUserConversations() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await axios.get('http://localhost:3000/conversation/list', {
            headers: { "Authorization": `Bearer ${token}` }});

        const conversations = response.data;
        conversations.forEach(conv => {
            if(conv.participant){
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

        messageDiv.className = msg.senderId === currentUserId ?   'message sent' : 'message received';
        
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
        const response = await axios.post('http://localhost:3000/messages/send',
            {
                conversationId: currentConversationId,
                content: content
            },
            {
                headers: { "Authorization": `Bearer ${token}` }
            }
        );

        const newMessage = response.data.data;
        appendMessage(newMessage);

        // Send message via WebSocket to receiver
        if (ws && ws.readyState === WebSocket.OPEN && currentChatUser) {
            const payload = JSON.parse(atob(token.split('.')[1]));
            ws.send(JSON.stringify({
                type: 'new_message',
                conversationId: currentConversationId,
                senderId: payload.id,
                receiverId: currentChatUser.id,
                content: content,
                messageData: newMessage
            }));
        }

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