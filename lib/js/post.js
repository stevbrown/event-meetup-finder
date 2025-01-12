import { createAlert } from './alert.js'; // Импорт функции для создания оповещений
import { loadEventsByCategory } from './event.js'; // Импорт функции для загрузки ивентов по категории

function getQueryParam(param) { // Функция для получения параметра из URL
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

function getCategoryTitle(category) { // Функция для получения названия категории
    const categoryTranslations = {
        cinema: "Кино",
        concert: "Концерт",
        theatre: "Театр",
        sport: "Спорт"
    };

    return categoryTranslations[category] || "Неизвестно";
}

function getSubcategoryTitle(category, subcategory) { // Функция для получения названия подкатегории
    if (categories[category]) {
        const foundSubcategory = categories[category].find(item => item.value === subcategory);
        
        if (category === "concert" && subcategory === "nosubcategory") {
            return "🎵 Концерт";
        }

        if (foundSubcategory) {
            return foundSubcategory.text;
        }
    }

    return 'Неизвестно';
}

async function getUserPersonal(userId) { // Асинхронная функция для получения личных данных пользователя
    try {
        const response = await fetch('http://127.0.0.1:3000/api/user/get/personal', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId }),
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }

        const result = await response.json();
        if (!result.success) {
            throw new Error(result.message || 'Неизвестная ошибка');
        }

        return result.data;
    } catch (error) {
        console.error('Ошибка при запросе:', error);
        return null;
    }
}

let postId; // Переменная для хранения ID поста

document.addEventListener('DOMContentLoaded', () => { // Выполняем действия после загрузки DOM
    fetch('http://127.0.0.1:3000/api/check-auth', {
    method: 'GET',
    credentials: 'include'
    })
    .then(response => {
        if (!response.ok) {
            window.location.href = 'verify.html';
        } else {
            postId = getQueryParam('id');
            loadPost(postId);
        }
    })
    .catch(error => console.error('Ошибка:', error));
});

async function addComment() { // Функция для добавления комментария
    try {
        const commentInput = document.getElementById('comment-in');
        const commentText = commentInput.value.trim();

        if (commentText.length < 3) {
            createAlert('Комментарий должен содержать не менее 3 символов.', 'error');
            return;
        }

        const response = await fetch(`http://127.0.0.1:3000/api/event/comments/add/${postId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                comment: commentText,
            }),
            credentials: 'include'
        });

        const data = await response.json();

        if (data.success) {
            commentInput.value = '';
            createAlert('Комменатрий успешно добавлен!', 'success');

            const responseCom = await fetch(`http://127.0.0.1:3000/api/event/comments/get/${postId}`);

            if (!responseCom.ok) {
                throw new Error(`Ошибка HTTP: ${responseCom.status}`);
            }

            const dataCom = await responseCom.json();
            const comment = dataCom.comments;

            if (comment) {
                createComment(comment);
            }

        } else {
            console.error('Ошибка при добавлении комментария:', data.message);
            createAlert('Не удалось добавить комментарий.', 'error');
        }
    } catch (error) {
        console.error('Ошибка сети или сервера:', error);
        createAlert('Ошибка сети. Попробуйте ещё раз.', 'error');
    }
}

function createComment(comments) { // Функция для создания комментария на странице
    const commentsUsers = document.querySelector('.post .users-comments');
    commentsUsers.innerHTML = '';
    comments.forEach(comment => {
        const commentContainer = document.createElement('div');
        commentContainer.id = `${comment.id}`;
        commentContainer.classList.add('comment');
        
        const userAvatar = document.createElement('div');
        userAvatar.classList.add('user-avatar');

        const userInitials = document.createElement('p');
        const initials = `${comment.name.charAt(0)}${comment.surname.charAt(0)}`;
        userInitials.id = 'user-initials';
        userInitials.textContent = initials;

        userAvatar.appendChild(userInitials);

        const commentContent = document.createElement('div');
        commentContent.classList.add('comment-content');

        const userNameElem = document.createElement('p');
        userNameElem.id = 'user-names';
        userNameElem.textContent = `${comment.name} ${comment.surname}`;

        const commentTextElem = document.createElement('p');
        commentTextElem.id = 'comment-text';
        commentTextElem.textContent = comment.comment;

        const commentDateElem = document.createElement('p');
        commentDateElem.id = 'comment-date';

        const date = new Date(comment.created_at);

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');

        const formattedDateCome = `${day}.${month}.${year} в ${hours}:${minutes}`;

        commentDateElem.textContent = formattedDateCome;

        commentContent.appendChild(userNameElem);
        commentContent.appendChild(commentTextElem);
        commentContent.appendChild(commentDateElem);

        commentContainer.appendChild(userAvatar);
        commentContainer.appendChild(commentContent);

        commentsUsers.appendChild(commentContainer);
    });
}

async function loadPost(eventId) { // Функция для загрузки поста по ID
    try {
        const response = await fetch(`http://127.0.0.1:3000/api/event/get/${eventId}`);

        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }

        const data = await response.json();
        const event = data.event;

        document.title = `• ${event.title} — ${getSubcategoryTitle(event.category, event.subcategory)}` || 'Неизвестный';
        
        const cat = document.getElementById('category');
        const titl = document.getElementById('title');
        const cit = document.getElementById('city');
        const pr = document.getElementById('price');
        const img = document.getElementById('imgE');
        const dt = document.getElementById('date');
        const desc = document.getElementById('description');
        const crBy = document.getElementById('created_by');
        const crAt = document.getElementById('created_at');
        const btnBuy = document.getElementById('buy-ticket');
        const adrs = document.getElementById('address');

        cat.textContent = `${getCategoryTitle(event.category)} • ${getSubcategoryTitle(event.category, event.subcategory)}`
        titl.textContent = `${event.title}`;
        cit.textContent = `г. ${event.city} • ${event.building}`;
        pr.textContent = `Цена от ${event.price} ₽`;
        img.src = `${event.image}`;

        const date = new Date(event.date);
        const eventTime = (event.time || '00:00').slice(0, 5);

        const formatter = new Intl.DateTimeFormat('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        const formattedDate = formatter.format(date);

        dt.textContent = `${formattedDate} в ${eventTime}`;
        desc.textContent = `${event.description}`;
        const user = await getUserPersonal(event.created_by);
        if (user != null) { 
            crBy.textContent =  `©Автор: ${user.name} ${user.surname}`;
        } else {
            crBy.textContent =  `©Неизвестный автор (ID${event.created_by})`;
        }
        const crDate = new Date(event.created_at);

        const crFormattedDate = formatter.format(crDate);

        crAt.textContent = `${crFormattedDate}` || '?? ?? ????';

        const isValidUrl = (url) => {
            try {
                new URL(url);
                return true;
            } catch (e) {
                return false;
            }
        };

        btnBuy.addEventListener('click', () => {
            if (event.url && isValidUrl(event.url)) {
                // Открываем страницу с ссылкой
                window.location.href = event.url;
            } else {
                createAlert('Ссылка отсутствует, либо не является допустимой.', 'error');
            }
        });

        loadEventsByCategory(event.category, event.id);

        const responseCom = await fetch(`http://127.0.0.1:3000/api/event/comments/get/${eventId}`);

        if (!responseCom.ok) {
            throw new Error(`Ошибка HTTP: ${responseCom.status}`);
        }

        const dataCom = await responseCom.json();
        const comment = dataCom.comments;

        if (comment) {
            createComment(comment);
        }
        

        ymaps.ready(init);
        function init() {
            const map = new ymaps.Map("map", {
                center: [55.751244, 37.618423],
                zoom: 10
            });

            const buildingName = `${event.city} ${event.building}`;

            const searchControl = new ymaps.control.SearchControl({
                options: {
                    provider: 'yandex#search',
                    resultsPerPage: 1
                }
            });

            searchControl.search(buildingName).then(() => {
                const searchResults = searchControl.getResultsArray();

                if (searchResults.length > 0) {
                    const firstResult = searchResults[0];
                    const coords = firstResult.geometry.getCoordinates();
                    const foundName = firstResult.properties.get("name");
                    const foundAddress = firstResult.properties.get("address");

                    const placemark = new ymaps.Placemark(coords, {
                        balloonContent: `${foundName}<br>${foundAddress}`
                    });

                    adrs.innerHTML = `<b>${event.building}</b>,<br>${foundAddress}`;

                    map.geoObjects.add(placemark);
                    map.setCenter(coords, 15);
                } else {
                    alert("Объект не найден");
                }
            });
        }  
    } catch (error) {
        console.error('Ошибка при запросе:', error);
    }
}

// Добавляем обработчик ввода текста в комментарии
const commentInput = document.getElementById('comment-in');
const sendButton = document.getElementById('comment-send');

commentInput.addEventListener('input', () => { // Обработчик изменения текста в поле ввода
    if (commentInput.value.trim().length >= 3) {
        sendButton.classList.add('active');
    } else {
        sendButton.classList.remove('active');
    }
});

sendButton.addEventListener('click', () => { // Обработчик клика на кнопку отправки комментария
    if (sendButton.classList.contains('active')) {
        addComment();
    } else {
        createAlert('Комментарий должен содержать не менее 3 символов.', 'error');
    }
});

const categories = { // Категории и подкатегории событий
    cinema: [
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
    ],
    concert: [
        { value:"nosubcategory", text: "➖ Нет подкатегории" }
    ],
    theatre: [
        { value: "drama", text: "🎭 Драма" },
        { value: "comedy", text: "😂 Комедия" },
        { value: "musical", text: "🎵 Мюзикл" },
        { value: "tragedy", text: "😢 Трагедия" }
    ],
    sport: [
        { value: "hockey", text: "🏒 Хоккей" },
        { value: "martial-arts", text: "🤼‍♂️ Единоборства" },
    ]
};