import { loadEvent } from "./event.js"; // Импорт функции для загрузки событий

async function loadUserInfo() { // Асинхронная функция для загрузки информации о пользователе
    try { // Отправляем запрос для получения данных пользователя
        const response = await fetch('http://127.0.0.1:3000/api/get/user', {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) { // Проверяем успешность ответа
            throw new Error('Ошибка получения данных пользователя');
        }

        const data = await response.json(); // Парсим ответ
        if (!data.success) {
            throw new Error(data.message || 'Ошибка');
        }

        const { userId, email, name, surname, gender, city, phone, dob, is_organizer, is_admin } = data; // Деструктурируем необходимые данные из ответа

        // Обновляем информацию о пользователе в элементах страницы
        const userElements = document.querySelectorAll('[data-user="true"]');
        userElements.forEach(element => {
            element.innerHTML = `${name} ${surname}`; // Имя и фамилия пользователя
        });

        const userInitials = document.querySelectorAll('[data-initials="true"]');
        const initials = `${name.charAt(0)}${surname.charAt(0)}`; // Инициалы пользователя
        userInitials.forEach(element => {
            element.textContent = initials.toUpperCase(); // Преобразуем инициалы в верхний регистр
        });
        
        // Отображение email пользователя
        const userEmail = document.querySelectorAll('[data-email="true"]');
        userEmail.forEach(element => {
            element.innerHTML = `${email}`;
        });

        // Отображение города пользователя
        const userCity = document.querySelectorAll('[data-city="true"]');
        userCity.forEach(element => {
            element.innerHTML = `${city}`;
        });

        // Дополнительный текст с городом
        const eventCity = document.querySelectorAll('[data-city-event="true"]');
        eventCity.forEach(element => {
            element.innerHTML= `Живи в ритме: ${city}`;
        })
        
        // Запрашиваем статистику пользователя
        const counts = await fetch('http://127.0.0.1:3000/api/user/get/statistic', {
            method: 'GET',
            credentials: 'include'
        });
        const resultCounts = await counts.json();

        // Отображаем количество избранных событий
        const statisticFavorite = document.getElementById('statisticFavorite');
        statisticFavorite.textContent = `(${resultCounts.favoriteCount})`;
        const favStatDiv = document.querySelector('#favorites.statistic');
        favStatDiv.title = `📂📌\nВы сохранили:\n${resultCounts.favoriteCount} ивент(а/ов)`

        // Отображаем количество понравившихся событий
        const statisticLike = document.getElementById('statisticLike');
        statisticLike.textContent = `${resultCounts.likeCount}`;
        const likeStatDiv = document.querySelector('#likes.statistic');
        likeStatDiv.title = `❤️‍🔥😍\nВы оценили:\n${resultCounts.likeCount} ивент(а/ов)`

        // Отображаем количество созданных событий для организаторов и администраторов
        if (is_admin || is_organizer) {
            const createStatDiv = document.querySelector(`#posts.statistic`);
            createStatDiv.style.display = 'flex';
            createStatDiv.title = `📰👏\nВы создали:\n${resultCounts.eventCount} ивент(а/ов)`
            const statisticCreate = document.getElementById('statisticCreate');
            statisticCreate.textContent = `${resultCounts.eventCount}`;
        }

    } catch (error) {
        console.error('Ошибка:', error.message); // Логируем ошибки
    }
}

window.loadUserInfo = loadUserInfo;


document.addEventListener('DOMContentLoaded', () => { // Выполняем действия после загрузки страницы
    // Проверяем авторизацию пользователя
    fetch('http://127.0.0.1:3000/api/check-auth', {
    method: 'GET',
    credentials: 'include'
    })
    .then(response => {
        if (!response.ok) { // Перенаправляем на страницу верификации, если пользователь не авторизован
            window.location.href = 'verify.html';
        } else if (window.location.pathname.endsWith("site.html")) {
            loadEvent(); // Загружаем события

            // Список страниц для случайного выбора
            const pages = [
                'cinema',
                'concert',
                'theatre',
                'sport'
            ];

            // Открываем случайную страницу
            const randomIndex = Math.floor(Math.random() * pages.length);
            openPage(pages[randomIndex]);
        }
        // Если текущая страница `site.html` или `post.html`, выполняем дополнительные настройки
        if ((window.location.pathname.endsWith("site.html") || window.location.pathname.endsWith("post.html"))) {
            loadUserInfo(); // Загружаем информацию о пользователе
            
            // Логика для отображения/скрытия блока с информацией о пользователе
            const userWrapp = document.querySelector('.user-wrapp');
            const userInfo = document.querySelector('.user-info');
            const buttonBlock = document.querySelector('.button-block');
            const userBlock = document.querySelector('.user-block');
            const user = document.querySelector('.user');

            // Функция для скрытия элементов
            function hideElements() {
                userInfo.classList.remove('active');
                buttonBlock.classList.remove('active');
                userBlock.classList.remove('active');
                setTimeout(() => {
                    userInfo.style.display = 'none';
                    buttonBlock.style.display = 'none';
                }, 500);
            }

            // Переключение отображения при клике на user или его элементы
            userWrapp.addEventListener('click', (event) => {
                if (userBlock.contains(event.target) && userInfo.classList.contains('active') && buttonBlock.classList.contains('active')) {
                    hideElements();
                    return;
                }

                if (user.contains(event.target)) {
                    const isActive = userInfo.classList.contains('active') && buttonBlock.classList.contains('active');
                    if (isActive) {
                        hideElements();
                    } else {
                        userBlock.classList.add('active');
                        userInfo.style.display = 'flex';
                        buttonBlock.style.display = 'flex';
                        setTimeout(() => {
                            userInfo.classList.add('active');
                            buttonBlock.classList.add('active');
                        }, 100);
                        
                    }
                }
            });

            // Закрытие при клике вне блока пользователя
            document.addEventListener('click', (event) => {
                if (!userWrapp.contains(event.target)) {
                    if (userInfo.classList.contains('active') || buttonBlock.classList.contains('active')) {
                        hideElements();
                    }
                }
            });

            
        }
    })
    .catch(error => console.error('Ошибка:', error));
});

function openPage(page) { // Функция для открытия нужной страницы
    const pages = [
        document.querySelector('.cinema'),
        document.querySelector('.concert'),
        document.querySelector('.theatre'),
        document.querySelector('.sport')
    ];

    pages.forEach(p => p.classList.remove('active'));
    setTimeout(() => {
        pages.forEach(p => p.style.display = 'none');
    }, 200);

    // Устанавливаем нужному элементу класс 'active' в зависимости от переданного аргумента
    switch (page) {
        case 'cinema':
            setTimeout(() => {
                pages[0].style.display = 'flex';
                setTimeout(() => {
                    pages[0].classList.add('active');
                }, 500);
            }, 201);
            break;
        case 'concert':
            setTimeout(() => {
                pages[1].style.display = 'flex';
                setTimeout(() => {
                    pages[1].classList.add('active');
                }, 500);
            }, 201);
            break;
        case 'theatre':
            setTimeout(() => {
                pages[2].style.display = 'flex';
                setTimeout(() => {
                    pages[2].classList.add('active');
                }, 500);
            }, 201);
            break;
        case 'sport':
            setTimeout(() => {
                pages[3].style.display = 'flex';
                setTimeout(() => {
                    pages[3].classList.add('active');
                }, 500);
            }, 201);
            break;    
        default:
            setTimeout(() => {
                pages[0].style.display = 'flex';
                setTimeout(() => {
                    pages[0].classList.add('active');
                }, 500);
            }, 201);
            break;
    }
}

function searchEventsByTitle(searchQuery) { // Функция поиска событий по названию
    const allEvents = document.querySelectorAll('.event');
    
    allEvents.forEach(event => {
        const titleElement = event.querySelector('.event-title');
        const titleText = titleElement ? titleElement.textContent.toLowerCase() : '';

        if (titleText.includes(searchQuery.toLowerCase())) {
            event.style.display = '';
        } else {
            event.style.display = 'none';
        }
    });
}

if (window.location.pathname.endsWith("site.html")) { // Добавляем обработчик поиска событий, если находимся на странице site.html
    document.getElementById('search-input').addEventListener('input', (e) => {
        const searchQuery = e.target.value.trim();
        searchEventsByTitle(searchQuery);
    });
}

window.openPage = openPage;