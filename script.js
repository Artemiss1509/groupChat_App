document.addEventListener('DOMContentLoaded', ()=>{
    const signUp = document.getElementById('signupForm')
    const logIn = document.getElementById('loginForm')

    if(signUp){
        signUp.addEventListener('submit', handleFormSubmit)
    }
    if(logIn){
        logIn.addEventListener('submit', loginFormSubmit)
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
                expensePage();
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