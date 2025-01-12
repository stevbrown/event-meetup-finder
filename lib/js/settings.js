import { createAlert } from './alert.js'; // Импорт функции для создания оповещений
import { minDate } from './activation.js'; // Импорт функция для установки минимальной даты
import { loadEventInfo, loadAllEvent } from './event.js'; // Импорт функции для загрузки ивентов
import { checkEmailExists } from './verify.js'; // Импорт функции для проверки почты

document.addEventListener("DOMContentLoaded", () => { // Выполняем действия после загрузки DOM
    // Если текущая страница не `site.html` или `post.html`, выполняем дополнительные настройки
    if (!window.location.pathname.endsWith("site.html") && !window.location.pathname.endsWith("post.html")) {
        minDate(); // Устанавливаем минимальную дату
    }
});

async function loadUserInfo() { // Загружаем информацию о пользователе с сервера и обновляет соответствующие элементы интерфейса
    try {
        const response = await fetch('http://127.0.0.1:3000/api/get/user', {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Ошибка получения данных пользователя');
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Ошибка');
        }

        const { userId, email, name, surname, gender, city, phone, dob, is_organizer, is_admin } = data;

        const userElements = document.querySelectorAll('[data-user="true"]');
        userElements.forEach(element => {
            element.innerHTML = `${name} ${surname}`;
        });

        const userInitials = document.querySelectorAll('[data-initials="true"]');
        const initials = `${name.charAt(0)}${surname.charAt(0)}`;
        userInitials.forEach(element => {
            element.textContent = initials.toUpperCase();
        });
        
        const userID = document.querySelectorAll('[data-id="true"]');
        userID.forEach(element => {
            element.innerHTML = `ID: ${String(userId).padStart(9, '0')}`;
        });

        const userEmail = document.querySelectorAll('[data-email="true"]');
        userEmail.forEach(element => {
            element.innerHTML = `${email}`;
        });

        const userPhone = document.querySelectorAll('[data-phone="true"]');
        userPhone.forEach(element => {
            let phoneNumber = phone;
            if (phoneNumber) {
                phoneNumber = phoneNumber.replace(/\D/g, '');

                if (phoneNumber.startsWith('7') && phoneNumber.length === 11) {
                    element.innerHTML = `+7 *** *** ** ${phoneNumber.slice(-2)}`;
                } else if (phoneNumber.startsWith('40') && phoneNumber.length === 11) {
                    element.innerHTML = `+40 *** *** ${phoneNumber.slice(-3)}`;
                } else if (phoneNumber.startsWith('373') && phoneNumber.length === 11) {
                    element.innerHTML = `+373 *** *** ${phoneNumber.slice(-2)}`;
                } else {
                    element.innerHTML = `${phone}`;
                }
            } else {
                element.innerHTML = 'Добавить номер телефона';
            }
        });

        getChangedAt('password');

        const inputName = document.getElementById('name-in');
        inputName.value = `${name}`;
        inputName.placeholder = `${name}`;

        const inputSurname = document.getElementById('surname-in');
        inputSurname.value = `${surname}`;
        inputSurname.placeholder = `${surname}`;

        const inputGender = document.getElementById('gender-in');
        inputGender.value = `${gender}`;

        const inputDOB = document.getElementById('dob-in');
        
        const dateObj = new Date(dob);
        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const year = dateObj.getFullYear();
        const formattedDate = `${year}-${month}-${day}`;

        inputDOB.value = formattedDate;

        const inputCity = document.getElementById('city-in');
        inputCity.value = `${city}`;


        if (phone && email) {
            document.getElementById('protected').style.display = 'flex';
        }

        if (is_organizer && !is_admin) {
            document.getElementById('organizered').style.display = 'flex';
        } else {
            if (!is_admin) document.getElementById('organizer-panel').style.display = 'none';
        }

        if (is_admin) {
            document.getElementById('admined').style.display = 'flex';
        } else {
            document.getElementById('admin-panel').style.display = 'none';
        }

        loadEventInfo(userId);

    } catch (error) {
        console.error('Ошибка:', error.message);
    }
}

window.loadUserInfo = loadUserInfo;

// document.addEventListener('DOMContentLoaded', () => {
//     fetch('http://127.0.0.1:3000/api/check-auth', {
//     method: 'GET',
//     credentials: 'include'
//     })
//     .then(response => {
//         if (!response.ok) {
//             window.location.href = 'verify.html';
//         } else {
//             loadUserInfo();
//         }
//     })
//     .catch(error => console.error('Ошибка:', error));
// });

// async function checkEmailExists(email) {
//     try {
//         const response = await fetch('http://127.0.0.1:3000/api/check-email', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify({ email })
//         });

//         const result = await response.json();
//         return result.exists;
//     } catch (error) {
//         console.error('Ошибка проверки почты:', error);
//         return false;
//     }
// }

export function openOption(option) { // Открываем выбранный раздел настроек, скрывая остальные
    let element;
    const operationalElements = document.querySelectorAll('.operational');

    operationalElements.forEach(el => {
        el.style.display = 'none';
        el.classList.remove('loaded');
        el.classList.add('unloaded');
    });

    switch (option) {
        case 'main':
            element = document.querySelector('#main.operational');
            document.title = "• Главная — Настройки";
            break;
        case 'personal':
            element = document.querySelector('#personal.operational');
            document.title = "• Личные данные — Настройки";
            break;
        case 'organizer':
            element = document.querySelector('#organizer.operational');
            document.title = "• Управление мероприятиями — Настройки";
            break;
        case 'admin':
            element = document.querySelector('#admin.operational');  
            document.title = "• Панель администратора — Настройки";
            break;
        case 'security':
            element = document.querySelector('#security.operational');
            document.title = "• Безопасность и вход — Настройки";
            break;
        default:
            break;
    }

    if (element) {
        element.style.display = 'flex';
        setTimeout(() => {
            element.classList.add('loaded');
            setTimeout(() => {
                window.scrollTo(0, 0);
            }, 100);
        }, 100);
        let elementImg;
        if(element === document.querySelector('#organizer.operational')) {
            elementImg = document.querySelector('#organizerImg.add');        
            setTimeout(() => {
                elementImg.style.display = 'flex';
                setTimeout(() => {
                    elementImg.classList.add('loaded');
                }, 200);
            }, 100);
        } else {
            elementImg = document.querySelector('#organizerImg.add');
            elementImg.classList.remove('loaded');
            elementImg.style.display = 'none';
        }
    }

    if (element === document.querySelector('#admin.operational')) {
        loadAllEvent();
    }
}

// export function openCreateEvent() {
//     const element = document.querySelector('#createEvent.options');
//     const step1 = document.getElementById('step1');
//     const step2 = document.getElementById('step2');
//     let rotationAngle = 0;
//     if (element.style.display != 'flex') {
//         element.style.display = 'flex';
//         step1.style.display = 'flex';
//         setTimeout(() => {
//             element.classList.add('loaded');
//             rotationAngle = (rotationAngle + 45) % 360;
//             document.getElementById('addImg').style.transform = `rotate(${rotationAngle}deg)`;
//             setTimeout(() => {
//                 window.scrollTo(0, 0);
//             }, 100);
//         }, 100);
//     } else {
//         element.classList.remove('loaded');
//         setTimeout(() => {
//             element.style.display = 'none';
//             step1.style.display = 'flex';
//             step2.style.display = 'none';
//             document.getElementById('addImg').style.transform = `rotate(${rotationAngle}deg)`;
//             setTimeout(() => {
//                 window.scrollTo(0, 0);
//             }, 100);
//         }, 1450);
//     }
// }

function openCreateEvent(editMode = false) { // Открываем или закрываем форму создания/редактирования мероприятия
    const element = document.querySelector('#createEvent.options');
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    let rotationAngle = 0;

    if (element.style.display !== 'flex') {
        element.style.display = 'flex';

        setTimeout(() => {
            element.classList.add('loaded');
            rotationAngle = (rotationAngle + 45) % 360;
            document.getElementById('addImg').style.transform = `rotate(${rotationAngle}deg)`;
            setTimeout(() => {
                window.scrollTo(0, 0);
            }, 100);

            if (!editMode) {
                document.getElementById('title-event').textContent = 'Создание нового мероприятия';
                const inputs = document.querySelectorAll('#createEvent input');
                const textareas = document.querySelectorAll('#createEvent textarea');

                textareas.forEach(textarea => {
                    textarea.value = '';
                });

                inputs.forEach(input => {
                    if (input.type === 'file') {
                        input.value = '';
                    } else {
                        input.value = '';
                    }
                });

                step1.style.display = 'flex';
                step2.style.display = 'none';
            }
        }, 100);
    } else {
        element.classList.remove('loaded');

        setTimeout(() => {
            element.style.display = 'none';

            if (!editMode) {
                step1.style.display = 'flex';
                step2.style.display = 'none';
            }

            document.getElementById('addImg').style.transform = `rotate(${rotationAngle}deg)`;
            setTimeout(() => {
                window.scrollTo(0, 0);
            }, 100);
        }, 1450);
    }
}

function copyToClipboard() { // Копируем текст ID пользователя в буфер обмена
    const element = document.getElementById('id');
    
    if (element) {
        const text = element.textContent;
        const formattedId = 'id' + text.replace('ID: ', '').trim();
        const formattedNonId = text.replace('ID: ', '').trim();

        navigator.clipboard.writeText(formattedId)
            .then(() => {
                createAlert(`Ваш ID ${formattedNonId} успешно скопирован в буфер обмена!`, 'success');
            })
            .catch(err => {
                console.error('Ошибка копирования в буфер обмена:', err);
                createAlert('Ошибка копирования в буфер обмена!', 'error');
            });
    } else {
        console.error('Элемент с ID не найден!');
        createAlert('Ошибка копирования в буфер обмена!', 'error');
    }
}

async function savePersonal() { // Сохраняем измененные личные данные пользователя
    const name = document.getElementById('name-in').value;
    const surname = document.getElementById('surname-in').value;
    const gender = document.getElementById('gender-in').value;
    const city = document.getElementById('city-in').value;
    const dob = document.getElementById('dob-in').value;

    try {
        const response = await fetch('http://127.0.0.1:3000/api/user/change/personal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, surname, gender, city, dob }),
            credentials: 'include'
        });

        const data = await response.json();

        if (data.success) {
            createAlert(data.message, 'success');
            clearInput();
            location.reload();
        } else {
            createAlert(data.message, 'error');
        }
    } catch (error) {
        console.error('Ошибка при изменении:', error);
        createAlert('Ошибка сети. Пожалуйста, попробуйте позже.', 'error');
    }    
}

async function deleteAccount() { // Удаляем пользователя
    try {
        const response = await fetch('http://127.0.0.1:3000/api/user/delete', {
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

async function changePassword() { // Сохраняем изменный пароль пользователя
    const passwordOld = document.getElementById('o-password-in').value;
    const passwordNew = document.getElementById('c-password-in').value;
    const confirmPasswordNew = document.getElementById('c-confirmPassword-in').value;

    if (!passwordOld || !passwordNew || !confirmPasswordNew) {
        createAlert('Пожалуйста, заполните все поля.', 'warning');
        return false;
    }

    if (passwordNew !== confirmPasswordNew) {
        createAlert('Упс! Кажется, пароли не совпадают.', 'warning');
        return false;
    }

    try {
        const response = await fetch('http://127.0.0.1:3000/api/user/change/password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ passwordOld, passwordNew }),
            credentials: 'include'
        });

        const data = await response.json();

        if (data.success) {
            createAlert(data.message, 'success');
            const passwordOldIn = document.getElementById('o-password-in');
            const passwordNewIn = document.getElementById('c-password-in');
            const confirmPasswordNewIn = document.getElementById('c-confirmPassword-in');

            passwordOldIn.value = '';
            passwordNewIn.value = '';
            confirmPasswordNewIn.value = '';

            setTimeout(() => {
                location.reload();
                }, 1500);
            return true;
        } else {
            createAlert(data.message, 'error');
        }
    } catch (error) {
        console.error('Ошибка при изменении:', error);
        createAlert('Ошибка сети. Пожалуйста, попробуйте позже.', 'error');
    } 
}

async function changePhone() { // Сохраняем новым номер телефона пользователя
    let phone = document.getElementById('phone-in').value;
    let phoneValue = phone.replace(/\D/g, '');

    if (!phone || phone === '+') {
        createAlert('Пожалуйста, заполните все поля.', 'warning');
        return false;
    }

    if (phoneValue.length < 8) {
        createAlert('Номер телефона должен содержать от 8 цифр.', 'warning');
        return false;
    }

    console.log(phoneValue);

    try {
        const response = await fetch('http://127.0.0.1:3000/api/user/change/phone', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phoneValue }),
            credentials: 'include'
        });

        const data = await response.json();

        if (data.success) {
            createAlert(data.message, 'success');
            phone = '';
            setTimeout(() => {
            location.reload();
            }, 1500);
            return true;
        } else {
            createAlert(data.message, 'error');
        }
    } catch (error) {
        console.error('Ошибка при изменении:', error);
        createAlert('Ошибка сети. Пожалуйста, попробуйте позже.', 'error');
    } 
}

async function changeEmail() { // Сохраняем новую почту пользователя
    const emailNew = document.getElementById('email-in').value;
    const emailConfirm = document.getElementById('confirmEmail-in').value;
    const emailExists = await checkEmailExists(emailNew);

    if (emailExists) {
        createAlert("Эта почта уже занят. Пожалуйста, выберите другую.", 'error');
        return false;
    }

    if (!emailNew || !emailConfirm) {
        createAlert('Пожалуйста, заполните все поля.', 'warning');
        return false;
    }

    if (emailNew !== emailConfirm) {
        createAlert("Почты не совпадают.", 'warning');
        return false;
    }

    try {
        const response = await fetch('http://127.0.0.1:3000/api/user/change/email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ emailNew }),
            credentials: 'include'
        });

        const data = await response.json();

        if (data.success) {
            createAlert(data.message, 'success');
            const emailNewIn = document.getElementById('email-in');
            const emailConfirm = document.getElementById('confirmEmail-in');

            emailNewIn.value = '';
            emailConfirm.value = '';

            setTimeout(() => {
                location.reload();
                }, 1500);
            return true;
        } else {
            createAlert(data.message, 'error');
        }
    } catch (error) {
        console.error('Ошибка при изменении:', error);
        createAlert('Ошибка сети. Пожалуйста, попробуйте позже.', 'error');
    }  
}



async function getChangedAt(changed) { // Получаем информацию о времени последнего изменения указанного параметра пользователя (пароля в данном случае)
    try {
        const response = await fetch('http://127.0.0.1:3000/api/get/user/changed', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ changed }),
            credentials: 'include'
        });

        const data = await response.json();

        if (data.success) {
            const changedAt = data.changed_at;
            if (changed === 'password') {
                const userPassword = document.querySelectorAll('[data-password="true"]');
                userPassword.forEach(element => {
                    element.innerHTML = `Был изменён ${changedAt}`;
                });
            }
        } else {
            if (changed === 'password') {
                const userPassword = document.querySelectorAll('[data-password="true"]');
                userPassword.forEach(element => {
                    element.innerHTML = 'Обновить пароль';
                });
            }
        }
    } catch (error) {
        console.error('Ошибка при изменении:', error);
        createAlert('Ошибка сети. Пожалуйста, попробуйте позже.', 'error');
    }
}

function clearInput() { // Очищает все поля ввода на форме
    const dobValue = document.getElementById('dob-in');
    const nameValue = document.getElementById('name-in');
    const surnameValue = document.getElementById('surname-in');
    const cityValue = document.getElementById('city-in');
    const genderValue = document.getElementById('gender-in');

    dobValue.value = '';
    nameValue.value = '';
    surnameValue.value = '';
    cityValue.value = '';
    genderValue.value = '';
}

function clearModal() { // Очищает содержимое модального окна, удаляя его
    const modal = document.querySelector('.modal-content');
    if (modal) {
        modal.remove();
    }
}

function confirmDelete() { // Отображаем модал подтверждения удаления аккаунта
    const modal = document.getElementById("modals");

    clearModal();
    const modalContent = document.createElement('div');
    modalContent.classList.add('modal-content');

    const modalText = document.createElement('p');
    modalText.textContent = 'Вы уверены, что хотите удалить аккаунт?';

    const modal2Text = document.createElement('p');
    modal2Text.textContent = 'Это действие нельзя будет отменить.';
        
    const modalButtons = document.createElement('div');
    modalButtons.classList.add('modal-buttons');

    const modalConfirmButton = document.createElement('button');
    modalConfirmButton.classList.add('delete-confirm');
    modalConfirmButton.id = 'confirmButton';
    modalConfirmButton.textContent = 'Удалить';
    
    const modalCancelButton = document.createElement('button');
    modalCancelButton.classList.add('cancel');
    modalCancelButton.id = 'cancelButton';
    modalCancelButton.textContent = 'Отмена';

    modalButtons.appendChild(modalConfirmButton);
    modalButtons.appendChild(modalCancelButton);

    modalContent.appendChild(modalText);
    modalContent.appendChild(modal2Text);
    modalContent.appendChild(modalButtons);

    modal.style.display = "flex";
    modal.appendChild(modalContent);
    setTimeout(() => {
        modal.classList.add('loaded');
    }, 10);
    
    document.getElementById("confirmButton").onclick = function () {
        modal.classList.remove('loaded');
        setTimeout(() => {
            modal.style.display = "none";
        }, 1000);
        deleteAccount();
        modalContent.remove();
    };

    document.getElementById("cancelButton").onclick = function () {
        modal.classList.remove('loaded');
        setTimeout(() => {
            modal.style.display = "none";
        }, 1000);
        modalContent.remove();
    };
}

function openChangePassword() { // Отображаем модал изменения пароля
    const modal = document.getElementById("modals");

    clearModal();
    const modalContent = document.createElement('div');
    modalContent.classList.add('modal-content');

    const backgroundImg = document.createElement('img');
    backgroundImg.id = 'background';
    backgroundImg.src = 'img/online-check-in.svg';
    modalContent.appendChild(backgroundImg);

    const wrapper = document.createElement('div');
    wrapper.classList.add('wrapper');

    const inputsWrapper = document.createElement('div');
    inputsWrapper.classList.add('inputs');

    const oldPasswordInputWrapper = document.createElement('div');
    oldPasswordInputWrapper.classList.add('input');
    const oldPasswordImg = document.createElement('img');
    oldPasswordImg.src = 'img/background/button-pattern/key.svg';
    oldPasswordImg.alt = 'СП';
    const oldPasswordInput = document.createElement('input');
    oldPasswordInput.id = 'o-password-in';
    oldPasswordInput.type = 'text';
    oldPasswordInput.maxLength = 255;
    oldPasswordInput.placeholder = 'Так-с! Нужен твой старый пароль..';
    oldPasswordInput.setAttribute('oninput', 'blockCyrillic(event)');
    oldPasswordInput.setAttribute('onblur', 'validateCheckPassword(event)');
    oldPasswordInputWrapper.appendChild(oldPasswordImg);
    oldPasswordInputWrapper.appendChild(oldPasswordInput);
    inputsWrapper.appendChild(oldPasswordInputWrapper);

    const newPasswordInputWrapper = document.createElement('div');
    newPasswordInputWrapper.classList.add('input');
    const newPasswordImg = document.createElement('img');
    newPasswordImg.src = 'img/background/button-pattern/key.svg';
    newPasswordImg.alt = 'НП';
    const newPasswordInput = document.createElement('input');
    newPasswordInput.id = 'c-password-in';
    newPasswordInput.type = 'password';
    newPasswordInput.maxLength = 255;
    newPasswordInput.placeholder = 'Отлично! Теперь новый пароль..';
    newPasswordInput.setAttribute('oninput', 'blockCyrillic(event)');
    newPasswordInput.setAttribute('onblur', 'validateCheckPassword(event)');
    newPasswordInputWrapper.appendChild(newPasswordImg);
    newPasswordInputWrapper.appendChild(newPasswordInput);
    inputsWrapper.appendChild(newPasswordInputWrapper);

    const confirmPasswordInputWrapper = document.createElement('div');
    confirmPasswordInputWrapper.classList.add('input');
    const confirmPasswordImg = document.createElement('img');
    confirmPasswordImg.src = 'img/background/button-pattern/keyhole.svg';
    confirmPasswordImg.alt = 'ПП';
    const confirmPasswordInput = document.createElement('input');
    confirmPasswordInput.id = 'c-confirmPassword-in';
    confirmPasswordInput.type = 'password';
    confirmPasswordInput.maxLength = 255;
    confirmPasswordInput.placeholder = 'Давай-ка еще разок, чтобы без ошибок!';
    confirmPasswordInput.setAttribute('oninput', 'blockCyrillic(event)');
    confirmPasswordInputWrapper.appendChild(confirmPasswordImg);
    confirmPasswordInputWrapper.appendChild(confirmPasswordInput);
    inputsWrapper.appendChild(confirmPasswordInputWrapper);

    wrapper.appendChild(inputsWrapper);

    const modalButtons = document.createElement('div');
    modalButtons.classList.add('modal-buttons');

    const changeButton = document.createElement('button');
    changeButton.id = 'changeButton';
    changeButton.classList.add('change');
    changeButton.textContent = 'Изменить';
    changeButton.setAttribute('onclick', 'changePassword()');
    modalButtons.appendChild(changeButton);

    const cancelButton = document.createElement('button');
    cancelButton.id = 'cancelButton';
    cancelButton.classList.add('cancel');
    cancelButton.textContent = 'Отмена';
    modalButtons.appendChild(cancelButton);

    wrapper.appendChild(modalButtons);
    modalContent.appendChild(wrapper);

    modal.style.display = "flex";
    modal.appendChild(modalContent);
    setTimeout(() => {
        modal.classList.add('loaded');
    }, 10);
    
    document.getElementById("changeButton").onclick = function () {
        if(changePassword() === true) {
            modal.classList.remove('loaded');
            setTimeout(() => {
                modal.style.display = "none";
            }, 1000);
            modalContent.remove();
        };
    };

    document.getElementById("cancelButton").onclick = function () {
        modal.classList.remove('loaded');
        setTimeout(() => {
            modal.style.display = "none";
        }, 1000);
        modalContent.remove();
    };
}

function openChangePhone() { // Отображаем модал изменения телефона
    const modal = document.getElementById("modals");

    clearModal();
    const modalContent = document.createElement('div');
    modalContent.classList.add('modal-content');

    const backgroundImg = document.createElement('img');
    backgroundImg.id = 'background';
    backgroundImg.src = 'img/app-qr-code.svg';
    modalContent.appendChild(backgroundImg);

    const wrapper = document.createElement('div');
    wrapper.classList.add('wrapper');

    const inputsWrapper = document.createElement('div');
    inputsWrapper.classList.add('inputs');

    const phoneInputWrapper = document.createElement('div');
    phoneInputWrapper.classList.add('input');
    const phoneImg = document.createElement('img');
    phoneImg.src = 'img/background/button-pattern/phone-list.svg';
    phoneImg.alt = 'НТ';
    const phoneInput = document.createElement('input');
    phoneInput.id = 'phone-in';
    phoneInput.type = 'text';
    phoneInput.maxLength = 255;
    phoneInput.placeholder = '+7(___)-___-__-__';
    phoneInput.value = '+';
    phoneInput.setAttribute('oninput', 'onlyNumber(event)');
    phoneInput.setAttribute('onblur', 'validatePhoneNumber(event)');
    phoneInputWrapper.appendChild(phoneImg);
    phoneInputWrapper.appendChild(phoneInput);
    inputsWrapper.appendChild(phoneInputWrapper);

    wrapper.appendChild(inputsWrapper);

    const modalButtons = document.createElement('div');
    modalButtons.classList.add('modal-buttons');

    const changeButton = document.createElement('button');
    changeButton.id = 'changeButton';
    changeButton.classList.add('change');
    changeButton.textContent = 'Изменить';
    changeButton.setAttribute('onclick', 'changePhone()');
    modalButtons.appendChild(changeButton);

    const cancelButton = document.createElement('button');
    cancelButton.id = 'cancelButton';
    cancelButton.classList.add('cancel');
    cancelButton.textContent = 'Отмена';
    modalButtons.appendChild(cancelButton);

    wrapper.appendChild(modalButtons);
    modalContent.appendChild(wrapper);

    modal.style.display = "flex";
    modal.appendChild(modalContent);
    setTimeout(() => {
        modal.classList.add('loaded');
    }, 10);
    
    document.getElementById("changeButton").onclick = function () {
        if(changePhone() === true) {
            modal.classList.remove('loaded');
            setTimeout(() => {
                modal.style.display = "none";
            }, 1000);
            modalContent.remove();
        };
    };

    document.getElementById("cancelButton").onclick = function () {
        modal.classList.remove('loaded');
        setTimeout(() => {
            modal.style.display = "none";
        }, 1000);
        modalContent.remove();
    };
}

function openChangeEmail() { // Отображаем модал изменения почты
    const modal = document.getElementById("modals");

    clearModal();
    const modalContent = document.createElement('div');
    modalContent.classList.add('modal-content');

    const backgroundImg = document.createElement('img');
    backgroundImg.id = 'background';
    backgroundImg.src = 'img/mailbox.svg';
    modalContent.appendChild(backgroundImg);

    const wrapper = document.createElement('div');
    wrapper.classList.add('wrapper');

    const inputsWrapper = document.createElement('div');
    inputsWrapper.classList.add('inputs');

    const newEmailInputWrapper = document.createElement('div');
    newEmailInputWrapper.classList.add('input');
    const newEmailImg = document.createElement('img');
    newEmailImg.src = 'img/background/button-pattern/envelope-open.svg';
    newEmailImg.alt = 'НП';
    const newEmailInput = document.createElement('input');
    newEmailInput.id = 'email-in';
    newEmailInput.type = 'email';
    newEmailInput.maxLength = 250;
    newEmailInput.placeholder = 'Проверим, что почтовые голуби долетят туда, куда надо..';
    newEmailInput.setAttribute('oninput', 'validateGmail(event)');
    newEmailInput.setAttribute('onblur', 'validateCheckGmail(event)');
    newEmailInputWrapper.appendChild(newEmailImg);
    newEmailInputWrapper.appendChild(newEmailInput);
    inputsWrapper.appendChild(newEmailInputWrapper);

    const confirmEmailInputWrapper = document.createElement('div');
    confirmEmailInputWrapper.classList.add('input');
    const confirmEmailImg = document.createElement('img');
    confirmEmailImg.src = 'img/background/button-pattern/envelope-open.svg';
    confirmEmailImg.alt = 'ПНП';
    const confirmEmailInput = document.createElement('input');
    confirmEmailInput.id = 'confirmEmail-in';
    confirmEmailInput.type = 'email';
    confirmEmailInput.maxLength = 250;
    confirmEmailInput.placeholder = 'Давай-ка еще разок, чтобы без ошибок!';
    confirmEmailInput.setAttribute('oninput', 'validateGmail(event)');
    confirmEmailInput.setAttribute('onblur', 'validateCheckGmail(event)');
    confirmEmailInputWrapper.appendChild(confirmEmailImg);
    confirmEmailInputWrapper.appendChild(confirmEmailInput);
    inputsWrapper.appendChild(confirmEmailInputWrapper);

    wrapper.appendChild(inputsWrapper);

    const modalButtons = document.createElement('div');
    modalButtons.classList.add('modal-buttons');

    const changeButton = document.createElement('button');
    changeButton.id = 'changeButton';
    changeButton.classList.add('change');
    changeButton.textContent = 'Изменить';
    changeButton.setAttribute('onclick', 'changeEmail()');
    modalButtons.appendChild(changeButton);

    const cancelButton = document.createElement('button');
    cancelButton.id = 'cancelButton';
    cancelButton.classList.add('cancel');
    cancelButton.textContent = 'Отмена';
    modalButtons.appendChild(cancelButton);

    wrapper.appendChild(modalButtons);
    modalContent.appendChild(wrapper);

    modal.style.display = "flex";
    modal.appendChild(modalContent);
    setTimeout(() => {
        modal.classList.add('loaded');
    }, 10);
    
    document.getElementById("changeButton").onclick = function () {
        if(changeEmail() === true) {
            modal.classList.remove('loaded');
            setTimeout(() => {
                modal.style.display = "none";
            }, 1000);
            modalContent.remove();
        };
    };

    document.getElementById("cancelButton").onclick = function () {
        modal.classList.remove('loaded');
        setTimeout(() => {
            modal.style.display = "none";
        }, 1000);
        modalContent.remove();
    };
}

function openNextStep() { // Переходим к следующему шагу создания ивента
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');

    const title = document.getElementById('title-in').value;
    const description = document.getElementById('description-in').value;
    const imageFile = document.getElementById('event-image').files[0];

    if (!title || !description || !imageFile) {
        createAlert("Все поля обязательны для заполнения.", 'warning');
        return;
    }

    step1.style.display = 'none';
    step2.style.display = 'flex';
}

export function openChangeEvent() { // Открываем модальное окно с изменением события
    const modal = document.getElementById("modals");

    clearModal();
    const modalContent = document.createElement('div');
    modalContent.classList.add('modal-content');

    const backgroundImg = document.createElement('img');
    backgroundImg.id = 'background';
    backgroundImg.src = 'img/Desktop Search.svg';
    modalContent.appendChild(backgroundImg);

    const wrapper = document.createElement('div');
    wrapper.classList.add('wrapper');

    const inputsWrapper = document.createElement('div');
    inputsWrapper.classList.add('inputs');

    const titleInputDiv = document.createElement('div');
    titleInputDiv.className = 'input';
    const titleImg = document.createElement('img');
    titleImg.src = 'img/background/button-pattern/TextH.svg';
    titleImg.alt = 'H';
    const titleInput = document.createElement('input');
    titleInput.id = 'ed-title-in';
    titleInput.type = 'text';
    titleInput.maxLength = '255';
    titleInput.placeholder = 'Заголовок';
    titleInputDiv.appendChild(titleImg);
    titleInputDiv.appendChild(titleInput);

    const descriptionInputDiv = document.createElement('div');
    descriptionInputDiv.className = 'input desc';
    const descriptionImg = document.createElement('img');
    descriptionImg.src = 'img/background/button-pattern/TextIndent.svg';
    descriptionImg.alt = '>|';
    const descriptionInput = document.createElement('textarea');
    descriptionInput.id = 'ed-description-in';
    descriptionInput.placeholder = 'Введите описание мероприятия';
    descriptionInputDiv.appendChild(descriptionImg);
    descriptionInputDiv.appendChild(descriptionInput);

    const imageInputDiv = document.createElement('div');
    imageInputDiv.className = 'input img';
    const imageImg = document.createElement('img');
    imageImg.id = 'preview-ed';
    const imageInput = document.createElement('input');
    imageInput.id = 'ed-event-image';
    imageInput.type = 'file';
    imageInput.accept = 'image/*';
    //imageInput.setAttribute = ('onchange', 'validateAndShowPreview(event, true)');
    imageInput.onchange = (event) => validateAndShowPreview(event, true);
    imageInputDiv.appendChild(imageInput);
    imageInputDiv.appendChild(imageImg);

    const dateWrapper = document.createElement('div');
    dateWrapper.className = 'wrapper';

    const dateInputDiv = document.createElement('div');
    dateInputDiv.className = 'input';
    const dateImg = document.createElement('img');
    dateImg.src = 'img/background/button-pattern/CalendarDots.svg';
    dateImg.alt = 'D';
    const dateInput = document.createElement('input');
    dateInput.id = 'ed-date-in';
    dateInput.type = 'date';
    dateInputDiv.appendChild(dateImg);
    dateInputDiv.appendChild(dateInput);
    
    const timeInputDiv = document.createElement('div');
    timeInputDiv.className = 'input';
    const timeImg = document.createElement('img');
    timeImg.src = 'img/background/button-pattern/ClockC.svg';
    timeImg.alt = 'T';
    const timeInput = document.createElement('input');
    timeInput.id = 'ed-time-in';
    timeInput.type = 'time';
    timeInputDiv.appendChild(timeImg);
    timeInputDiv.appendChild(timeInput);

    dateWrapper.appendChild(dateInputDiv);
    dateWrapper.appendChild(timeInputDiv);

    const locationWrapper = document.createElement('div');
    locationWrapper.className = 'wrapper';

    const cityInputDiv = document.createElement('div');
    cityInputDiv.className = 'input';
    const cityImg = document.createElement('img');
    cityImg.src = 'img/background/button-pattern/map-pin.svg';
    cityImg.alt = 'C';
    const cityInput = document.createElement('input');
    cityInput.id = 'ed-city-in';
    cityInput.type = 'text';
    cityInput.setAttribute('list', 'cities');
    cityInput.maxLength = '100';
    cityInput.placeholder = 'Город';
    cityInput.oninput = (event) => validateCity(event);
    const citiesList = document.createElement('datalist');
    citiesList.id = 'cities';
    cityInputDiv.appendChild(cityImg);
    cityInputDiv.appendChild(cityInput);
    cityInputDiv.appendChild(citiesList);

    const buildingInputDiv = document.createElement('div');
    buildingInputDiv.className = 'input';
    const buildingImg = document.createElement('img');
    buildingImg.src = 'img/background/button-pattern/BuildingsC.svg';
    buildingImg.alt = 'B';
    const buildingInput = document.createElement('input');
    buildingInput.id = 'ed-building-in';
    buildingInput.type = 'text';
    buildingInput.placeholder = 'Здание';
    buildingInputDiv.appendChild(buildingImg);
    buildingInputDiv.appendChild(buildingInput);

    locationWrapper.appendChild(cityInputDiv);
    locationWrapper.appendChild(buildingInputDiv);

    const categoryWrapper = document.createElement('div');
    categoryWrapper.className = 'wrapper';

    const categoryInputDiv = document.createElement('div');
    categoryInputDiv.className = 'input';
    const categoryImg = document.createElement('img');
    categoryImg.src = 'img/background/button-pattern/FunnelC.svg';
    categoryImg.alt = 'C';
    const categoryInput = document.createElement('select');
    categoryInput.id = 'ed-category-in';
    categoryInput.setAttribute('onchange', 'updateSubcategories(true)');
    const categories = [
        { value: 'cinema', text: '🎬 Кино' },
        { value: 'concert', text: '🪗 Концерт' },
        { value: 'theatre', text: '🎭 Театр' },
        { value: 'sport', text: '🏅 Спорт' }
    ];
    
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.value;
        option.textContent = category.text;
        categoryInput.appendChild(option);
    });
    categoryInputDiv.appendChild(categoryImg);
    categoryInputDiv.appendChild(categoryInput);

    const subcategoryInputDiv = document.createElement('div');
    subcategoryInputDiv.className = 'input';
    const subcategoryInput = document.createElement('select');
    subcategoryInput.id = 'ed-subcategory-in';
    const subcategories = [
        { value: "drama", text: "🎭 Драма" },
        { value: "comedy", text: "😂 Комедия" },
        { value: "action", text: "🔥 Боевик" },
        { value: "sci-fi", text: "🚀 Фантастика" },
        { value: "horror", text: "👻 Ужасы" },
        { value: "thriller", text: "😱 Триллер" },
        { value: "romance", text: "💕 Мелодрама" },
        { value: "animation", text: "🎨 Анимация" },
        { value: "documentary", text: "📚 Документальный" },
        { value: "adventure", text: "🧭 Приключения" },
        { value: "fantasy", text: "🧙 Фэнтези" },
        { value: "biography", text: "👤 Биография" },
        { value: "history", text: "🏛️ История" },
        { value: "crime", text: "🕵️ Криминал" }
    ]

    subcategories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.value;
        option.textContent = category.text;
        subcategoryInput.appendChild(option);
    });
    subcategoryInputDiv.appendChild(subcategoryInput);

    categoryWrapper.appendChild(categoryInputDiv);
    categoryWrapper.appendChild(subcategoryInputDiv);

    const activityWrapper = document.createElement('div');
    activityWrapper.className = 'wrapper';

    const ticketInputDiv = document.createElement('div');
    ticketInputDiv.className = 'input';
    const ticketImg = document.createElement('img');
    ticketImg.src = 'img/background/button-pattern/TicketC.svg';
    ticketImg.alt = 'T';
    const ticketInput = document.createElement('input');
    ticketInput.id = 'ed-url-in';
    ticketInput.type = 'text';
    ticketInput.placeholder = '((ссылка))';
    ticketInputDiv.appendChild(ticketImg);
    ticketInputDiv.appendChild(ticketInput);

    const priceInputDiv = document.createElement('div');
    priceInputDiv.className = 'input';
    const priceImg = document.createElement('img');
    priceImg.src = 'img/background/button-pattern/CurrencyRub.svg';
    priceImg.alt = 'P';
    const priceInput = document.createElement('input');
    priceInput.id = 'ed-price-in';
    priceInput.type = 'number';
    priceInput.step = '50';
    priceInput.placeholder = 'Цена';
    priceInputDiv.appendChild(priceImg);
    priceInputDiv.appendChild(priceInput);

    activityWrapper.appendChild(ticketInputDiv);
    activityWrapper.appendChild(priceInputDiv);

    inputsWrapper.appendChild(titleInputDiv);
    inputsWrapper.appendChild(descriptionInputDiv);
    inputsWrapper.appendChild(imageInputDiv);
    inputsWrapper.appendChild(dateWrapper);
    inputsWrapper.appendChild(locationWrapper);
    inputsWrapper.appendChild(categoryWrapper);
    inputsWrapper.appendChild(activityWrapper);
    wrapper.appendChild(inputsWrapper);

    const modalButtons = document.createElement('div');
    modalButtons.classList.add('modal-buttons');

    const changeButton = document.createElement('button');
    changeButton.id = 'changeButton';
    changeButton.classList.add('save');
    changeButton.textContent = 'Изменить';
    // changeButton.setAttribute('onclick', 'saveEvent()');
    modalButtons.appendChild(changeButton);

    const cancelButton = document.createElement('button');
    cancelButton.id = 'cancelButton';
    cancelButton.classList.add('cancel');
    cancelButton.textContent = 'Отмена';
    modalButtons.appendChild(cancelButton);

    wrapper.appendChild(modalButtons);
    modalContent.appendChild(wrapper);

    modal.style.display = "flex";
    modal.appendChild(modalContent);
    setTimeout(() => {
        modal.classList.add('loaded');
        modal.classList.add('editEvent');
    }, 10);
    
    document.getElementById("changeButton").onclick = function () {
        modal.classList.remove('loaded');
        modal.classList.remove('editEvent');
        setTimeout(() => {
            modal.style.display = "none";
        }, 1000);
        modalContent.remove();
    };

    document.getElementById("cancelButton").onclick = function () {
        modal.classList.remove('loaded');
        modal.classList.remove('editEvent');
        setTimeout(() => {
            modal.style.display = "none";
        }, 1000);
        modalContent.remove();
    };
}

export function closeModal(modal) { // Закрываем модальное окно
    modal.classList.remove('loaded');
    modal.classList.remove('editEvent');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 1000);
}


window.onclick = function (event) { // Закрываем окно если клик вне модального окна или нажат escape
    const modal = document.getElementById("modals");
    if (event.target === modal) {
        modal.classList.remove('loaded');
        modal.classList.remove('editEvent');
        setTimeout(() => {
            modal.style.display = "none";
        }, 1000);
        const modalContent = document.querySelector('.modal-content');
        modalContent.remove();
    }

    window.onkeydown = function (event) {
        const modal = document.getElementById("modals");
        if (event.key === "Escape" && modal.style.display === "flex") {
            modal.classList.remove('loaded');
            modal.classList.remove('editEvent');
            setTimeout(() => {
                modal.style.display = "none";
            }, 1000);
            const modalContent = document.querySelector('.modal-content');
            modalContent.remove();
        }
    };
};

window.openOption = openOption;
window.openNextStep = openNextStep;
window.openCreateEvent = openCreateEvent;
window.copyToClipboard = copyToClipboard;
window.savePersonal = savePersonal;
window.confirmDelete = confirmDelete;
window.openChangePassword = openChangePassword;
window.changePassword = changePassword;
window.openChangePhone = openChangePhone;
window.changePhone = changePhone;
window.openChangeEmail = openChangeEmail;
window.changeEmail = changeEmail;
window.openChangeEvent = openChangeEvent;
