async function checkLoginStatus() {
    try {
        const response = await fetch('/auth/me'); // Nowy endpoint do sprawdzania loginu
        const data = await response.json();

        if (response.ok) {
            document.getElementById('user-profile').classList.remove('hidden');
            document.getElementById('login-section').classList.add('hidden');
            document.getElementById('user-name').innerText = data.email;
            document.getElementById('user-email').innerText = data.email;
        } else {
            throw new Error('Not logged in');
        }
    } catch (error) {
        console.log('User not logged in:', error.message);
        document.getElementById('user-profile').classList.add('hidden');
        document.getElementById('login-section').classList.remove('hidden');
    }
}

async function handleLogin() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
        alert('Please enter both email and password.');
        return;
    }

    try {
        const response = await fetch('/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ loginOrEmail: email, password: password })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Login failed');

        // Zapisz dane użytkownika w `sessionStorage` lub `localStorage`
        alert('Login successful!');
        location.reload(); // Odśwież stronę po zalogowaniu
    } catch (error) {
        alert('Login not successful! Try again!');
    }
}


async function logout() {
    await fetch('/auth/logout', { method: 'POST' });
    location.reload(); // Odświeżenie strony
}

function showLoginPopup() {
    const popupContent = `
        <label for="login-email">Email:</label>
        <input type="text" id="login-email" required><br>

        <label for="login-password">Password:</label>
        <input type="password" id="login-password" required><br>
    `;

    showPopup(
        'User Login',
        popupContent,
        'Login',
        'Cancel',
        () => handleLogin()
    );
}


function requireAuth(req, res, next) {
    if (!req.cookies.userId) {
      return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }
    next();
  }
  
  function showRegisterPopup() {
    const popupContent = `
        <label for="register-email">Email:</label>
        <input type="email" id="register-email" required><br>

        <label for="register-password">Password:</label>
        <input type="password" id="register-password" required><br>

        <label for="register-login">Login:</label>
        <input type="text" id="register-login" required><br>

        <label for="register-name">Name:</label>
        <input type="text" id="register-name" required><br>

        <label for="register-surname">Surname:</label>
        <input type="text" id="register-surname" required><br>

        <label for="register-phone">Phone Number:</label>
        <input type="text" id="register-phone" required><br>
    `;

    showPopup(
        'User Registration',
        popupContent,
        'Register',
        'Cancel',
        () => handleRegister()
    );
}

async function handleRegister() {
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const login = document.getElementById('register-login').value;
    const name = document.getElementById('register-name').value;
    const surname = document.getElementById('register-surname').value;
    const phoneNumber = document.getElementById('register-phone').value;

    if (!email || !password || !login || !name || !surname || !phoneNumber) {
        alert('Please fill in all fields.');
        return;
    }

    try {
        const response = await fetch('/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                password,
                login,
                name,
                surname,
                phoneNumber
            })
        });

        if (!response.ok) {
            throw new Error('Registration failed.');
        }

        alert('Registration successful! You can now log in.');
        location.reload(); // Odświeżenie strony po rejestracji
    } catch (error) {
        console.error('Error registering user:', error.message);
        alert('Registration failed. Please try again.');
    }
}
