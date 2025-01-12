import { createAlert } from "./alert.js"; // Импорт функции для создания оповещений
import { openChangeEvent, closeModal } from "./settings.js" // Импорт функций для открытия, закрытия модального окна

async function submitEvent() { // Асинхронная функция для отправки данных о мероприятии
    const title = document.getElementById('title-in').value.trim();
    const description = document.getElementById('description-in').value;
    const category = document.getElementById('category-in').value;
    const subcategory = document.getElementById('subcategory-in').value;
    const date = document.getElementById('e-date-in').value.trim();
    const time = document.getElementById('time-in').value.trim();
    const city = document.getElementById('e-city-in').value.trim();
    const building = document.getElementById('building-in').value;
    const url = document.getElementById('url-in').value.trim();
    const price = document.getElementById('event-price').value.trim();
    const imageFile = document.getElementById('event-image').files[0];

    if (!title || !description || !date || !time || !city || !url || !price || !imageFile || !category || !subcategory || !building) {
        createAlert("Все поля обязательны для заполнения.", 'warning');
        return;
    }

    const formData = new FormData();
    formData.append('title', document.getElementById('title-in').value);
    formData.append('description', document.getElementById('description-in').value);
    formData.append('category', document.getElementById('category-in').value);
    formData.append('subcategory', document.getElementById('subcategory-in').value);
    formData.append('date', document.getElementById('e-date-in').value);
    formData.append('time', document.getElementById('time-in').value);
    formData.append('city', document.getElementById('e-city-in').value);
    formData.append('building', document.getElementById('building-in').value);
    formData.append('url', document.getElementById('url-in').value);
    formData.append('price', document.getElementById('event-price').value);

    if (imageFile) {
        formData.append('image', imageFile);
    }

    try {
        const response = await fetch('http://127.0.0.1:3000/api/event/create', {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });
        const result = await response.json();
        if (result.success) {
            createAlert("Мероприятие было успешно создано! После проверки оно будет доступно всем.", 'success');
        } else {
            createAlert("Ошибка при добавлении мероприятия: " + result.message, 'error');
        }
    } catch (error) {
        console.error("Ошибка:", error);
        createAlert("Ошибка при подключении к серверу.", 'error');
    }
}

async function getUserId() { // Асинхронная функция для получения ID текущего пользователя
    const response = await fetch('http://127.0.0.1:3000/api/user/get/id', {
        method: 'POST',
        credentials: 'include', 
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
    }

    const data = await response.json();

    return data.userId;
}

async function changeStatus(eventId, status, changedSys = false, adminPanel = false) { // Асинхронная функция для изменения статуса события
    try {
        const body = {
            eventId: eventId,
            status: status
        };

        body.changedBy = changedSys ? 'Системное обновление(ID0)' : null;

        const response = await fetch(`http://127.0.0.1:3000/api/event/status/update`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const result = await response.json();

        if (result.success) {
            if(!changedSys) createAlert(result.message, 'success');

            const userId = await getUserId();

            if (window.location.pathname.endsWith("settings.html")) {
                if (!adminPanel) {
                    await loadEventInfo(userId);
                } else {
                    console.log('обновление');
                    await loadAllEvent();
                    await loadEventInfo(userId);
                }
            }
        } else {
            createAlert(result.message, 'error');
        }
    } catch (error) {
        console.error("Ошибка:", error);
        createAlert("Ошибка при подключении к серверу.", 'error');
    }
}

async function updateLikeCount(postId) { // Функция для обновления количества лайков поста
    try {
        const response = await fetch(`http://127.0.0.1:3000/api/event/like/check/${postId}`, {
            credentials: 'include',
        });

        const result = await response.json();

        if (result.success) {
            const likeCountElement = document.getElementById(`likesCount-${postId}`);
            const likeCountElement2 = document.getElementById(`a-likesCount-${postId}`);

            const likeCountResponse = await fetch(`http://127.0.0.1:3000/api/event/like/get/${postId}`);
            const likeCountResult = await likeCountResponse.json();

            if (likeCountResult.success) {
                if (likeCountElement) {
                    likeCountElement.textContent = likeCountResult.likeCount;
                }
                if (likeCountElement2) {
                    likeCountElement2.textContent = likeCountResult.likeCount;
                }
            }
        }
    } catch (error) {
        console.error('Ошибка при обновлении состояния лайка:', error);
    }
}

async function createEvent (status, data, adminPanel = false) { // Функция для создания и отображения события на странице
    switch (status) {
        case 'public':
            const eventDiv = document.createElement('div');
            eventDiv.className = 'event';
            const img = document.createElement('img');
            img.id = 'imgEvent-id';
            img.src = data.image;
            eventDiv.appendChild(img);

            eventDiv.addEventListener('click', (event) => {
                if (!actionsDiv.contains(event.target)) {
                    window.location.href = `post.html?id=${data.id}`;
                }
            });
            
            const titleDiv = document.createElement('div');
            titleDiv.className = 'title';

            const titleP = document.createElement('p');
            titleP.id = 'title';
            titleP.textContent = data.title || 'Неизвестно';

            const subtitleP = document.createElement('p');
            subtitleP.id = 'subtitle';
            const eventDateObj = new Date(data.date); 
            const eventTime = (data.time || '00:00').slice(0, 5); 

            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000); 

            if (eventDateObj >= today && eventDateObj < tomorrow) {
                subtitleP.textContent = `Сегодня в ${eventTime}`;
            } else if (eventDateObj >= tomorrow && eventDateObj < new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000)) {
                subtitleP.textContent = `Завтра в ${eventTime}`;
            } else {
                subtitleP.textContent = eventDateObj.toLocaleDateString('ru-RU') + ' в ' + eventTime;
            }

            titleDiv.appendChild(titleP);
            titleDiv.appendChild(subtitleP);
            eventDiv.appendChild(titleDiv);

            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'event-actions';

            function createButton(id, title, className, imgSrc) {
                const button = document.createElement('button');
                button.id = id;
                button.title = title;
                button.className = className;

                const img = document.createElement('img');
                img.src = imgSrc;
                img.alt = '';

                button.appendChild(img);
            
                return button;
            }

            const endButton = createButton('btn-end', 'Завершить', 'action', 'img/background/button-pattern/calendar-check.svg');
            const editButton = createButton('btn-edit', 'Редактировать', 'action', 'img/background/button-pattern/calendar-plus.svg');
            const deleteButton = createButton('btn-delete', 'Удалить', 'action', 'img/background/button-pattern/calendar-minus.svg');

            actionsDiv.appendChild(endButton);
            actionsDiv.appendChild(editButton);
            actionsDiv.appendChild(deleteButton);

            eventDiv.appendChild(actionsDiv);

            if (!adminPanel) { 
                document.querySelector('#public.events').appendChild(eventDiv);
            } else { 
                document.querySelector('#a-public.events').appendChild(eventDiv); 
            }
            
            endButton.addEventListener('click', () => {
                changeStatus(data.id, 'ended');
            });

            editButton.addEventListener('click', () => {
                changeEvent(data.id);
            });

            deleteButton.addEventListener('click', () => {
                if (!adminPanel) {
                    changeStatus(data.id, 'deleted');
                } else changeStatus(data.id, 'deleted', false, true);
            });
            break;
        case 'ended':
            const endedEventDiv = document.createElement('div');
            endedEventDiv.className = 'event ended';

            endedEventDiv.addEventListener('click', (event) => {
                if (!endedActionsDiv.contains(event.target)) {
                    window.location.href = `post.html?id=${data.id}`;
                }
            });

            const endedImg = document.createElement('img');
            endedImg.id = 'imgEvent-id';
            endedImg.src = data.image || 'img/default-image.png'; 
            endedEventDiv.appendChild(endedImg);

            const endedTitleDiv = document.createElement('div');
            endedTitleDiv.className = 'title';

            const endedTitleP = document.createElement('p');
            endedTitleP.id = 'title';
            endedTitleP.textContent = data.title || 'Неизвестно';

            const endedSubtitleP = document.createElement('p');
            endedSubtitleP.id = 'subtitle';
            const endedEventDateObj = new Date(data.date); 
            const endedEventTime = (data.time || '00:00').slice(0, 5);

            const nowE = new Date();
            const todayE = new Date(nowE.getFullYear(), nowE.getMonth(), nowE.getDate());
            const tomorrowE = new Date(todayE.getTime() + 24 * 60 * 60 * 1000);
            const yesterday = new Date(todayE.getTime() - 24 * 60 * 60 * 1000);

            if (endedEventDateObj >= todayE && endedEventDateObj < tomorrowE) {
                endedSubtitleP.textContent = `Сегодня в ${endedEventTime}`;
            } else if (endedEventDateObj >= tomorrowE && endedEventDateObj < new Date(tomorrowE.getTime() + 24 * 60 * 60 * 1000)) {
                endedSubtitleP.textContent = `Завтра в ${endedEventTime}`;
            } else if (endedEventDateObj >= yesterday && endedEventDateObj < todayE) {
                endedSubtitleP.textContent = `Вчера в ${endedEventTime}`;
            } else {
                endedSubtitleP.textContent = endedEventDateObj.toLocaleDateString('ru-RU') + ' в ' + endedEventTime;
            }
            
            endedTitleDiv.appendChild(endedTitleP);
            endedTitleDiv.appendChild(endedSubtitleP);
            endedEventDiv.appendChild(endedTitleDiv);

            const endedLikesDiv = document.createElement('div');
            endedLikesDiv.className = 'likes';

            const heartIcon = document.createElement('img');
            heartIcon.src = 'img/background/button-pattern/heart.svg';
            endedLikesDiv.appendChild(heartIcon);

            const likesCount = document.createElement('p');
            if (!adminPanel) {
                likesCount.id = `likesCount-${data.id}`;
                likesCount.textContent = `NaN`;
            } else {
                likesCount.id = `a-likesCount-${data.id}`;
                likesCount.textContent = `NaN`;
            }
            
            updateLikeCount(data.id);
            endedLikesDiv.appendChild(likesCount);

            endedEventDiv.appendChild(endedLikesDiv);

            const endedActionsDiv = document.createElement('div');
            endedActionsDiv.className = 'event-actions';

            const endedDeleteButton = document.createElement('button');
            endedDeleteButton.id = 'btn-delete';
            endedDeleteButton.title = 'Удалить';
            endedDeleteButton.className = 'action';

            const deleteImg = document.createElement('img');
            deleteImg.src = 'img/background/button-pattern/calendar-minus.svg';
            deleteImg.alt = 'Удалить';

            endedDeleteButton.appendChild(deleteImg);
            endedActionsDiv.appendChild(endedDeleteButton);

            endedEventDiv.appendChild(endedActionsDiv);

            if (!adminPanel) { 
                document.querySelector('#ended.events').appendChild(endedEventDiv);
            } else {
                document.querySelector('#a-ended.events').appendChild(endedEventDiv);
            }

            endedDeleteButton.addEventListener('click', () => {
                if (!adminPanel) {
                    changeStatus(data.id, 'deleted');
                } else changeStatus(data.id, 'deleted', false, true);
            });
            break;
        case 'checking':
            const checkingEventDiv = document.createElement('div');
            checkingEventDiv.className = 'event checking'; 

            checkingEventDiv.addEventListener('click', (event) => {
                if (!checkingActionsDiv.contains(event.target)) {
                    window.location.href = `post.html?id=${data.id}`;
                }
            });
            
            const checkingImg = document.createElement('img');
            checkingImg.id = 'imgEvent-id';
            checkingImg.src = data.image || 'img/default-image.png';
            checkingEventDiv.appendChild(checkingImg);

            const checkingTitleDiv = document.createElement('div');
            checkingTitleDiv.className = 'title';

            const checkingTitleP = document.createElement('p');
            checkingTitleP.id = 'title';
            checkingTitleP.textContent = data.title || 'Неизвестно';

            const checkingSubtitleP = document.createElement('p');
            checkingSubtitleP.id = 'subtitle';
            const checkingEventDateObj = new Date(data.date); 
            const checkingEventTime = (data.time || '00:00').slice(0, 5); 

            const nowC = new Date();
            const todayC = new Date(nowC.getFullYear(), nowC.getMonth(), nowC.getDate()); 
            const tomorrowC = new Date(todayC.getTime() + 24 * 60 * 60 * 1000); 
            const yesterdayC = new Date(todayC.getTime() - 24 * 60 * 60 * 1000);

            if (checkingEventDateObj >= todayC && checkingEventDateObj < tomorrowC) {
                checkingSubtitleP.textContent = `Сегодня в ${checkingEventTime}`;
            } else if (checkingEventDateObj >= tomorrowC && checkingEventDateObj < new Date(tomorrowC.getTime() + 24 * 60 * 60 * 1000)) {
                checkingSubtitleP.textContent = `Завтра в ${checkingEventTime}`;
            } else if (checkingEventDateObj >= yesterdayC && checkingEventDateObj < todayC) {
                checkingSubtitleP.textContent = `Вчера в ${checkingEventTime}`;
            } else {
                checkingSubtitleP.textContent = checkingEventDateObj.toLocaleDateString('ru-RU') + ' в ' + checkingEventTime;
            }

            checkingTitleDiv.appendChild(checkingTitleP);
            checkingTitleDiv.appendChild(checkingSubtitleP);
            checkingEventDiv.appendChild(checkingTitleDiv);

            const checkingActionsDiv = document.createElement('div');
            checkingActionsDiv.className = 'event-actions';

            if (!adminPanel) {
                const checkingEditButton = document.createElement('button');
                checkingEditButton.id = 'btn-edit';
                checkingEditButton.title = 'Редактировать';
                checkingEditButton.className = 'action';
            
                const editImg = document.createElement('img');
                editImg.src = 'img/background/button-pattern/calendar-plus.svg';
                editImg.alt = 'Редактировать';
            
                checkingEditButton.appendChild(editImg);
                checkingActionsDiv.appendChild(checkingEditButton);
            
                const checkingDeleteButton = document.createElement('button');
                checkingDeleteButton.id = 'btn-delete';
                checkingDeleteButton.title = 'Удалить';
                checkingDeleteButton.className = 'action';
            
                const checkingDeleteImg = document.createElement('img'); 
                checkingDeleteImg.src = 'img/background/button-pattern/calendar-minus.svg';
                checkingDeleteImg.alt = 'Удалить';
            
                checkingDeleteButton.appendChild(checkingDeleteImg);
                checkingActionsDiv.appendChild(checkingDeleteButton);

                checkingEditButton.addEventListener('click', () => {
                    changeEvent(data.id);
                });

                checkingDeleteButton.addEventListener('click', () => {
                    changeStatus(data.id, 'deleted');
                });
            } else {
                const checkingApproveButton = document.createElement('button');
                checkingApproveButton.id = 'btn-approve';
                checkingApproveButton.title = 'Одобрить';
                checkingApproveButton.className = 'action';
            
                const approveImg = document.createElement('img');
                approveImg.src = 'img/background/button-pattern/calendar-checked.svg';
                approveImg.alt = 'Одобрить';
            
                checkingApproveButton.appendChild(approveImg);
                checkingActionsDiv.appendChild(checkingApproveButton);
            
                const checkingDeleteButton = document.createElement('button');
                checkingDeleteButton.id = 'btn-delete';
                checkingDeleteButton.title = 'Удалить';
                checkingDeleteButton.className = 'action';
            
                const checkingDeleteImg = document.createElement('img'); 
                checkingDeleteImg.src = 'img/background/button-pattern/calendar-minus.svg';
                checkingDeleteImg.alt = 'Удалить';
            
                checkingDeleteButton.appendChild(checkingDeleteImg);
                checkingActionsDiv.appendChild(checkingDeleteButton);

                checkingApproveButton.addEventListener('click', () => {
                    changeStatus(data.id, 'public', false, true);
                });
    
                checkingDeleteButton.addEventListener('click', () => {
                    changeStatus(data.id, 'deleted', false, true);
                });
            }

            checkingEventDiv.appendChild(checkingActionsDiv);

            if (!adminPanel) { 
                document.querySelector('#checking.events').appendChild(checkingEventDiv);
            } else {
                document.querySelector('#a-checking.events').appendChild(checkingEventDiv);
            }
            break;
        case 'deleted': 
            const deletedEventDiv = document.createElement('div');
            deletedEventDiv.className = 'event deleted'; 
        
            deletedEventDiv.addEventListener('click', () => {
                window.location.href = `post.html?id=${data.id}`;
            });

            const deletedImg = document.createElement('img');
            deletedImg.id = 'imgEvent-id';
            deletedImg.src = data.image || 'img/default-image.png'; 
            deletedEventDiv.appendChild(deletedImg);
        
            const deletedTitleDiv = document.createElement('div');
            deletedTitleDiv.className = 'title';
        
            const deletedTitleP = document.createElement('p');
            deletedTitleP.id = 'title';
            deletedTitleP.textContent = data.title || 'Неизвестно';
        
            const deletedSubtitleP = document.createElement('p');
            deletedSubtitleP.id = 'subtitle';
            const date = new Date(data.changed_time);

            const formattedTime = date.toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
            }).replace(',', ' в');

            deletedSubtitleP.innerHTML = `Удалил <b>${data.changed_by}</b><br>Изменено ${formattedTime}`; 
        
            deletedTitleDiv.appendChild(deletedTitleP);
            deletedTitleDiv.appendChild(deletedSubtitleP);
            deletedEventDiv.appendChild(deletedTitleDiv);
        
            if (adminPanel) {
                document.querySelector('#a-ended.events').appendChild(deletedEventDiv);
            }
            break;
        }
};

document.addEventListener('click', async (e) => { // Добавляем глобальный обработчик кликов на лайк
    if (e.target && e.target.classList.contains('likess')) {
        const postId = e.target.dataset.postId;
        const isLiked = e.target.classList.contains('active');
        const likeCountElement = document.getElementById(`count-like-${postId}`);
        
        const currentCount = parseInt(likeCountElement.textContent, 10) || 0;

        const updateUI = (isLiked) => {
            e.target.classList.toggle('active'); 
            likeCountElement.textContent = isLiked ? currentCount - 1 : currentCount + 1; 
        };

        updateUI(isLiked);

        e.target.disabled = true;

        try {
            const endpoint = isLiked ? '/api/event/unlike' : '/api/event/like';
            const response = await fetch(`http://127.0.0.1:3000${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ postId }),
                credentials: 'include',
            });

            const result = await response.json();

            if (!result.success) {
                updateUI(!isLiked);
            }
        } catch (error) {
            console.error('Ошибка при обработке лайка:', error);
            updateUI(!isLiked);
        } finally {
            e.target.disabled = false;
        }
    }
});

async function updateLikeState(postId) { // Асинхронная функция для обновления состояния лайка для поста
    try {
        const response = await fetch(`http://127.0.0.1:3000/api/event/like/check/${postId}`, {
            credentials: 'include',
        });

        const result = await response.json();

        if (result.success) {
            const likeButton = document.getElementById(`likes-${postId}`);
            const likeCountElement = document.getElementById(`count-like-${postId}`);

            if (result.hasLiked) {
                likeButton.classList.add('active');
            } else {
                likeButton.classList.remove('active');
            }

            const likeCountResponse = await fetch(`http://127.0.0.1:3000/api/event/like/get/${postId}`);
            const likeCountResult = await likeCountResponse.json();
            if (likeCountResult.success) {
                likeCountElement.textContent = likeCountResult.likeCount;
            }
        }
    } catch (error) {
        console.error('Ошибка при обновлении состояния лайка:', error);
    }
}

document.addEventListener('click', async (e) => { // Добавляем глобальный обработчик кликов на избранное
    if (e.target && e.target.classList.contains('favoritess')) {
        const postId = e.target.dataset.postId;
        const isFavorited = e.target.classList.contains('active');
        const favoriteCountElement = document.getElementById(`count-favorite-${postId}`);
        
        const currentCount = parseInt(favoriteCountElement.textContent, 10) || 0;

        const updateUI = (isFavorited) => {
            e.target.classList.toggle('active');
            favoriteCountElement.textContent = isFavorited ? currentCount - 1 : currentCount + 1;
        };

        updateUI(isFavorited);

        e.target.disabled = true;

        try {
            const endpoint = isFavorited ? '/api/event/unfavorite' : '/api/event/favorite';
            const response = await fetch(`http://127.0.0.1:3000${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ postId }),
                credentials: 'include',
            });

            const result = await response.json();

            if (!result.success) {
                updateUI(!isFavorited);
            }
        } catch (error) {
            console.error('Ошибка при обработке лайка:', error);
            updateUI(!isFavorited);
        } finally {
            e.target.disabled = false;
        }
    }
});

async function updateFavoriteState(postId) { // Асинхронная функция для обновления состояния избранного для поста
    try {
        const response = await fetch(`http://127.0.0.1:3000/api/event/favorite/check/${postId}`, {
            credentials: 'include',
        });
        const result = await response.json();
        if (result.success) {
            const favoriteButton = document.getElementById(`favorites-${postId}`);
            const favoriteCountElement = document.getElementById(`count-favorite-${postId}`);

            if (result.hasFavorited) {
                favoriteButton.classList.add('active');
            } else {
                favoriteButton.classList.remove('active');
            }

            const favoriteCountResponse = await fetch(`http://127.0.0.1:3000/api/event/favorite/get/${postId}`);
            const favoriteCountResult = await favoriteCountResponse.json();

            if (favoriteCountResult.success) {
                favoriteCountElement.textContent = favoriteCountResult.favoriteCount;
            }
        }
    } catch (error) {
        console.error('Ошибка при обновлении состояния лайка:', error);
    }
}

function createPost (category, data, isFavorite = false) { // Функция для отображения поста
    const eventDiv = document.createElement('div');
    eventDiv.className = `event`;
    
    const eventWrapper = document.createElement('div');

    const eventImg = document.createElement('img');
    eventImg.src = data.image;
    eventWrapper.appendChild(eventImg);

    const eventTitle = document.createElement('p');
    eventTitle.className = 'event-title';
    eventTitle.textContent = data.title || 'Неизвестное мероприятие';
    eventWrapper.addEventListener('click', () => {
        window.location.href = `post.html?id=${data.id}`;
    });
    
    const eventDate = document.createElement('p');
    eventDate.className = 'event-date';

    const eventDateObj = new Date(data.date);
    const eventTime = (data.time || '00:00').slice(0, 5);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); 
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000); 

    if (eventDateObj >= today && eventDateObj < tomorrow) {
        eventDate.textContent = `Сегодня в ${eventTime}`;
    } else if (eventDateObj >= tomorrow && eventDateObj < new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000)) {
        eventDate.textContent = `Завтра в ${eventTime}`;
    } else {
        eventDate.textContent = eventDateObj.toLocaleDateString('ru-RU') + ' в ' + eventTime || '??.??.????';
    }

    eventWrapper.appendChild(eventTitle);
    eventWrapper.appendChild(eventDate);
    eventDiv.appendChild(eventWrapper);

    if (!isFavorite) {
        const eventActionBlock = document.createElement('div');
        eventActionBlock.className = 'action-block';

        const eventLikeButton = document.createElement('button');
        eventLikeButton.id = `likes-${data.id}`;
        eventLikeButton.className = 'likess';
        eventLikeButton.dataset.postId = data.id;
        const likeButtonImg = document.createElement('img');
        likeButtonImg.src = 'img/background/button-pattern/heart.svg';
        const likeButtonCount = document.createElement('p');
        likeButtonCount.id = `count-like-${data.id}`;
        likeButtonCount.textContent = '0';
        updateLikeState(data.id);

        eventLikeButton.appendChild(likeButtonImg);
        eventLikeButton.appendChild(likeButtonCount);

        const eventFavoriteButton = document.createElement('button');
        eventFavoriteButton.id = `favorites-${data.id}`;
        eventFavoriteButton.className = 'favoritess';
        eventFavoriteButton.dataset.postId = data.id;
        const favoriteButtonImg = document.createElement('img');
        favoriteButtonImg.src = 'img/background/button-pattern/folder-Star.svg';
        const favoriteButtonCount = document.createElement('p');
        favoriteButtonCount.id = `count-favorite-${data.id}`;
        favoriteButtonCount.textContent = '0';
        updateFavoriteState(data.id);

        eventFavoriteButton.appendChild(favoriteButtonImg);
        eventFavoriteButton.appendChild(favoriteButtonCount);

        eventActionBlock.appendChild(eventLikeButton);
        eventActionBlock.appendChild(eventFavoriteButton);

        eventDiv.appendChild(eventActionBlock);
    }
    console.log(category);

    let posts;

    switch (category) {
        case 'sport-hockey':
            posts = document.querySelector('.sport .nears #hockey.posts');
            posts.appendChild(eventDiv);
            break;
        case 'sport-boxing':
            posts = document.querySelector('.sport .nears #martial-arts.posts');
            posts.appendChild(eventDiv);
            break;
        case 'cinema-upcoming':
            posts = document.querySelector('.cinema .nears #nears.posts');
            posts.appendChild(eventDiv);
            break;
        case 'cinema-today':
            posts = document.querySelector('.cinema .today #today.posts');
            posts.appendChild(eventDiv);
            break;
        case 'concert-upcoming':
            posts = document.querySelector('.concert .nears #nears.posts');
            posts.appendChild(eventDiv);
            break;
        case 'concert-today':
            posts = document.querySelector('.concert .today #today.posts');
            posts.appendChild(eventDiv);
            break;       
        case 'theatre':
            posts = document.querySelector('.theatre .nears #theatre.posts');
            posts.appendChild(eventDiv);
            break;
        case 'favorites-cinema':
            posts = document.querySelector('.cinema .favorites #favorites.posts');
            posts.appendChild(eventDiv);
            break;
        case 'favorites-concert':
            posts = document.querySelector('.concert .favorites #favorites.posts');
            posts.appendChild(eventDiv);
            break;
        case 'favorites-theatre':
            posts = document.querySelector('.theatre .favorites #favorites.posts');
            posts.appendChild(eventDiv);
            break;   
        case 'favorites-sport':
            posts = document.querySelector('.sport .favorites #favorites.posts');
            posts.appendChild(eventDiv);
            break;
        case 'likethis':
            posts = document.querySelector('.post .events #thisCat.posts');
            posts.appendChild(eventDiv);
            break;
        case 'favorites':
            posts = document.querySelector('.post .events #favoritesCat.posts');
            posts.appendChild(eventDiv);
            break;     
        default:
            break;
    }
}

export async function loadEventInfo(userId) { // Асинхронная функция для загрузки информации о событиях для определенного пользователя
    try {
        const response = await fetch(`http://127.0.0.1:3000/api/event/get?userId=${userId}`);

        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }

        const data = await response.json();
        const events = data.events;

        const sortedEvents = {
            public: [],
            ended: [],
            checking: []
        };

        const now = new Date();

        events.forEach(event => {
            const baseDate = new Date(`${event.date.split('T')[0]}T${event.time}`);
            const eventDate = new Date(baseDate.getTime() + 24 * 60 * 60 * 1000); 
        
            if (eventDate < now && event.status !== 'ended') {
                if (event.status !== 'deleted') changeStatus(event.id, 'ended', true); 
            }

            if (event.status === 'public') {
                sortedEvents.public.push(event);
            } else if (event.status === 'ended') {
                sortedEvents.ended.push(event);
            } else if (event.status === 'checking') {
                sortedEvents.checking.push(event);
            }
        });
        
        const sortByDateTime = (a, b) => {
            const baseDateA = a.date.includes('T') ? a.date.split('T')[0] : a.date;
            const baseDateB = b.date.includes('T') ? b.date.split('T')[0] : b.date;
        
            const dateTimeA = new Date(`${baseDateA}T${a.time}`);
            const dateTimeB = new Date(`${baseDateB}T${b.time}`);

            return dateTimeA - dateTimeB;
        };

        sortedEvents.public.sort(sortByDateTime);
        sortedEvents.ended.sort(sortByDateTime);
        sortedEvents.checking.sort(sortByDateTime);

        const eventContainers = ['#public.events', '#ended.events', '#checking.events'];

        eventContainers.forEach(containerSelector => {
            const eventsContainer = document.querySelector(containerSelector);
            if (eventsContainer) {
                eventsContainer.innerHTML = '';
            }
        });

        sortedEvents.public.forEach(event => createEvent('public', event));
        sortedEvents.ended.forEach(event => createEvent('ended', event));
        sortedEvents.checking.forEach(event => createEvent('checking', event));
    } catch (error) {
        console.error('Ошибка при запросе:', error);
    }
}

export async function loadAllEvent() { // Асинхронная функция для загрузки информации о всех событиях
    try {
        const response = await fetch(`http://127.0.0.1:3000/api/event/get/all`);

        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }

        const data = await response.json();
        const events = data.events;

        const sortedEvents = {
            public: [],
            ended: [],
            deleted: [],
            checking: []
        };

        const now = new Date();

        events.forEach(event => {
            const baseDate = new Date(`${event.date.split('T')[0]}T${event.time}`);
            const eventDate = new Date(baseDate.getTime() + 24 * 60 * 60 * 1000);
        
            if (eventDate < now && event.status !== 'ended') {
                if (event.status !== 'deleted') changeStatus(event.id, 'ended', true);
            }

            if (event.status === 'public') {
                sortedEvents.public.push(event);
            } else if (event.status === 'ended') {
                sortedEvents.ended.push(event);
            } else if (event.status === 'deleted') {
                sortedEvents.deleted.push(event);
            } else if (event.status === 'checking') {
                sortedEvents.checking.push(event);
            }
        });
        
        const sortByDateTime = (a, b) => {
            const baseDateA = a.date.includes('T') ? a.date.split('T')[0] : a.date;
            const baseDateB = b.date.includes('T') ? b.date.split('T')[0] : b.date;
        
            const dateTimeA = new Date(`${baseDateA}T${a.time}`);
            const dateTimeB = new Date(`${baseDateB}T${b.time}`);

            return dateTimeA - dateTimeB;
        };

        sortedEvents.public.sort(sortByDateTime);
        sortedEvents.ended.sort(sortByDateTime);
        sortedEvents.deleted.sort(sortByDateTime);
        sortedEvents.checking.sort(sortByDateTime);

        const eventContainers = ['#a-public.events', '#a-ended.events', '#a-checking.events'];

        eventContainers.forEach(containerSelector => {
            const eventsContainer = document.querySelector(containerSelector);
            if (eventsContainer) {
                eventsContainer.innerHTML = '';
            }
        });

        sortedEvents.public.forEach(event => createEvent('public', event, true));
        sortedEvents.ended.forEach(event => createEvent('ended', event, true));
        sortedEvents.deleted.forEach(event => createEvent('deleted', event, true));
        sortedEvents.checking.forEach(event => createEvent('checking', event, true));
    } catch (error) {
        console.error('Ошибка при запросе:', error);
    }
}

async function getUserCity() { // Асинхронная функция для получения города пользователя
    const response = await fetch('http://127.0.0.1:3000/api/user/get/city', {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
    });
    if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
    }
    const data = await response.json();
    return data.city;
}

export async function loadEvent() { // Асинхронная функция для загрузки событий и сортировки по категориям и датам
    try {
        const response = await fetch(`http://127.0.0.1:3000/api/event/get/all`);

        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }

        const data = await response.json();
        const events = data.events;

        const responseFav = await fetch(`http://127.0.0.1:3000/api/event/get/favorites`, {
            method: 'GET',
            credentials: 'include', 
            headers: {
                'Content-Type': 'application/json', 
            }
        });

        if (!responseFav.ok) {
            throw new Error(`Ошибка HTTP: ${responseFav.status}`);
        }

        const dataFav = await responseFav.json();
        const eventsFav = dataFav.eventsFav;

        console.log('eventsFav:', eventsFav);

        let userCity = null;
        userCity = await getUserCity();

        const sortedCategories = {
            cinema: {
                today: [],
                upcoming: []
            },
            concert: {
                today: [],
                upcoming: []
            },
            theatre: [],
            sport: {
                hockey: [],
                boxing: []
            },
            favorites: {
                cinema: [],
                concert: [],
                theatre: [],
                sport: []
            }
        };

        const now = new Date();
        const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        const weekFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

        events.forEach(event => {
            const baseDate = new Date(`${event.date.split('T')[0]}T${event.time}`);
            const eventDate = new Date(baseDate.getTime() + 24 * 60 * 60 * 1000); 
        
            if (eventDate < now && event.status !== 'ended') {
                if (event.status !== 'deleted') changeStatus(event.id, 'ended', true); 
                return;
            }

            if (!userCity) {
                console.error('Не удалось получить город пользователя.');
                return;
            }

            if (event.status === 'public' && event.city === userCity) {
                const category = event.category.toLowerCase(); 

                if (category === 'theatre') {
                    sortedCategories.theatre.push(event);
                } else if (category === 'sport') {
                    if (event.subcategory === 'hockey') {
                        sortedCategories.sport.hockey.push(event);
                    } else if (event.subcategory === 'martial-arts') {
                        sortedCategories.sport.boxing.push(event);
                    }
                } else if (sortedCategories[category]) {
                    if (eventDate <= endOfToday) {
                        sortedCategories[category].today.push(event);
                    } else if (category === 'concert') {
                        sortedCategories[category].upcoming.push(event);
                    }
                    else if (eventDate <= weekFromNow) {
                        sortedCategories[category].upcoming.push(event);
                    }
                }
            }
        });

        if (eventsFav) {
            eventsFav.forEach(event => {
                const baseDate2 = new Date(`${event.date.split('T')[0]}T${event.time}`);
                const eventDate2 = new Date(baseDate2.getTime() + 24 * 60 * 60 * 1000); 
            
                if (eventDate2 < now && event.status !== 'ended') {
                    if (event.status !== 'deleted') changeStatus(event.id, 'ended', true); 
                    return;
                }

                if (!userCity) {
                    console.error('Не удалось получить город пользователя.');
                    return;
                }
                
                if (event.status === 'public'/* && event.city === userCity*/) {
                    const category = event.category.toLowerCase();
                    // sortedCategories.favorites.push(event);
                    sortedCategories.favorites[category].push(event);
                }
            });
        }

        const sortByDateTime = (a, b) => {
            const baseDateA = a.date.includes('T') ? a.date.split('T')[0] : a.date;
            const baseDateB = b.date.includes('T') ? b.date.split('T')[0] : b.date;

            const dateTimeA = new Date(`${baseDateA}T${a.time}`);
            const dateTimeB = new Date(`${baseDateB}T${b.time}`);

            return dateTimeA - dateTimeB;
        };

        Object.keys(sortedCategories).forEach(category => {
            if (category === 'favorites') {
                sortedCategories.favorites.sport.sort(sortByDateTime);
                sortedCategories.favorites.theatre.sort(sortByDateTime);
                sortedCategories.favorites.cinema.sort(sortByDateTime);
                sortedCategories.favorites.concert.sort(sortByDateTime);
            } else if (category === 'theatre') {
                sortedCategories.theatre.sort(sortByDateTime);
            } else if (category === 'sport') {
                sortedCategories.sport.hockey.sort(sortByDateTime);
                sortedCategories.sport.boxing.sort(sortByDateTime);
            } else {
                sortedCategories[category].today.sort(sortByDateTime);
                sortedCategories[category].upcoming.sort(sortByDateTime);
            }
            
        });

        const postsContainers = document.querySelectorAll('.posts');
        postsContainers.forEach(container => {
            container.innerHTML = '';
        });

        Object.keys(sortedCategories).forEach(category => {
            if (category === 'favorites') {
                sortedCategories.favorites.cinema.forEach(event => {
                    createPost('favorites-cinema', event, true);
                });
                sortedCategories.favorites.concert.forEach(event => {
                    createPost('favorites-concert', event, true);
                });
                sortedCategories.favorites.theatre.forEach(event => {
                    createPost('favorites-theatre', event, true);
                });
                sortedCategories.favorites.sport.forEach(event => {
                    createPost('favorites-sport', event, true);
                });
            } else if (category === 'theatre') {
                sortedCategories.theatre.forEach(event => {
                    createPost('theatre', event);
                });
            } else if (category === 'sport') {
                sortedCategories[category].hockey.forEach(event => {
                    createPost(`${category}-hockey`, event);
                });
                sortedCategories[category].boxing.forEach(event => {
                    createPost(`${category}-boxing`, event);
                });
            } else {
                sortedCategories[category].today.forEach(event => {
                    createPost(`${category}-today`, event);
                });
                sortedCategories[category].upcoming.forEach(event => {
                    createPost(`${category}-upcoming`, event);
                });
            }
            
        });
    } catch (error) {
        console.error('Ошибка при запросе:', error);
    }
}

export async function loadEventsByCategory(category, postId) { // Асинхронная функция для загрузки событий по категории и сортировки
    try {
        if (!category) {
            console.error('Категория не указана.');
            return;
        }

        const response = await fetch(`http://127.0.0.1:3000/api/event/get/by-category?category=${category}`);

        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }

        const data = await response.json();
        const events = data.events;

        const responseFav = await fetch(`http://127.0.0.1:3000/api/event/get/favorites`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!responseFav.ok) {
            throw new Error(`Ошибка HTTP: ${responseFav.status}`);
        }

        const dataFav = await responseFav.json();
        const eventsFav = dataFav.eventsFav;

        let userCity = null;
        userCity = await getUserCity();

        const sortedEvents = {
            likethis: [],
            favorites: []
        };

        const now = new Date();

        events.forEach(event => {
            const baseDate = new Date(`${event.date.split('T')[0]}T${event.time}`);
            const eventDate = new Date(baseDate.getTime() + 24 * 60 * 60 * 1000); 

            if (eventDate < now && event.status !== 'ended') {
                if (event.status !== 'deleted') changeStatus(event.id, 'ended', true);
                return;
            }

            if (!userCity) {
                console.error('Не удалось получить город пользователя.');
                return;
            }

            if (event.status === 'public' && event.city === userCity && event.category.toLowerCase() === category.toLowerCase() && event.id !== postId) {
                sortedEvents.likethis.push(event);
            }
        });

        eventsFav.forEach(event => {
            const baseDate2 = new Date(`${event.date.split('T')[0]}T${event.time}`);
            const eventDate2 = new Date(baseDate2.getTime() + 24 * 60 * 60 * 1000);

            if (eventDate2 < now && event.status !== 'ended') {
                if (event.status !== 'deleted') changeStatus(event.id, 'ended', true);
                return;
            }

            if (!userCity) {
                console.error('Не удалось получить город пользователя.');
                return;
            }
            
            if (event.status === 'public' && event.category.toLowerCase() === category.toLowerCase() && event.id !== postId) {
                    sortedEvents.favorites.push(event);
            }
        });

        const sortByDateTime = (a, b) => {
            const baseDateA = a.date.includes('T') ? a.date.split('T')[0] : a.date;
            const baseDateB = b.date.includes('T') ? b.date.split('T')[0] : b.date;

            const dateTimeA = new Date(`${baseDateA}T${a.time}`);
            const dateTimeB = new Date(`${baseDateB}T${b.time}`);

            return dateTimeA - dateTimeB;
        };

        sortedEvents.likethis.sort(sortByDateTime);
        sortedEvents.favorites.sort(sortByDateTime);

        const postsContainers = document.querySelectorAll('.posts');
        postsContainers.forEach(container => {
            container.innerHTML = '';
        });

        sortedEvents.likethis.forEach(event => {
            createPost(`likethis`, event, true);
        });
        sortedEvents.favorites.forEach(event => {
            createPost(`favorites`, event, true);
        });

    } catch (error) {
        console.error('Ошибка при запросе:', error);
    }
}

async function changeEvent(eventId) { // Функция для загрузки и отображения данных события в форму редактирования
    try {
        const response = await fetch(`http://127.0.0.1:3000/api/event/get/${eventId}`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }

        const eventData = await response.json();
        const event = eventData.event;
        console.log(eventData);

        openChangeEvent();

        const titlein = document.getElementById('ed-title-in');
        const descriptionin = document.getElementById('ed-description-in');
        const imagein = document.getElementById('preview-ed');
        const datein = document.getElementById('ed-date-in');
        const timein = document.getElementById('ed-time-in');
        const cityin = document.getElementById('ed-city-in');
        const buildingin = document.getElementById('ed-building-in');
        const categoryin = document.getElementById('ed-category-in');
        const subcategoryin = document.getElementById('ed-subcategory-in');
        const urlin = document.getElementById('ed-url-in');
        const pricein = document.getElementById('ed-price-in');
        
        titlein.value = event.title || 'Неизвестно';
        titlein.placeholder = event.title || 'Неизвестно';

        descriptionin.value = event.description;

        imagein.style.display = 'flex';
        imagein.src = event.image;

        const dateObj = new Date(event.date);
        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const year = dateObj.getFullYear();
        const formattedDate = `${year}-${month}-${day}`;
        datein.value = formattedDate || '';

        timein.value = event.time || '';

        cityin.value = event.city || 'Неизвестно';
        cityin.placeholder = event.city || 'Неизвестно';

        buildingin.value = event.building || 'Неизвестно';
        buildingin.placeholder = event.building || 'Неизвестно';

        categoryin.value = event.category || 'cinema';
        updateSubcategories(true);
        subcategoryin.value = event.subcategory || 'drama';

        urlin.value = event.url || '---';
        pricein.value = event.price || '0';

        const changeButton = document.getElementById('changeButton');

        changeButton.onclick = async () => {
            await updateEvent(eventId, admin);
        };

    } catch (error) {
        console.error('Ошибка при загрузке данных события:', error);
    }
}

async function updateEvent(eventId) { // Функция для обновления ивента
    const title = document.getElementById('ed-title-in').value.trim();
    const description = document.getElementById('ed-description-in').value;
    const category = document.getElementById('ed-category-in').value;
    const subcategory = document.getElementById('ed-subcategory-in').value;
    const date = document.getElementById('ed-date-in').value.trim();
    const time = document.getElementById('ed-time-in').value.trim();
    const city = document.getElementById('ed-city-in').value.trim();
    const building = document.getElementById('ed-building-in').value;
    const url = document.getElementById('ed-url-in').value.trim();
    const price = document.getElementById('ed-price-in').value.trim();
    const imageFile = document.getElementById('ed-event-image').files[0];

    if (!title || !description || !date || !time || !city || !url || !price || !category || !subcategory || !building) {
        createAlert("Все поля обязательны для заполнения.", 'warning');
        return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('category', category);
    formData.append('subcategory', subcategory);
    formData.append('date', date);
    formData.append('time', time);
    formData.append('city', city);
    formData.append('building', building);
    formData.append('url', url);
    formData.append('price', price);

    if (imageFile) {
        formData.append('image', imageFile);
    }

    try {
        const response = await fetch(`http://127.0.0.1:3000/api/event/update/${eventId}`, {
            method: 'PUT',
            body: formData,
            credentials: 'include',
        });

        const result = await response.json();
        if (result.success) {
            createAlert("Мероприятие успешно обновлено!", 'success');
            const userId = await getUserId();
            await loadEventInfo(userId);
            const modal = document.getElementById("modals");
            closeModal(modal);
        } else {
            createAlert("Ошибка при обновлении мероприятия: " + result.message, 'error');
        }
    } catch (error) {
        console.error("Ошибка при обновлении мероприятия:", error);
        createAlert("Ошибка при подключении к серверу.", 'error');
    }
}

function validateAndShowPreview(event, edit=false) { // Функция для отображения превью мероприятия
    const fileInput = event.target;
    const file = fileInput.files[0];
    const preview = document.getElementById('preview');
    const previewEd =document.getElementById('preview-ed');

    if (!file) return;

    const img = new Image();
    const reader = new FileReader();

    reader.onload = function(e) {
        img.src = e.target.result;
    };

    img.onload = function() {
        if (edit) {
            previewEd.src = img.src;
            previewEd.style.display = "flex";
        } else {
            preview.src = img.src;
            preview.style.display = "flex";
        }
        
    };

    reader.readAsDataURL(file);
}

const categories = { // Объект с категориями и их подкатегориями для различных типов мероприятий
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

// Переменные для ссылок на выпадающие списки категории и подкатегории
let categorySelect;
let subcategorySelect;

function updateSubcategories(edit=false) { // Функция для обновления подкатегорий в зависимости от выбранной категории
    if (!edit) {
        categorySelect = document.getElementById("category-in");
        subcategorySelect = document.getElementById("subcategory-in");
    } else {
        categorySelect = document.getElementById("ed-category-in");
        subcategorySelect = document.getElementById("ed-subcategory-in");
    }

    const selectedCategory = categorySelect.value;

    subcategorySelect.innerHTML = "";

    const subcategories = categories[selectedCategory] || [];

    subcategories.forEach(subcategory => {
        const option = document.createElement("option");
        option.value = subcategory.value;
        option.textContent = subcategory.text;
        subcategorySelect.appendChild(option);
    });
}

window.validateAndShowPreview = validateAndShowPreview;
window.updateSubcategories = updateSubcategories;
window.submitEvent = submitEvent;
window.changeStatus = changeStatus;
window.createEvent = createEvent;
window.loadEventInfo = loadEventInfo;
window.loadAllEvent = loadAllEvent;
window.loadEvent = loadEvent;