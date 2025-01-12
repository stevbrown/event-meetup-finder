let alertCounter = 0; // Глобальная переменная для авто-инкремента ID уведомлений

// Функция для создания уведомлений на странице.
export function createAlert(message, type) {
    const alertId = alertCounter++; // Генерация уникального id на основе текущего счетчика

    // Создаем основной контейнер для уведомления
    const alertBox = document.createElement('div');
    alertBox.classList.add('alert-box');
    alertBox.classList.add(`alert-box-${alertId}`); // Добавляем уникальный класс с id

    const alertImage = document.createElement('img'); // Создаем элемент для иконки уведомления

    // Переменные для пути к изображению и его альтернативного текста
    let alertImgSrc = '';
    let alertAltSrc = '';
    switch(type) {
        case 'success': // Тип успех
            alertImgSrc = 'img/alerts/check-circle.svg';
            alertAltSrc = 'SUC';
            break;
        case 'warning': // Тип предупреждение
            alertImgSrc = 'img/alerts/warning.svg';
            alertAltSrc = 'WRN';
            break;
        case 'error': // Тип ошибка
            alertImgSrc = 'img/alerts/siren.svg';
            alertAltSrc = 'ERR';
            break;
        default: // Значение по умолчанию (ошибка)
            alertImgSrc = 'img/alerts/siren.svg';
            alertAltSrc = 'ERR';
            break;
    }

    // Устанавливаем атрибуты изображения (src и alt)
    alertImage.src = alertImgSrc;
    alertImage.alt = alertAltSrc;

    // Создаем текстовый элемент для сообщения
    const alertText = document.createElement('p');
    alertText.textContent = message; // Устанавливаем текст уведомления

    // Создаем кнопку для закрытия уведомления
    const closeButton = document.createElement('button');
    const closeImg = document.createElement('img');
    closeImg.src = 'img/alerts/X.svg';  // Иконка кнопки закрытия
    closeImg.alt = 'X'; // Альтернативный текст кнопки закрытия
    closeButton.appendChild(closeImg);

    // Собираем все элементы в контейнер уведомления
    alertBox.appendChild(alertImage);
    alertBox.appendChild(alertText);
    alertBox.appendChild(closeButton);

    // Находим контейнер для всех уведомлений
    const alertsContainer = document.querySelector('.alerts');
    alertsContainer.appendChild(alertBox);

    // Добавляем класс для анимации появления (через небольшую задержку для плавного эффекта)
    setTimeout(() => {
        alertBox.classList.add('loaded');
    }, 10); // Задержка для начала анимации

    // Обработчик клика по кнопке закрытия
    closeButton.addEventListener('click', () => {
        removeAlert(alertBox);
    });

    // Автоматическое удаление уведомления через 5 секунд
    setTimeout(() => {
        removeAlert(alertBox);
    }, 5000);

    // Ограничение количества уведомлений на экране
    const alertBoxes = alertsContainer.querySelectorAll('.alert-box');
    if (alertBoxes.length > 3) { // Удаляем самое старое уведомление, если их больше 3
        alertBoxes[0].remove();
    }
}

// Функция для плавного удаления уведомления.
function removeAlert(alertBox) {
    alertBox.classList.remove('loaded'); // Убираем класс анимации появления (запускаем исчезновение)
    setTimeout(() => {
        alertBox.remove(); // Полностью удаляем элемент из DOM после завершения анимации
    }, 1500); // 1.5 секунды задержки на завершение анимации
}
