document.addEventListener('DOMContentLoaded', ()=>{
    const signUp = document.getElementById('signupForm')
    const logIn = document.getElementById('loginForm')
    const modal = document.getElementById('new-chat-modal');
    const newChatBtn = document.getElementById('new-chat-btn');
    const closeModal = document.getElementById('close-modal');
    const searchBtn = document.getElementById('search-submit-btn');
    const searchInput = document.getElementById('user-search-input');
    const resultsList = document.getElementById('search-results-list');

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
})

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
                console.log(response.data);
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
        const response = await axios.get(`http://localhost:3000/user/search?search=${query}`, {
            headers: { Authorization: token } 
        });
        
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


function startChat(user) {
    const modal = document.getElementById('new-chat-modal');
    modal.style.display = "none";
    
    document.getElementById('chat-name').textContent = user.name;
    document.getElementById('chat-status').textContent = 'online';
    
    localStorage.setItem('currentChatUserId', user.id);
    
    addToSidebar(user);
    document.getElementById('messages-container').innerHTML = '';
    
    console.log(`Chat started with ${user.name}`);
}


function addToSidebar(user) {
    const chatList = document.getElementById('chats-list');
    const div = document.createElement('div');
    div.className = 'chat-item'; 
    div.textContent = user.name;
    div.onclick = () => startChat(user); 
    chatList.appendChild(div);
}