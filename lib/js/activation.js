import { createAlert } from "./alert.js"; // Импорт функции для создания оповещений
import { checkLoginExists } from "./verify.js"; // Импорт функции для проверки логина

document.addEventListener("DOMContentLoaded", () => { // Выполняем действия после загрузки DOM
    document.body.classList.add("loaded"); // Добавляем класс для анимации загрузки
    setTimeout(() => { // Прокручиваем страницу вверх после небольшой задержки
      window.scrollTo(0, 0);
    }, 100);

    // Если текущая страница не `site.html` или `post.html`, выполняем дополнительные настройки
    if (!window.location.pathname.endsWith("site.html") && !window.location.pathname.endsWith("post.html")) {
      setMaxBirthdayDate(); // Устанавливаем максимальную дату рождения
      loadCities(); // Загружаем список городов
    }
});

function scrollToElement(targetSelector) { // Функция плавной прокрутки к заданному элементу
  const targetDiv = document.querySelector(targetSelector);
  if (targetDiv) {
    targetDiv.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

async function nextStep() { // Функция обработки перехода на следующий шаг регистрации
  const login = document.getElementById('login-in').value;
  const password = document.getElementById('password-in').value;
  const confirmPassword = document.getElementById('confirmPassword-in').value;

  // Проверяем, существует ли логин
  const loginExists = await checkLoginExists(login);
  if (loginExists) {
      createAlert('Этот логин уже занят! Пожалуйста, выберите другой.', 'error');
      return;
  }
  
  // Проверяем, заполнены ли все поля
  if (!login || !password || !confirmPassword) {
    createAlert('Пожалуйста, заполните все поля!', 'warning');
    return;
  } 
  
  // Проверяем совпадение паролей
  if (password !== confirmPassword) {
    createAlert('Упс! Кажется, пароли не совпадают.', 'warning');
    return;
  }

  // Проверяем минимальную длину логина и пароля
  if (login.length < 3 || password.length < 8) {
    createAlert('Некоторые поля заполнены некорректно. Проверьте их длину и повторите попытку.', 'error');
    return;
  }

  // Анимация перехода на следующий шаг
  const step1 = document.querySelector('.registration .step1');
  const step2 = document.querySelector('.registration .step2');

  step1.style.transform = "translateX(-100%)";
  step1.style.opacity = 0;

  setTimeout(() => {
      step1.style.display = 'none';
  }, 450);

  step2.style.display = 'flex';
  setTimeout(() => {
      step2.classList.add('visible');
  }, 50);
  setTimeout(() => {
      scrollToElement(".step2");
  }, 510);
}

function setMaxBirthdayDate() { // Устанавливаем максимальную допустимую дату рождения (пользователь должен быть старше 14 лет)
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');

  const maxYear = yyyy - 14;
  const maxDate = `${maxYear}-${mm}-${dd}`;

  const dateInput = document.getElementById("dob-in");
  if (dateInput) {
      dateInput.setAttribute("max", maxDate);
  }
}

export function minDate() { // Устанавливаем минимальную допустимую дату
  const today = new Date();
      
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  
  const minDate = `${year}-${month}-${day}`;
  document.getElementById('e-date-in').setAttribute('min', minDate);
}


function loadCities() { // Загружаем список городов из JSON файла
  fetch('lib/cities.json')
      .then(response => {
          if (!response.ok) {
              throw new Error('Сетевая ошибка');
          }
          return response.json();
      })
      .then(cities => {
          const datalist = document.getElementById('cities');
          cities.forEach(city => {
              const option = document.createElement('option');
              option.value = city;
              datalist.appendChild(option);
          });
      })
      .catch(error => {
          console.error('Ошибка загрузки данных:', error);
      });
}

function blockCyrillic(event) { // Блокируем ввод кириллицы в текстовые поля
  const input = event.target;
  const cyrillicPattern = /[А-Яа-яЁё]/;

  if (cyrillicPattern.test(input.value)) {
      input.value = input.value.replace(cyrillicPattern, '');
      createAlert('Вы используете недопустимые символы!', 'warning');
  }
}

function validateCheckPassword(event) { // Проверка длины пароля
  const input = event.target;

  if (input.value.length < 8) {
    createAlert('Пароль слишком короткий!', 'error');
    return;
  }
}

function validateLogin(event) { // Проверка допустимых символов в логине
  const input = event.target;
  const allowedPattern = /^[A-Za-z0-9 !"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]*$/;

  if (!allowedPattern.test(input.value)) {
      input.value = input.value.replace(/[^A-Za-z0-9 !"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/g, '');
      createAlert('Вы используете недопустимые символы!', 'warning');
  }
}

function validateCheckLogin(event) { // Проверка длины логина
  const input = event.target;

  if (input.value.length < 3) {
    createAlert('Логин слишком короткий!', 'error');
    return;
  }
}

function validateGmail(event) { // Проверка формата email адреса
  const input = event.target;
  const forbiddenPattern = /[ \t!#$%&'()*+,/:;<=>?[\]~]/;

  blockCyrillic(event);

  if (forbiddenPattern.test(input.value)) {
      input.value = input.value.replace(forbiddenPattern, '');
      createAlert('Вы используете недопустимые символы!', 'warning');
  }

  input.value = input.value.toLowerCase();

  const cleanedValue = input.value
      .replace(/\.{2,}/g, '.') 
      .replace(/^\./, '')
  input.value = cleanedValue;
}

function validateCheckGmail(event) { // Проверка корректности email адреса
  const input = event.target;

  if (input.value.length < 5) {
    createAlert('Адрес электронной почты слишком короткий!', 'error');
    return;
  }

  const emailPattern = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;

  if (!emailPattern.test(input.value)) {
    createAlert('Некорректный адрес электронной почты!', 'error');
  } 
}

function validateName(event) { // Проверка и форматирование имени
  const input = event.target;
  const allowedPattern = /^[A-Za-zА-Яа-яЁё\- ]*$/;

  if (!allowedPattern.test(input.value)) {
      input.value = input.value.replace(/[^A-Za-zА-Яа-яЁё\- ]/g, '');
      createAlert('Вы используете недопустимые символы!', 'warning');
  }

  input.value = input.value.replace(/\s{2,}/g, ' ');
  input.value = input.value.replace(/-{2,}/g, '-');
  input.value = input.value.replace(/(\s+-|-\s+)/g, '-');

  const words = input.value.split(/[\s]+/);
  if (words.length > 0) {
      words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
  }
  
  input.value = words.join(' ').replace(/ +/g, ' ');
}

function validateCity(event) { // Проверка и форматирование названия города
  const input = event.target;
  const allowedPattern = /^[А-Яа-яЁё\s\-]*$/;

  if (!allowedPattern.test(input.value)) {
      input.value = input.value.replace(/[^А-Яа-яЁё\s\-]/g, '');
      createAlert('Вы используете недопустимые символы!', 'warning');
  }

  input.value = input.value.replace(/\s{2,}/g, ' ');
  input.value = input.value.replace(/-{2,}/g, '-');
  input.value = input.value.replace(/(\s+-|-\s+)/g, '-');

  const words = input.value.split(/[\s]+/);
  if (words.length > 0) {
      words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
  }
  
  input.value = words.join(' ').replace(/ +/g, ' ');
}

function validatePhoneNumber(event) { // Проверка и форматирование номера телефона
  const input = event.target;
  let value = input.value.replace(/\D/g, '');

  if (value.length === 0) {
      input.value = '+';
      return;
  }

  if (value[0] === '7') {
      if (value.length <= 11) {
          value = value.replace(/^(\d{1})(\d{3})(\d{3})(\d{2})(\d{2})$/, '+7($2)-$3-$4-$5');
      } else { value = '+' + value; }
  } else if (value.startsWith('373') && value.length <= 11) {
    value = value.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})/, '+373-$2-$3-$4');
  } else if (value.startsWith('40')) {
      if (value.length <= 12) {
        value = value.replace(/^(\d{2})(\d{3})(\d{3})(\d{3})$/, '+40-$2-$3-$4');
      } else { value = '+' + value; }
  } else {
    value = '+' + value;
  }
  
  input.value = value;
}

function onlyNumber(event) { // Разрешаем ввод только цифр и символа '+'
  const input = event.target;
  const validPattern = /[^0-9+]/g;

  if (validPattern.test(input.value)) {
      input.value = input.value.replace(validPattern, '');
      createAlert('Вы используете недопустимые символы!', 'warning');
  }
}

window.scrollToElement = scrollToElement;
window.nextStep = nextStep;

window.blockCyrillic = blockCyrillic;
window.validateCheckPassword = validateCheckPassword;
window.validateLogin = validateLogin;
window.validateCheckLogin = validateCheckLogin;
window.validateGmail = validateGmail;
window.validateCheckGmail = validateCheckGmail;
window.validateName = validateName;
window.validateCity = validateCity;
window.validatePhoneNumber = validatePhoneNumber;
window.onlyNumber = onlyNumber;



// let isDragging = false;
// let isClicking = false;
// let startY = 0;
// let startScroll = 0;
// let lastY = 0;
// let velocity = 0;
// let isScrolling = false;

// document.addEventListener("mousedown", (event) => {
//   if (event.target.closest("#map")) {
//     return;
//   }

//   if (event.target.closest('button, a, input, textarea, select, [contenteditable="true"]')) {
//       isClicking = true;
//       return;
//   }

//   isDragging = true;
//   startY = event.clientY;
//   startScroll = window.scrollY;
//   lastY = startY;
//   velocity = 0;
// });

// document.addEventListener("mousemove", (event) => {
//   if (!isDragging) return;

//   const deltaY = event.clientY - lastY;
//   velocity = deltaY;
//   lastY = event.clientY;
//   window.scrollTo(0, window.scrollY - deltaY);
// });

// document.addEventListener("mouseup", () => {
//   if (isClicking) {
//       isClicking = false;
//       return;
//   }

//   if (isDragging) {
//       isDragging = false;

//       if (Math.abs(velocity) > 1 && !isScrolling) {
//           isScrolling = true;
//           startInertiaScroll(velocity);
//       }
//   }
// });

// function startInertiaScroll(initialVelocity) {
//   const friction = 0.98;
//   let currentVelocity = initialVelocity;

//   function step() {
//       if (Math.abs(currentVelocity) < 0.5) {
//           isScrolling = false;
//           return;
//       }

//       window.scrollBy(0, -currentVelocity);
//       currentVelocity *= friction;
//       requestAnimationFrame(step);
//   }

//   step();
// }