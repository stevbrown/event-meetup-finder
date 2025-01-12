import { createAlert } from "./alert.js"; // Импорт функции для создания оповещений

export async function checkLoginExists(login) { // Функция для проверки существования логина
    try { // Отправка POST запроса для проверки существования логина
        const response = await fetch('http://127.0.0.1:3000/api/check-login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ login })
        });

        const result = await response.json();
        return result.exists; // Возвращаем информацию о существовании логина
    } catch (error) {
        console.error('Ошибка проверки логина:', error);
        return false; // В случае ошибки возвращаем false
    }
}

export async function checkEmailExists(email) { // Функция для проверки существования почты
    try { // Отправка POST запроса для проверки существования почты
        const response = await fetch('http://127.0.0.1:3000/api/check-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });

        const result = await response.json();
        return result.exists; // Возвращаем информацию о существовании почты
    } catch (error) {
        console.error('Ошибка проверки почты:', error);
        return false; // В случае ошибки возвращаем false
    }
}

async function finishRegistration() { // Функция для завершения регистрации
    // Получаем значения всех полей формы
    const login = document.getElementById('login-in').value;
    const password = document.getElementById('password-in').value;
    const email = document.getElementById('email-in').value;
    const name = document.getElementById('name-in').value;
    const surname = document.getElementById('surname-in').value;
    const city = document.getElementById('city-in').value;
    const dob = document.getElementById('dob-in').value;

    // Проверка, существует ли уже такая почта
    const emailExists = await checkEmailExists(email); 
    if (emailExists) { 
        createAlert('Эта почта уже занят! Пожалуйста, выберите другую.', 'error');
        return; // Если почта занята, выводим предупреждение и выходим
    }
    
    // Проверка, заполнены ли все поля
    if (!login || !password || !email || !name || !surname || !city || !dob) {
        createAlert('Пожалуйста, заполните все поля!', 'warning');
        return; // Если хотя бы одно поле пустое, выводим предупреждение и выходим
    }

    // Проверка длины почты
    if (email.length < 5) {
        createAlert('Некоторые поля заполнены некорректно. Проверьте их длину и повторите попытку.', 'error');
        return; // Если почта слишком короткая, выводим ошибку и выходим
    }

    try { // Отправка POST запроса для регистрации пользователя
        const response = await fetch('http://127.0.0.1:3000/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ login, password, email, name, surname, city, dob }),
            credentials: 'include'
        });

        const data = await response.json();

        if (data.success) { // Успешная регистрация
            createAlert(data.message, 'success');
            clearInput(); // Очистка формы
            setTimeout(() => {
                window.location.href = "site.html"; // Перенаправление на сайт
            }, 500);
        } else { // Ошибка регистрации
            createAlert(data.message, 'error');
        }
    } catch (error) { // Ошибка сети
        console.error('Ошибка при регистрации:', error);
        createAlert('Ошибка сети! Пожалуйста, попробуйте позже.', 'error');
    }    
}

async function authorizationDone() { // Функция для авторизации
    const login = document.getElementById('a-login-in').value;
    const password = document.getElementById('a-password-in').value;
    let isEmail = false;

    // Проверка на пустоту полей
    if (!login || !password) {
        createAlert('Пожалуйста, заполните все поля!', 'warning');
        return; // Если хотя бы одно поле пустое, выводим предупреждение и выходим
    }

    // Проверка длины полей
    if (login.length < 3 || password.length < 8) {
        createAlert('Некоторые поля заполнены некорректно. Проверьте их длину и повторите попытку.', 'error');
        return; // Если логин слишком короткий, выводим ошибку и выходим
    }

    // Проверка, является ли логин email
    const emailPattern = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/
    if (emailPattern.test(login)) {
        isEmail = true; // Если да, возвращаем true
    }

    try { // Отправка POST запроса для авторизации пользователя
        const response = await fetch('http://127.0.0.1:3000/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ login, password, isEmail }),
            credentials: 'include'
        });

        const data = await response.json();

        if (data.success) { // Успешная авторизация
            createAlert(data.message, 'success');
            a_clearInput(); // Очистка формы
            setTimeout(() => {
                window.location.href = "site.html"; // Перенаправление на сайт
            }, 500);
        } else { // Ошибка авторизации
            createAlert(data.message, 'error');
        }
    } catch (error) { // Ошибка сети
        console.error('Ошибка при авторизации:', error);
        createAlert('Ошибка сети! Пожалуйста, попробуйте позже.', 'error');
    }    
}

function clearInput() { // Функция для очистки полей формы регистрации
    const loginValue = document.getElementById('login-in');
    const passwordValue = document.getElementById('password-in');
    const passwordConfirmValue = document.getElementById('confirmPassword-in');
    const emailValue = document.getElementById('email-in');
    const nameValue = document.getElementById('name-in');
    const surnameValue = document.getElementById('surname-in');
    const cityValue = document.getElementById('city-in');
    const dobValue = document.getElementById('dob-in');

    loginValue.value = '';
    passwordValue.value = '';
    passwordConfirmValue.value = '';
    emailValue.value = '';
    nameValue.value = '';
    surnameValue.value = '';
    cityValue.value = '';
    dobValue.value = '';
}

function a_clearInput() { // Функция для очистки полей формы авторизации
    const loginValue = document.getElementById('a-login-in');
    const passwordValue = document.getElementById('a-password-in');

    loginValue.value = '';
    passwordValue.value = '';

}

function toggleView(hideElement, showElement) { // Функция для переключения между формами
    hideElement.style.transform = "translateX(-100%)";
    hideElement.style.opacity = 0;

    setTimeout(() => {
        hideElement.style.display = 'none';
        hideElement.classList.remove('visible');
    }, 450);

    showElement.style.display = 'flex';
    showElement.style.transform = 'translateX(100%)'; // Позиция справа
    showElement.style.opacity = 0;

    setTimeout(() => {
        showElement.style.transform = 'translateX(0)'; // Плавный вход
        showElement.style.opacity = 1; // Плавный переход
        showElement.classList.add('visible');
    }, 50);
}

function signUp() { // Функция для отображения формы регистрации
    a_clearInput();
    const auth = document.querySelector('.authorization');
    const reg = document.querySelector('.registration');
    toggleView(auth, reg);
}

function signIn() { // Функция для отображения формы авторизации
    clearInput();
    const auth = document.querySelector('.authorization');
    const reg = document.querySelector('.registration');
    toggleView(reg, auth);
}

async function logOut() { // Функция для выхода из системы
    try {
        const response = await fetch('http://127.0.0.1:3000/api/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include'
        });

        const data = await response.json();

        if (data.success) {
            window.location.href = 'verify.html';
        }

    } catch(error) {
        console.error('Ошибка при выходе из системы:', error);
        createAlert('Ошибка сети. Пожалуйста, попробуйте позже.', 'error');
    }
}

window.finishRegistration = finishRegistration;
window.authorizationDone = authorizationDone;
window.signUp = signUp;
window.signIn = signIn;
window.logOut = logOut;
