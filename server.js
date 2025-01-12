// Подключение необходимых модулей
const express = require('express'); // Подключение Express для создания сервера
const mysql = require('mysql2'); // Подключение библиотеки для работы с MySQL
const bcrypt = require('bcrypt'); // Подключение библиотеки для хэширования паролей
const cors = require('cors'); // Подключение библиотеки для настройки CORS
const session = require('express-session'); // Подключение библиотеки для работы с сессиями
const multer = require('multer'); // Подключение библиотеки для загрузки файлов
const path = require('path'); // Подключение модуля для работы с путями файловой системы
const app = express(); // Создание экземпляра приложения Express

// Настройка CORS (разрешает доступ только с указанного источника)
app.use(cors({
    origin: 'http://127.0.0.1:5500', // Разрешённый источник (клиентская часть с порта 5500)
    credentials: true // Разрешаем передачу куки и авторизационные данные
}));

// Настройка парсинга JSON данных, поступающих в теле запросов
app.use(express.json());

// Конфигурация multer для загрузки файлов
const storage = multer.diskStorage({
    destination: 'img/uploaded/', // Папка для сохранения загруженных файлов
    filename: (req, file, cb) => { // Генерация уникального имени файла на основе текущего времени и расширения оригинального файла
        cb(null, Date.now() + path.extname(file.originalname)); // Сохраняем с новым именем
    }
});
const upload = multer({ storage }); // Создание экземпляра multer с указанной конфигурацией

// Настройка подключения к базе данных MySQL
const db = mysql.createConnection({
    host: '127.0.0.1', // Адрес хоста
    user: 'root', // Имя пользователя для подключения к базе данных
    password: '', // Пароль для подключения к базе данных
    database: '' // Имя базы данных, с которой будет работать приложение
});

// Настройка сессий для хранения данных о пользователе
app.use(session({
    secret: '2xv349bEkk9h5hdspJJ3+rUkHVF6yX9HcdVe5POJA7M43D5I43A5lkvOQ0KA1DbA', // Ключ для шифрования сессий
    resave: false, // Отключаем повторное сохранение сессий, если они не изменились
    saveUninitialized: false, // Не сохраняем пустые или неинициализированные сессии
    cookie: {
        secure: false, // Отключаем безопасные куки (для разработки, в продакшн нужно включать)
        httpOnly: true // Защищаем куки от доступа через JavaScript на клиенте
    }
}));

// Экспортируем подключение к базе данных с использованием Promise API для асинхронных операций
module.exports = db.promise();

// Устанавливаем соединение с базой данных MySQL
db.connect((err) => {
    if (err) {
        throw err; // Если ошибка при подключении, выбрасываем исключение
    }
    console.log(`[SUCCESS] Успешное подключение к БД MySQL🌐`); // Логируем успешное подключение
});



// Обработчик для проверки наличия логина в базе данных
app.post('/api/check-login', async (req, res) => {
    const { login } = req.body; // Извлекаем логин из тела запроса

    try {
        const sql = 'SELECT * FROM users WHERE login = ?'; // SQL-запрос для поиска пользователя по логину
        db.query(sql, [login], (err, results) => { // Выполняем запрос к базе данных
            if (err) { // Если произошла ошибка при выполнении запроса
                console.error(err); // Логируем ошибку
                return res.status(500).json({ success: false, message: 'Ошибка сервера.' }); // Возвращаем ошибку клиенту
            }
            res.json({ exists: results.length > 0 }); // Если результат не пуст, значит логин уже существует
        });
    } catch (error) { // Обработка ошибок
        console.error('[ERROR]', error); // Логируем ошибку
        res.status(500).json({ success: false, message: 'Ошибка сервера.' }); // Возвращаем ошибку серверу
    }
});

// Обработчик для проверки наличия email в базе данных
app.post('/api/check-email', async (req, res) => {
    const { email } = req.body; // Извлекаем email из тела запроса

    try {
        const sql = 'SELECT * FROM users WHERE email = ?'; // SQL-запрос для поиска пользователя по email
        db.query(sql, [email], (err, results) => { // Выполняем запрос к базе данных
            if (err) { // Если произошла ошибка при выполнении запроса
                console.error(err); // Логируем ошибку
                return res.status(500).json({ success: false, message: 'Ошибка сервера.' }); // Возвращаем ошибку клиенту
            }
            res.json({ exists: results.length > 0 }); // Если результат не пуст, значит email уже существует
        });
    } catch (error) { // Обработка ошибок
        console.error('[ERROR]', error); // Логируем ошибку
        res.status(500).json({ success: false, message: 'Ошибка сервера.' }); // Возвращаем ошибку серверу
    }
});

// Обработчик для проверки статуса авторизации
app.get('/api/check-auth', (req, res) => {
    if (req.session.user) { // Если в сессии есть данные о пользователе (пользователь авторизован)
        res.json({ success: true }); // Возвращаем успешный статус
    } else { // Если сессия не содержит данных о пользователе
        res.status(401).json({ success: false }); // Возвращаем статус 401 (не авторизован)
    }
});



// Обработчик для получения данных пользователя
app.get('/api/get/user', (req, res) => {
    if (!req.session.user) { // Проверка, авторизован ли пользователь (проверка на наличие сессионных данных)
        console.log('[ERROR] Пользователь не авторизирован.');  // Логирование ошибки
        return res.status(401).json({ success: false });  // Ответ с ошибкой 401 (не авторизован)
    }

    const userId = req.session.user.id; // Получаем ID пользователя из сессии

    const sql = 'SELECT email, name, surname, gender, city, phone, dob FROM users WHERE id = ?'; // SQL-запрос для получения личных данных пользователя
    const sql2 = 'SELECT is_organizer, is_admin FROM users_permissions WHERE user_id = ?'; // SQL-запрос для получения прав доступа пользователя (организатор, администратор)

    db.query(sql, [userId], (err, results) => { // Выполнение первого запроса к базе данных (личные данные)
        if (err) { // Обработка ошибки, если запрос не удался
            console.error(err);   // Логирование ошибки
            return res.status(500).json({ success: false, message: 'Ошибка получения данных пользователя.' }); // Ответ с ошибкой 500 (ошибка на сервере)
        }

        if (results.length === 0) { // Если пользователь не найден в базе данных
            console.log('[ERROR] Пользователь не найден.'); // Логирование ошибки
            return res.status(404).json({ success: false }); // Ответ с ошибкой 404 (не найден)
        }

        db.query(sql2, [userId], (err, results2) => { // Выполнение второго запроса к базе данных (права доступа)
            if (err) { // Обработка ошибки, если второй запрос не удался
                console.error(err); // Логирование ошибки
                return res.status(500).json({ success: false, message: 'Ошибка получения данных пользователя (права).' }); // Ответ с ошибкой 500
            }

            if (results2.length === 0) { // Если права доступа пользователя не найдены в базе данных
                console.log('[ERROR] Пользователь не найден (права).'); // Логирование ошибки
                return res.status(404).json({ success: false }); // Ответ с ошибкой 404
            }

            const { email, name, surname, gender, city, phone, dob } = results[0]; // Извлекаем личные данные пользователя из первого запроса
            const { is_organizer, is_admin } = results2[0]; // Извлекаем данные прав пользователя из второго запроса

            res.json({ success: true, userId, email, name, surname, gender, city, phone, dob, is_organizer, is_admin }); // Отправляем успешный ответ с данными пользователя

            // Логирование успешного запроса
            // console.log('[SUCCESS|GET] Пользователь получен: \n{', '\nID:', userId, '\nEMAIL:', email, '\nNAME:', name, '\nSURNAME:', surname, '\nGENDER:', gender, '\nCITY:', city, '\nPHONE:', phone, '\nDOB:', dob, '\nORGANIZER:', is_organizer, '\nADMIN:', is_admin, '\n}');
        });
    });
});

// Обработчик для получения ID пользователя
app.post('/api/user/get/id', (req, res) => {
    const userId = req.session.user.id; // Извлекаем ID пользователя из сессии

    if (!userId) { // Проверяем, есть ли ID пользователя в сессии
        return res.status(401).json({ success: false, message: "Пользователь не авторизован." }); // Если нет, отправляем ошибку 401 (не авторизован)
    }
    res.json({ success: true, userId }); // Отправляем успешный ответ с ID пользователя
});

// Обработчик для получения личных данных пользователя (имя и фамилия)
app.post('/api/user/get/personal', (req, res) => {
    const { userId } = req.body; // Извлекаем userId из тела запроса

    
    if (!userId) { // Проверяем, указан ли userId в запросе
        return res.status(400).json({ success: false, message: 'Не указан ID пользователя.' }); // Если ID не указан, отправляем ошибку 400 (неверный запрос)
    }

    
    db.query('SELECT name, surname FROM users WHERE id = ?', [userId], (error, results) => { // Выполняем запрос к базе данных для получения имени и фамилии пользователя
        if (error) { // Обрабатываем ошибку запроса
            console.error('Ошибка запроса к базе данных:', error); // Логирование ошибки
            return res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера.' }); // Ответ с ошибкой 500 (ошибка сервера)
        }

        if (results.length === 0) { // Если пользователь не найден
            return res.status(404).json({ success: false, message: 'Пользователь не найден.' }); // Ответ с ошибкой 404 (не найден)
        }

        const { name, surname } = results[0]; // Извлекаем имя и фамилию пользователя из результата запроса
        res.json({ success: true,  data: { name: name, surname: surname } }); // Отправляем успешный ответ с данными пользователя
    });
});

// Обработчик для получения города пользователя
app.post('/api/user/get/city', (req, res) => {
    const userId = req.session.user.id; // Извлекаем ID пользователя из сессии

    if (!userId) { // Если ID пользователя нет в сессии
        return res.status(401).json({ success: false, message: "Пользователь не авторизован." }); // Ответ с ошибкой 401 (не авторизован)
    }

    const sql = `SELECT city FROM users WHERE id = ?`; // SQL-запрос для получения города пользователя

    db.query(sql, [userId], (err, results) => { // Выполняем запрос к базе данных для получения города пользователя
        if (err) { // Обработка ошибки запроса
            console.error('Ошибка при получении города пользователя:', err); // Логирование ошибки
            return res.status(500).json({ success: false, message: "Ошибка при запросе к базе данных." }); // Ответ с ошибкой 500 (ошибка сервера)
        }

        if (results.length === 0) { // Если пользователь не найден
            return res.status(404).json({ success: false, message: "Пользователь не найден." }); // Ответ с ошибкой 404
        }

        res.json({ success: true, city: results[0].city }); // Отправляем успешный ответ с городом пользователя
    });
});

// Обработчик для получения статистики пользователя (любимые, лайки, созданные события
app.get('/api/user/get/statistic', (req, res) => {
    const userId = req.session.user.id; // Извлекаем ID пользователя из сессии

    if (!userId) { // Если ID пользователя нет в сессии
        return res.status(401).json({ success: false, message: "Пользователь не авторизован." }); // Ответ с ошибкой 401 (не авторизован)
    }

    // SQL-запросы для подсчета разных данных
    const getFavoriteCountSql = `SELECT COUNT(*) AS countFav FROM favorites WHERE user_id = ?`; // Подсчет количества избранных
    const getLikeCountSql = `SELECT COUNT(*) AS countLike FROM likes WHERE user_id = ?`; // Подсчет количества лайков
    const getEventCountSql = `SELECT COUNT(*) AS countEvent FROM events WHERE created_by = ?`; // Подсчет количества созданных событий

    // Выполнение всех запросов параллельно
    db.query(getFavoriteCountSql, [userId], (err, favoriteResults) => {
        if (err) { // Обработка ошибки при подсчете количества избранных
            console.error('Ошибка при подсчете в favorites:', err); // Логирование ошибки
            return res.status(500).json({ success: false, message: "Ошибка при запросе к базе данных." }); // Ответ с ошибкой 500
        }

        db.query(getLikeCountSql, [userId], (err, likeResults) => {
            if (err) { // Обработка ошибки при подсчете лайков
            console.error('Ошибка при подсчете в likes:', err); // Логирование ошибки
            return res.status(500).json({ success: false, message: "Ошибка при запросе к базе данных." }); // Ответ с ошибкой 500
            }

            db.query(getEventCountSql, [userId], (err, eventResults) => {
                if (err) { // Обработка ошибки при подсчете событий
                    console.error('Ошибка при подсчете в events:', err); // Логирование ошибки
                    return res.status(500).json({ success: false, message: "Ошибка при запросе к базе данных." }); // Ответ с ошибкой 500
                }

                res.json({ success: true, favoriteCount: favoriteResults[0].countFav, likeCount: likeResults[0].countLike, eventCount: eventResults[0].countEvent }); // Формируем успешный ответ с подсчитанными данными
            });
        });
    });
});

// Обработчик для получения информации о последнем изменении определенного поля пользователя
app.post('/api/get/user/changed', (req, res) => {
    if (!req.session.user) { // Проверяем, авторизован ли пользователь
        console.log('[ERROR] Пользователь не авторизирован.'); // Логируем ошибку
        return res.status(401).json({ success: false }); // Возвращаем ошибку авторизации
    }

    const { changed } = req.body;  // Извлекаем название изменяемого поля
    const userId = req.session.user.id; // Получаем ID пользователя из сессии

    const sql = 'SELECT changed_at FROM users_changes WHERE user_id = ? AND changed = ? ORDER BY changed_at DESC LIMIT 1'; // Запрос к базе данных для получения времени последнего изменения указанного поля

    db.query(sql, [userId, changed], (err, results) => { // Выполняем запрос к базе данных для получения последнего изменения определенного поля пользователя
        if (err) { // Обработка ошибки запроса
            console.error(err); // Логируем ошибку
            return res.status(500).json({ success: false, message: 'Ошибка получения данных пользователя.' }); // Ответ с ошибкой 500
        }

        if (results.length === 0) { // Если нет результатов, значит изменения для этого поля отсутствуют
            return res.json({ success: false, message: 'Нет изменений для данного поля.' }); // Возвращаем информацию
        }

        const changedAt = new Date(results[0].changed_at); // Получаем время последнего изменения

        // Форматируем дату и время в читабельный вид
        const day = String(changedAt.getDate()).padStart(2, '0');
        const month = String(changedAt.getMonth() + 1).padStart(2, '0');
        const year = changedAt.getFullYear();
        const hours = String(changedAt.getHours()).padStart(2, '0');
        const minutes = String(changedAt.getMinutes()).padStart(2, '0');
        
        const formattedDate = `${day}.${month}.${year} в ${hours}:${minutes}`; // Формируем строку с датой и временем

        res.json({ success: true, changed_at: formattedDate }); // Отправка ответа с датой последнего изменения
    });
});

// Обработчик для изменения персональных данных пользователя
app.post('/api/user/change/personal', (req, res) => {
    const { name, surname, gender, city, dob } = req.body; // Получаем данные для изменения
    const userId = req.session.user.id; // Получаем ID пользователя из сессии

    // Создаем объект для хранения данных для обновления
    const fieldsToUpdate = {};
    if (name) fieldsToUpdate.name = name; // Если новое имя, добавляем его
    if (surname) fieldsToUpdate.surname = surname; // Если новая фамилия, добавляем ее
    if (gender) fieldsToUpdate.gender = gender; // Если новый пол, добавляем его
    if (city) fieldsToUpdate.city = city; // Если новый город, добавляем его
    if (dob) fieldsToUpdate.dob = dob; // Если новая дата рождения, добавляем ее

    if (Object.keys(fieldsToUpdate).length === 0) { // Если нет данных для обновления, возвращаем ошибку
        return res.json({ success: false, message: "Нет данных для обновления." }); // Отправка ответа с ошибкой
    }

    const fields = Object.keys(fieldsToUpdate).map(field => `${field} = ?`).join(', '); // Формируем строку для SQL-запроса
    const values = Object.values(fieldsToUpdate); // Массив значений для подстановки в запрос
    values.push(userId); // Добавляем ID пользователя в конец массива

    const sqlSelectOldValues = 'SELECT name, surname, gender, city, DATE_FORMAT(dob, "%d.%m.%Y") as dob FROM users WHERE id = ?'; // SQL-запрос для получения старых данных пользователя

    db.query(sqlSelectOldValues, [userId], (err, result) => { // Выполняем запрос в базу данных для получения старых данных пользователя
        if (err) { // Обработка ошибки при извлечении старых данных
            console.error('[ERROR] Ошибка при извлечении старых данных:', err); // Логируем ошибку
            return res.status(500).json({ success: false, message: "Ошибка при извлечении старых данных." }); // Отправка ошибки
        }

        if (result.length === 0) { // Если пользователь не найден
            return res.status(404).json({ success: false, message: "Пользователь не найден." });  // Ответ с ошибкой 404
        }

        const oldValues = result[0]; // Получаем старые значения данных пользователя

        const sqlUpdate = `UPDATE users SET ${fields} WHERE id = ?`; // Формируем SQL-запрос для обновления данных

        db.query(sqlUpdate, values, (err, updateResult) => { // Выполняем запрос в базу данных для обновления данных пользователя
            if (err) { // Обработка ошибки при обновлении данных
                console.error('[ERROR] Ошибка при обновлении персональных данных:', err); // Логируем ошибку
                return res.status(500).json({ success: false, message: "Ошибка при обновлении данных." }); // Ответ с ошибкой 500
            }

            if (updateResult.affectedRows === 0) { // Если ничего не было обновлено
                return res.status(404).json({ success: false, message: "Пользователь не найден." }); // Ответ с ошибкой 404
            }

            const changes = []; // Составляем список изменений
            const currentTime = new Date().toISOString(); // Текущее время для записи изменений

            Object.keys(fieldsToUpdate).forEach(field => { // Перебираем все поля и проверяем, какие были изменены
                const oldValue = oldValues[field]; // Старое значение
                let newValue = fieldsToUpdate[field]; // Новое значение

                if (field === 'dob') { // Если поле - дата рождения, форматируем ее
                    const formatDate = date => {
                        const [year, month, day] = date.split('-');
                        return `${day}.${month}.${year}`;
                    };
                    newValue = formatDate(newValue); // Преобразуем формат даты
                }

                if (oldValue !== newValue) { // Если значение изменилось, добавляем запись о изменении
                    changes.push({
                        user_id: userId,
                        changed: field,
                        changed_at: currentTime,
                        old_value: oldValue,
                        new_value: newValue
                    });
                }
            });

            if (changes.length > 0) { // Если есть изменения, сохраняем их в базу данных
                const sqlInsertChanges = `INSERT INTO users_changes (user_id, changed, changed_at, old_value, new_value) VALUES (?, ?, ?, ?, ?)`; // Формируем SQL-запрос для записи изменения данных пользователя
                changes.forEach(change => { // Для каждого изменения выполняем запрос на вставку в базу данных
                    db.query(sqlInsertChanges, [change.user_id, change.changed, change.changed_at, change.old_value, change.new_value], (err, insertResult) => { // Выполняем запрос в базу данных для записи изменения данных пользователя
                        if (err) { // Обработка ошибки при записи изменения данных
                            console.error('[ERROR] Ошибка при добавлении записи об изменении:', err); // Логируем ошибку
                        }
                    });
                });
            }

            console.log('[SUCCESS|CHANGE] Данные пользователя { id:', userId, '} были изменены.'); // Логирование успеха
            res.json({ success: true, message: "Личные данные были обновлены." }); // Ответ пользователю о том, что данные были обновлены
        });
    });
});

// Обработчик для изменения пароля пользователя
app.post('/api/user/change/password', async (req, res) => {
    const { passwordOld, passwordNew } = req.body; // Извлекаем старый и новый пароль из тела запроса
    const userId = req.session.user?.id; // Получаем ID пользователя из сессии

    if (!userId) { // Проверка на наличие авторизованного пользователя
        return res.status(401).json({ success: false, message: "Пользователь не авторизован." }); // Ответ с ошибкой 401 (не авторизован)
    }

    if (!passwordOld || !passwordNew) { // Проверка на наличие старого и нового пароля в запросе
        return res.status(400).json({ success: false, message: "Пожалуйста, заполните все поля." }); // Ответ с ошибкой 400
    }

    const sqlGetPassword = 'SELECT password FROM users WHERE id = ?'; // SQL-запрос для получения текущего пароля пользователя
    const sqlUpdatePassword = 'UPDATE users SET password = ? WHERE id = ?'; // SQL-запрос для обновления пароля пользователя
    const sqlInsertChange = `INSERT INTO users_changes (user_id, changed, old_value, new_value) VALUES (?, ?, ?, ?)`; // SQL-запрос для записи изменения пароля в историю

    try { 
        const [userResults] = await db.promise().query(sqlGetPassword, [userId]); // Выполняем запрос для получения текущего пароля пользователя

        if (userResults.length === 0) { // Если пользователь не найден, возвращаем ошибку
            return res.status(404).json({ success: false, message: "Пользователь не найден." }); // Ответ с ошибкой 404 (не найден)
        }

        const userPasswordHash = userResults[0].password; // Получаем захешированный пароль пользователя из результата запроса

        const isMatch = await bcrypt.compare(passwordOld, userPasswordHash); // Сравниваем старый пароль с тем, что хранится в базе данных
        if (!isMatch) { // Если старый пароль неверный, возвращаем ошибку
            return res.status(400).json({ success: false, message: "Неверный пароль!" }); // Ответ с ошибкой 400
        }

        if (typeof passwordNew !== 'string' || passwordNew.trim() === '') { // Проверка на валидность нового пароля (не пустой)
            return res.status(400).json({ success: false, message: "Новый пароль не может быть пустым." }); // Ответ с ошибкой 400
        }

        const newHashedPassword = await bcrypt.hash(passwordNew, 10); // Хешируем новый пароль

        const [updateResult] = await db.promise().query(sqlUpdatePassword, [newHashedPassword, userId]); // Выполняем запрос для обновления пароля в базе данных

        if (updateResult.affectedRows === 0) { // Если пароль не был обновлен, возвращаем ошибку
            return res.status(500).json({ success: false, message: "Не удалось обновить пароль." }); // Ответ с ошибкой 500
        }

        // Записываем изменения в таблицу истории изменений
        const changed = 'password'; // Указываем, что изменился пароль
        const oldPasswordMasked = '********'; // Старый пароль маскируем для безопасности
        await db.promise().query(sqlInsertChange, [userId, changed, oldPasswordMasked, newHashedPassword]); // Выполняем запрос для записи изменения пароля в базе данных

        console.log(`[SUCCESS|CHANGE] Пароль пользователя { id: ${userId} } был обновлен.`); // Логируем успешное изменение пароля
        res.json({ success: true, message: "Пароль успешно изменен!" }); // Отправляем успешный ответ клиенту 
    } catch (error) {
        console.error('Ошибка при изменении пароля:', error);  // Логируем ошибку, если произошла ошибка в процессе изменения пароля
        res.status(500).json({ success: false, message: "Ошибка сервера. Попробуйте позже." }); // Отправляем ошибку сервера в случае проблемы
    }
});

// Обработчик для изменения номера телефона пользователя
app.post('/api/user/change/phone', async (req, res) => {
    const { phoneValue } = req.body; // Извлекаем новый номер телефона из тела запроса
    const userId = req.session.user.id; // Получаем ID пользователя из сессии

    if (!userId) { // Проверка на наличие авторизованного пользователя
        return res.status(400).json({ success: false, message: "Пользователь не авторизован." }); // Ответ с ошибкой 401 (не авторизован)
    }

    if (!phoneValue || phoneValue.trim() === '') { // Проверка на наличие нового номера телефона в запросе
        return res.status(400).json({ success: false, message: "Пожалуйста, введите новый номер телефона." }); // Ответ с ошибкой 400
    }

    const sqlUpdatePhone = 'UPDATE users SET phone = ? WHERE id = ?'; // SQL-запрос для обновления номера телефона
    const sqlInsertChange = `INSERT INTO users_changes (user_id, changed, old_value, new_value) VALUES (?, ?, ?, ?)`; // SQL-запрос для записи изменения номера телефона

    try {
        const [userResults] = await db.promise().query('SELECT phone FROM users WHERE id = ?', [userId]); // Выполняем запрос для получения текущего номера телефона пользователя

        if (userResults.length === 0) { // Если пользователь не найден, возвращаем ошибку
            return res.status(404).json({ success: false, message: "Пользователь не найден." }); // Ответ с ошибкой 404 (не найден)
        }

        let oldPhone = userResults[0].phone || 'не указан'; // Получаем старый номер телефона или указываем, что он не был указан

        const [updateResult] = await db.promise().query(sqlUpdatePhone, [phoneValue, userId]); // Выполняем запрос для обновления номера телефона в базе данных

        if (updateResult.affectedRows === 0) {  // Если номер телефона не был обновлен, возвращаем ошибку
            return res.status(500).json({ success: false, message: "Не удалось обновить номер телефона." }); // Ответ с ошибкой 500
        }

        // Записываем изменения в таблицу истории изменений
        const changed = 'phone'; // Указываем, что изменился номер телефона
        await db.promise().query(sqlInsertChange, [userId, changed, oldPhone, phoneValue]); // Выполняем запрос для записи изменения номера телефона в базе данных

        console.log(`[SUCCESS|CHANGE] Номер телефона пользователя { id: ${userId} } был обновлен.`); // Логируем успешное изменение номера телефона
        res.json({ success: true, message: "Номер телефона успешно изменен!" }); // Отправляем успешный ответ клиенту        
    } catch (error) {
        console.error('Ошибка при изменении номера телефона:', error); // Логируем ошибку, если произошла ошибка в процессе изменения номера телефона
        res.status(500).json({ success: false, message: "Ошибка сервера. Попробуйте позже." }); // Отправляем ошибку сервера в случае проблемы
    }
});

// Обработчик для изменения почтового адреса пользователя
app.post('/api/user/change/email', async (req, res) => {
    const { emailNew } = req.body; // Извлекаем новый email из тела запроса
    const userId = req.session.user.id; // Получаем ID пользователя из сессии

    if (!userId) { // Проверка на наличие авторизованного пользователя
        return res.status(400).json({ success: false, message: "Пользователь не авторизован." }); // Ответ с ошибкой 401 (не авторизован)
    }

    const sqlUpdateEmail = 'UPDATE users SET email = ? WHERE id = ?'; // SQL-запрос для обновления email пользователя
    const sqlInsertChange = `INSERT INTO users_changes (user_id, changed, old_value, new_value) VALUES (?, ?, ?, ?)`; // SQL-запрос для записи изменения почты

    try {
        const [userResults] = await db.promise().query('SELECT email FROM users WHERE id = ?', [userId]);  // Выполняем запрос для получения текущего email пользователя

        if (userResults.length === 0) { // Если пользователь не найден, возвращаем ошибку
            return res.status(404).json({ success: false, message: "Пользователь не найден." }); // Ответ с ошибкой 404 (не найден)
        }

        let oldEmail = userResults[0].email; // Получаем старый email пользователя

        const [updateResult] = await db.promise().query(sqlUpdateEmail, [emailNew, userId]); // Выполняем запрос для обновления email в базе данных

        if (updateResult.affectedRows === 0) { // Если email не был обновлен, возвращаем ошибку
            return res.status(500).json({ success: false, message: "Не удалось обновить почту." }); // Ответ с ошибкой 500
        }

        // Записываем изменения в таблицу истории изменений
        const changed = 'email';  // Указываем, что изменился email
        await db.promise().query(sqlInsertChange, [userId, changed, oldEmail, emailNew]); // Выполняем запрос для записи изменения email в базе данных

        console.log(`[SUCCESS|CHANGE] Почта пользователя { id: ${userId} } была обновлена.`); // Логируем успешное изменение email
        res.json({ success: true, message: "Почта успешно изменена!" }); // Отправляем успешный ответ клиент        
    } catch (error) {
        console.error('Ошибка при изменении почты:', error); // Логируем ошибку, если произошла ошибка в процессе изменения email
        res.status(500).json({ success: false, message: "Ошибка сервера. Попробуйте позже." }); // Отправляем ошибку сервера в случае проблемы
    }
});

// Обработчик для удаления пользователя
app.post('/api/user/delete', (req, res) => {
    const userId = req.session.user.id; // Получаем ID пользователя из сессии
    const last = req.session.user; // Сохраняем все данные пользователя до его удаления (используется в журнале изменений)

    const sqlDeleteUser = 'DELETE FROM users WHERE id = ?'; // SQL-запрос для удаления пользователя
    const sqlDeletePermissions = 'DELETE FROM users_permissions WHERE user_id = ?'; // SQL-запрос для удаления разрешений пользователя
    const sqlInsertChange = `INSERT INTO users_changes (user_id, changed, old_value, new_value) VALUES (?, ?, ?, ?)`; // SQL-запрос для записи изменения в журнал изменений

    db.query(sqlDeleteUser, [userId], (err, result) => { // Выполняем запрос для удаления пользователя из базы данных
        if (err) { // Если произошла ошибка при удалении пользователя
            console.error('Ошибка при удалении пользователя:', err); // Логируем ошибку
            return res.status(500).json({ success: false, message: "Ошибка при удалении пользователя." }); // Ответ с ошибкой 500
        }

        if (result.affectedRows === 0) { // Если пользователь не найден в базе данных
            return res.status(404).json({ success: false, message: "Пользователь не найден." }); // Ответ с ошибкой 404 (не найден)
        }

        db.query(sqlDeletePermissions, [userId], (err, result) => { // Выполняем запрос для удаления разрешений пользователя
            if (err) { // Если произошла ошибка при удалении разрешений пользователя
                console.error('Ошибка при удалении разрешений пользователя:', err); // Логируем ошибку
                return res.status(500).json({ success: false, message: "Ошибка при удалении разрешений пользователя." }); // Ответ с ошибкой 500
            }

            const changed = 'delete'; // Указываем, что произошло удаление пользователя

            db.query(sqlInsertChange, [userId, changed, JSON.stringify(last), "Удалён"], (err, result) => { // Записываем изменения в журнал изменений: данные старого пользователя, старое значение и новое (удалён)
                if (err) { // Если произошла ошибка при записи в журнал изменений
                    console.error('Ошибка при записи в журнал изменений:', err); // Логируем ошибку
                    return res.status(500).json({ success: false, message: "Пользователь удалён, но произошла ошибка при записи в журнал изменений." }); // Ответ с ошибкой 500
                }

                req.session.destroy((err) => { // Очищаем сессию пользователя
                    if (err) { // Если произошла ошибка при очистке сессии
                        console.error('Ошибка при очистке сессии:', err); // Логируем ошибку
                        return res.status(500).json({ success: false, message: "Пользователь удалён, но ошибка при очистке сессии." }); // Ответ с ошибкой 500
                    }
                    console.log('[SUCCESS|DELETE] Пользователь session: {', last, '} был удалён.'); // Логируем успешное удаление пользователя
                    res.json({ success: true }); // Успешный ответ о том, что пользователь был удалён                    
                });
            });
        });
    });
});



// Обработчик для создания нового события
app.post('/api/event/create', upload.single('image'), (req, res) => {
    const { title, description, category, subcategory, date, time, city, building, url, price } = req.body; // Извлекаем данные из тела запроса
    const imagePath = req.file ? req.file.path : null; // Получаем путь к загруженному изображению (если оно было отправлено)
    const userId = req.session.user.id; // Получаем идентификатор текущего пользователя из сессии

    const permissionQuery = 'SELECT is_admin FROM users_permissions WHERE user_id = ?'; // SQL-запрос для проверки прав пользователя

    db.query(permissionQuery, [userId], (err, results) => { // Выполняем запрос для проверки прав текущего пользователя
        if (err) { // Если произошла ошибка при проверке прав
            return res.status(500).json({ success: false, message: 'Ошибка проверки прав пользователя: ' + err.message }); // Ответ с ошибкой 500
        }

        if (results.length === 0) { // Если прав пользователя не найдено, возвращаем соответствующий ответ
            return res.status(404).json({ success: false, message: 'Права пользователя не найдены.' }); // Ответ с ошибкой 404 (не найдено)
        }

        const isAdmin = results[0].is_admin === 1; // Проверяем, является ли пользователь администратором
        const status = isAdmin ? 'public' : 'checking'; // Если администратор, событие сразу публикуется, иначе будет в статусе проверки

        const query = `INSERT INTO events (created_by, title, description, category, subcategory, image, date, time, city, building, price, url, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`; // SQL-запрос для добавления нового события в базу данных

        db.query(query, [userId, title, description, category, subcategory, imagePath, date, time, city, building, price, url, status], (err, result) => { // Выполняем запрос на добавление события
            if (err) { // Обрабатываем ошибку добавления события
                res.json({ success: false, message: 'Ошибка при добавлении поста: ' + err.message }); // Ответ с ошибкой
            } else { // Успешное добавление события
                res.json({ success: true }); // Удачный ответ
            }
        });
    });
});

// Обработчик для обновления статуса события
app.post('/api/event/status/update', async (req, res) => {
    const { eventId, status, changedBy } = req.body; // Извлечение данных из тела запроса
    const userId = req.session.user?.id; // Получение ID текущего пользователя из сессии

    const isSystemChange = changedBy !== null; // Проверка, является ли изменение системным (если `changedBy` задан, значит это системное изменение)

    if (!isSystemChange) { // Если изменение не системное, проверяем права пользователя
        if (!userId) { // Проверка авторизации
            return res.status(401).json({ success: false, message: 'Необходима авторизация' }); // Ответ с ошибкой 401 (не авторизован)
        }

        db.query('SELECT is_admin FROM users_permissions WHERE user_id = ?', [userId], (err, results) => { // Выполняем запрос для проверки, является ли пользователь администратором
            if (err) { // Если произошла ошибка при проверке прав
                console.error('Ошибка при проверке админских прав:', err); // Логируем ошибку
                return res.status(500).json({ success: false, message: 'Ошибка на сервере' }); // Ответ с ошибкой 500
            }

            const isAdmin = results[0].is_admin === 1; // Определяем, является ли пользователь администратором

            db.query('SELECT * FROM events WHERE id = ?', [eventId], (err, rows) => { // Выполняем запрос для проверки существования события
                if (err) { // Если произошла ошибка при запросе события
                    console.error('Ошибка при запросе поста:', err); // Логируем ошибку
                    return res.status(500).json({ success: false, message: 'Ошибка на сервере' }); // Ответ с ошибкой 500
                }

                if (rows.length === 0) { // Если событие с указанным ID не найдено
                    return res.status(404).json({ success: false, message: 'Пост не найден' }); // Ответ с ошибкой 404 (не найдено)
                }

                if (!isAdmin && rows[0].created_by !== userId) { // Проверяем права на изменение события, если пользователь не администратор и не является создателем события
                    return res.status(403).json({ success: false, message: 'Вы не можете изменить этот пост!' }); // Ответ с ошибкой 403
                }

                db.query('SELECT name, surname FROM users WHERE id = ?', [userId], (err, userRows) => { // Выполняем запрос на получение имени и фамилии пользователя, чтобы записать информацию об изменении
                    if (err) { // Если произошла ошибка при запросе данных пользователя
                        console.error('Ошибка при запросе пользователя:', err); // Логируем ошибку
                        return res.status(500).json({ success: false, message: 'Ошибка на сервере' }); // Ответ с ошибкой 500
                    }

                    if (userRows.length === 0) { // Если пользователь не найден
                        return res.status(404).json({ success: false, message: 'Пользователь не найден' }); // Ответ с ошибкой 404 (не найдено)
                    }

                    const { name, surname } = userRows[0]; // Извлекаем имя и фамилию пользователя
                    const changedBy = `${name} ${surname}(ID${userId})`; // Формируем строку "Имя Фамилия(ID)"

                    db.query('UPDATE events SET status = ?, changed_by = ?, changed_time = NOW() WHERE id = ?', [status, changedBy, eventId], (err) => { // Выполняем запрос для обновления статуса события
                        if (err) { // Если произошла ошибка при обновлении статуса
                            console.error('Ошибка при обновлении статуса:', err); // Логируем ошибку
                            return res.status(500).json({ success: false, message: 'Ошибка на сервере' }); // Ответ с ошибкой 500
                        }
                        return res.json({ success: true, message: 'Статус мероприятия успешно обновлен!' }); // Ответ об успехе
                    });
                });
            });
        });
    } else {
        db.query('SELECT * FROM events WHERE id = ?', [eventId], (err, rows) => { // Выполняем запрос, если изменение выполняется системой
            if (err) { // Если произошла ошибка при запросе события
                console.error('Ошибка при запросе поста:', err); // Логируем ошибку
                return res.status(500).json({ success: false, message: 'Ошибка на сервере' }); // Ответ с ошибкой 500
            }

            if (rows.length === 0) { // Если событие не найдено
                return res.status(404).json({ success: false, message: 'Пост не найден' }); // Ответ с ошибкой 404 (не найдено)
            }

            db.query('UPDATE events SET status = ?, changed_by = ?, changed_time = NOW() WHERE id = ?', [status, changedBy, eventId], (err) => { // Выполняем запрос для обновления статуса события
                if (err) { // Если произошла ошибка при обновлении
                    console.error('Ошибка при обновлении статуса:', err); // Логируем ошибку 
                    return res.status(500).json({ success: false, message: 'Ошибка на сервере' }); // Ответ с ошибкой 500
                }
                return res.json({ success: true, message: 'Статус поста успешно обновлен!' }); // Отправляем ответ об успешном обновлении статуса
            });
        });
    }
});

// Обработчик для получения всех событий
app.get('/api/event/get/all', (req, res) => {
    const sql = `SELECT id, title, description, category, subcategory, image, date, time, city, status, changed_by, changed_time FROM events`; // SQL-запрос для выбора всех необходимых данных из таблицы

    db.query(sql, (err, results) => { // Выполняем запрос для получения данных
        if (err) { // Если произошла ошибка при выполнении запроса
            return res.status(500).json({ success: false, message: 'Ошибка при получении мероприятий.' }); // Ответ с ошибкой 500
        }

        res.json({ success: true, events: results }); // Отправляем клиенту ответ с успешным статусом и данными мероприятий, в случае успеха
    });
});

// Обработчик для получения списка избранных событий пользователя
app.get('/api/event/get/favorites', (req, res) => {
    const sqlFavorites = `SELECT post_id FROM favorites WHERE user_id = ?`; // SQL-запрос для получения ID избранных постов текущего пользователя

    userId = req.session.user.id;  // Извлекаем ID пользователя из сессии

    if (!userId) { // Если пользователь не авторизован
        return res.status(401).json({ success: false, message: 'Пользователь не авторизирован' }); // Ответ с ошибкой 401 (не авторизирован)
    }

    db.query(sqlFavorites, [userId], (err, favoriteResults) => { // Выполняем запрос к базе данных для получения списка избранных постов
        if (err) { // Если произошла ошибка при выполнении запроса
            console.error('Ошибка выполнения запроса sqlFavorites:', err); // Логируем ошибку
            return res.status(500).json({ success: false, message: 'Ошибка сервера' }); // Ответ с ошибкой 500
        }

        if (favoriteResults.length === 0) { // Если у пользователя нет избранных событий
            return res.status(200).json({ success: true, data: [] }); // Возвращаем пустой массив
        }

        const eventIds = favoriteResults.map(row => row.post_id); // Извлекаем ID событий из результата запроса

        const placeholders = eventIds.map(() => '?').join(','); // Генерируем плейсхолдеры для SQL-запроса вида `?, ?, ?`
        const sqlGetEvents = `SELECT id, title, description, category, subcategory, image, date, time, city, status FROM events WHERE id IN (${placeholders})`; // SQL-запрос для получения данных всех избранных событий

        db.query(sqlGetEvents, eventIds, (err, eventResults) => { // Выполняем запрос к базе данных для получения данных избранных событий
            if (err) { // Если произошла ошибка при выполнении запроса
                console.error('Ошибка выполнения запроса sqlEvents:', err); // Логируем ошибку
                return res.status(500).json({ success: false, message: 'Ошибка сервера' }); // Ответ с ошибкой 500
            }
            res.status(200).json({ success: true, eventsFav: eventResults }); // Если данные успешно получены, возвращаем их клиенту
        });
    });
});

// Обработчик для получения событий по категории
app.get('/api/event/get/by-category', (req, res) => {
    const { category } = req.query; // Извлекаем параметр категории из строки запроса

    if (!category) { // Если параметр отсутствует
        return res.status(400).json({ success: false, message: 'Категория не указаны.' }); // Ответ с ошибкой 400
    }

    const sql = `SELECT * FROM events WHERE category = ?`; // SQL-запрос для выборки всех событий, принадлежащих указанной категории

    db.query(sql, [category], (err, results) => {  // Выполняем запрос с использованием переданного параметра категории
        if (err) { // Если произошла ошибка при выполнении запроса
            console.error('Ошибка при выполнении запроса:', err); // Логируем ошибку
            return res.status(500).json({ success: false, message: 'Ошибка при получении мероприятий.' }); // Ответ с ошибкой 500
        }

        if (results.length === 0) {  // Если запрос выполнен успешно, но результатов нет
            return res.status(404).json({ success: false, message: 'Мероприятия не найдены.' }); // Ответ с ошибкой 404 (не найдено)
        }

        res.json({ success: true, events: results }); // Если результаты найдены, возвращаем их
    });
});

// Обработчик для получения всех событий, созданных конкретным пользователем
app.get('/api/event/get', (req, res) => {
    const userId = req.query.userId; // Получаем идентификатор пользователя из параметров запроса

    if (!userId) { // Если идентификатор отсутствует
        return res.status(400).json({ success: false, message: 'Пользователь не авторизирован' }); // Ответ с ошибкой 400
    }

    const sql = `SELECT id, title, description, image, date, time, status FROM events WHERE created_by = ?`; // SQL-запрос для выборки событий, созданных указанным пользователем

    db.query(sql, [userId], (err, results) => { // Выполняем запрос к базе данных, подставляя идентификатор пользователя
        if (err) { // Если произошла ошибка при выполнении запроса
            return res.status(500).json({ success: false, message: 'Ошибка при получении мероприятий.' }); // Ответ с ошибкой 500
        }

        res.json({ success: true, events: results }); // Возвращаем найденные события
    });
});

// Обработчик для получения информации о конкретном мероприятии по его идентификатору
app.get('/api/event/get/:eventId', (req, res) => {
    const { eventId } = req.params; // Извлекаем параметр eventId из ссылки

    if (!eventId) {  // Если идентификатор не передан
        return res.status(400).json({ success: false, message: 'Идентификатор мероприятия не указан.' }); // Ответ с ошибкой 400
    }

    const sql = `SELECT * FROM events WHERE id = ?`; // SQL-запрос для выборки данных о мероприятии по его идентификатору

    db.query(sql, [eventId], (err, results) => {  // Выполняем запрос к базе данных, подставляя значение eventId
        if (err) { // Если произошла ошибка при выполнении запроса
            console.error('Ошибка при выполнении запроса:', err); // Логируем ошибку
            return res.status(500).json({ success: false, message: 'Ошибка при получении мероприятия.' }); // Ответ с ошибкой 500
        }

        if (results.length === 0) { // Если мероприятие не найдено
            return res.status(404).json({ success: false, message: 'Мероприятие не найдено.' }); // Ответ в ошибкой 404 (не найдено)
        }

        res.json({ success: true, event: results[0] }); // Если мероприятие найдено, возвращаем данные о нем
    });
});

// Обработчик для обновления информации о мероприятии
app.put('/api/event/update/:eventId', upload.single('image'), (req, res) => {
    const { eventId } = req.params; // Получение идентификатора события из параметров маршрута
    const { title, description, category, subcategory, date, time, city, building, url, price } = req.body; // Извлечение данных из тела запроса
    const imagePath = req.file ? req.file.path : null; // Проверка наличия файла изображения
    const userId = req.session.user?.id; // Получение идентификатора пользователя из сессии

    const missingFields = []; // Массив для хранения незаполненных полей

    // Проверяем каждое поле и добавляем его в массив, если оно не заполнено
    if (!eventId) missingFields.push('eventId');
    if (!title) missingFields.push('title');
    if (!description) missingFields.push('description');
    if (!category) missingFields.push('category');
    if (!date) missingFields.push('date');
    if (!time) missingFields.push('time');
    if (!city) missingFields.push('city');
    if (!building) missingFields.push('building');
    if (!url) missingFields.push('url');
    if (!price) missingFields.push('price');

    if (missingFields.length > 0) { // Если есть незаполненные поля, возвращаем ошибку с указанием этих полей
        return res.status(400).json({ success: false, message: `Не заполнены следующие поля: ${missingFields.join(', ')}.` }); // Ответ с ошибкой 400
    }

    if (!userId) { // Проверка авторизации пользователя
        return res.status(401).json({ success: false, message: 'Необходима авторизация' }); // Ответ с ошибкой 401 (не атворизирован)
    }

    
    db.query('SELECT * FROM events WHERE id = ?', [eventId], (err, rows) => { // Выполняем запрос для проверки существует ли событие
        if (err) { // Если произошла ошибка при выполнении запроса
            console.error('Ошибка при запросе события:', err); // Логируем ошибку
            return res.status(500).json({ success: false, message: 'Ошибка на сервере' }); // Ответ с ошибкой 500
        }

        if (rows.length === 0) { // Если событие не найдено
            return res.status(404).json({ success: false, message: 'Событие не найдено' }); // Ответ с ошибкой 404 (не найдено)
        }

        const event = rows[0]; // Получаем объект события из результата запроса

        if (event.created_by !== userId) { // Проверяем, имеет ли текущий пользователь право изменять это событие
            return res.status(403).json({ success: false, message: 'Вы не можете изменить это событие' }); // Если нет, возвращаем ошибку 403
        }

        db.query('SELECT name, surname FROM users WHERE id = ?', [userId], (err, userRows) => { // Выполняем запрос, получаем информацию о пользователе, который изменяет событие
            if (err) { // Если произошла ошибка при выполнении запроса
                console.error('Ошибка при запросе пользователя:', err); // Логируем ошибку
                return res.status(500).json({ success: false, message: 'Ошибка на сервере' }); // Ответ с ошибкой 500
            }

            if (userRows.length === 0) { // Если пользователь не найден
                return res.status(404).json({ success: false, message: 'Пользователь не найден' }); // Ответ с ошибкой 404 (не найдено)
            }

            const { name, surname } = userRows[0]; // Извлекаем имя и фамилию пользователя
            const changedBy = `${name} ${surname} (ID${userId})`; // Формируем строку для логирования изменений

            let sql = `UPDATE events SET title = ?, description = ?, category = ?, subcategory = ?,  date = ?, time = ?, city = ?, building = ?, url = ?, price = ?, changed_by = ?, changed_time = NOW()`; // Формируем SQL-запрос для обновления события
            const params = [title, description, category, subcategory, date, time, city, building, url, price, changedBy]; // Массив параметров для запроса

            if (imagePath) { // Если загружено новое изображение
                sql += `, image = ?`; // Добавляем поле для обновления изображения
                params.push(imagePath); // Добавляем путь изображения в массив параметров
            }

            sql += ` WHERE id = ?`; // Указываем условие обновления (по идентификатору события)
            params.push(eventId); // Добавляем идентификатор события в параметры

            db.query(sql, params, (err, results) => { // Выполняем запрос на обновление события
                if (err) { // Если произошла ошибка при выполнении запроса 
                    console.error('Ошибка при обновлении события:', err); // Логируем ошибку
                    return res.status(500).json({ success: false, message: 'Ошибка при обновлении события' }); // Ответ с ошибкой 500
                }

                if (results.affectedRows === 0) { // Если событие не было обновлено
                    return res.status(404).json({ success: false, message: 'Событие не найдено' }); // Ответ с ошибкой 404 (не найдено)
                }

                res.json({ success: true, message: 'Событие успешно обновлено' }); // Если обновление прошло успешно, возвращаем сообщение об успехе
            });
        });
    });
});

// Обработчик для лайка события
app.post('/api/event/like', (req, res) => {
    const { postId } = req.body; // Извлекаем идентификатор поста из тела запроса

    if (!req.session.user) { // Проверяем, авторизован ли пользователь
        return res.status(401).json({ success: false, message: 'Пользователь не авторизован.' }); // Если пользователь не авторизован, возвращаем ошибку 401 (не авторизирован)
    }

    const userId = req.session.user.id; // Получаем идентификатор пользователя из сессии

    const query = `INSERT INTO likes (user_id, post_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE liked_at = NOW()`; // SQL-запрос для добавления лайка
    // Если пользователь уже лайкнул пост, обновляем поле `liked_at` вместо добавления нового лайка

    db.query(query, [userId, postId], (err) => { // Выполняем запрос к базе данных
        if (err) { // Если произошла ошибка при выполнении запроса
            console.error('Ошибка при добавлении лайка:', err); // Логируем ошибку
            return res.status(500).json({ success: false, message: 'Ошибка сервера.' }); // Ответ с ошибкой 500
        }

        res.json({ success: true, message: 'Пост успешно лайкнут!' }); // Если запрос выполнен успешно, возвращаем успешный ответ
    });
});

// Обработчик для удаления лайка с события
app.post('/api/event/unlike', (req, res) => {
    const { postId } = req.body; // Извлекаем идентификатор поста из тела запроса

    if (!req.session.user) { // Проверяем, авторизован ли пользователь
        return res.status(401).json({ success: false, message: 'Пользователь не авторизован.' }); // Если пользователь не авторизован, возвращаем ошибку 401
    }

    const userId = req.session.user.id; // Получаем идентификатор пользователя из сессии

    const query = `DELETE FROM likes WHERE user_id = ? AND post_id = ?`; // SQL-запрос для удаления лайка

    db.query(query, [userId, postId], (err) => { // Выполняем запрос к базе данных
        if (err) { // Обрабатываем ошибки выполнения запроса
            console.error('Ошибка при удалении лайка:', err); // Логируем ошибку
            return res.status(500).json({ success: false, message: 'Ошибка сервера.' }); // Ответ с ошибкой 500
        }

        res.json({ success: true, message: 'Лайк успешно удалён!' }); // Если запрос выполнен успешно, возвращаем успешный ответ
    });
});

// Обработчик для проверки, поставил ли пользователь лайк определённому посту
app.get('/api/event/like/check/:postId', (req, res) => {
    if (!req.session.user) { // Проверяем, авторизован ли пользователь
        return res.status(401).json({ success: false, message: 'Пользователь не авторизован.' }); // Если пользователь не авторизован, возвращаем ошибку 401
    }

    const userId = req.session.user.id; // Получаем идентификатор пользователя из сессии
    const { postId } = req.params; // Извлекаем идентификатор поста из параметров ссылки

    const query = `SELECT COUNT(*) AS hasLiked FROM likes WHERE user_id = ? AND post_id = ?`; // SQL-запрос для проверки наличия лайка

    db.query(query, [userId, postId], (err, results) => { // Выполняем запрос к базе данных
        if (err) { // Обрабатываем ошибки выполнения запроса
            console.error('Ошибка при проверке лайка:', err); // Логируем ошибку
            return res.status(500).json({ success: false, message: 'Ошибка сервера.' }); // Ответ с ошибкой 500
        }

        res.json({ success: true, hasLiked: results[0].hasLiked > 0 }); // Если запрос выполнен успешно, возвращаем результат проверки
        // Проверяем, есть ли записи в таблице (лайк поставлен)
    });
});

// Обработчик для получения количества лайков на определённый пост
app.get('/api/event/like/get/:postId', (req, res) => {
    const { postId } = req.params; // Извлекаем идентификатор поста из параметров

    const query = `SELECT COUNT(*) AS likeCount FROM likes WHERE post_id = ?`; // SQL-запрос для подсчёта количества лайков для данного поста

    db.query(query, [postId], (err, results) => { // Выполняем запрос к базе данных
        if (err) { // Обрабатываем ошибки выполнения запроса
            console.error('Ошибка при получении лайков:', err); // Логируем ошибку
            return res.status(500).json({ success: false, message: 'Ошибка сервера.' }); // Ответ с ошибкой 500
        }

        res.json({ success: true, likeCount: results[0].likeCount }); // Успешный ответ с количеством лайков
        // Отправляем количество лайков из результата запроса
    });
});

// Обработчик для добавления поста в избранное
app.post('/api/event/favorite', (req, res) => {
    const { postId } = req.body; // Извлекаем идентификатор поста из тела запроса

    if (!req.session.user) { // Проверяем, авторизован ли пользователь
        return res.status(401).json({ success: false, message: 'Пользователь не авторизован.' }); // Ответ с ошибкой 401 (не авторизован)
    }

    const userId = req.session.user.id; // Получаем ID текущего пользователя из сессии

    const query = `INSERT INTO favorites (user_id, post_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE favorited_at = NOW()`; // SQL-запрос для добавления поста в избранное или обновления времени, если он уже добавлен

    db.query(query, [userId, postId], (err) => { // Выполняем запрос к базе данных
        if (err) { // Обрабатываем возможные ошибки выполнения запроса
            console.error('Ошибка при добавлении лайка:', err); // Логируем ошибку
            return res.status(500).json({ success: false, message: 'Ошибка сервера.' }); // Ответ с ошибкой 500
        }

        res.json({ success: true, message: 'Пост успешно лайкнут!' }); // Успешный ответ
    });
});

// Обработчик для удаления поста из избранного
app.post('/api/event/unfavorite', (req, res) => {
    const { postId } = req.body; // Извлекаем идентификатор поста из тела запроса

    if (!req.session.user) { // Проверяем, авторизован ли пользователь
        return res.status(401).json({ success: false, message: 'Пользователь не авторизован.' }); // Ответ с ошибкой 401 (не авторизован)
    }

    const userId = req.session.user.id; // Получаем ID текущего пользователя из сессии

    const query = `DELETE FROM favorites WHERE user_id = ? AND post_id = ?`; // SQL-запрос для удаления записи из таблицы

    db.query(query, [userId, postId], (err) => { // Выполняем запрос к базе данных
        if (err) { // Обрабатываем возможные ошибки выполнения запроса
            console.error('Ошибка при удалении лайка:', err); // Логируем ошибку
            return res.status(500).json({ success: false, message: 'Ошибка сервера.' }); // Ответ с ошибкой 500
        }

        res.json({ success: true, message: 'Лайк успешно удалён!' }); // Успешный ответ
    });
});

// Обработчик для проверки, добавлен ли пост в избранное текущим пользователем
app.get('/api/event/favorite/check/:postId', (req, res) => {
    if (!req.session.user) { // Проверяем, авторизован ли пользователь
        return res.status(401).json({ success: false, message: 'Пользователь не авторизован.' });
    }

    const userId = req.session.user.id; // Получаем ID текущего пользователя из сессии
    const { postId } = req.params; // Извлекаем идентификатор поста из параметров запроса

    const query = `SELECT COUNT(*) AS hasFavorited FROM favorites WHERE user_id = ? AND post_id = ?`; // SQL-запрос для проверки наличия записи в таблице

    db.query(query, [userId, postId], (err, results) => { // Выполняем запрос к базе данных
        if (err) { // Обрабатываем возможные ошибки выполнения запроса
            console.error('Ошибка при проверке лайка:', err); // Логируем ошибку
            return res.status(500).json({ success: false, message: 'Ошибка сервера.' }); // Ответ с ошибкой 500
        }

        res.json({ success: true, hasFavorited: results[0].hasFavorited > 0 }); // Отправляем результат проверки
    });
});

// Обработчик для получения количества пользователей, добавивших пост в избранное
app.get('/api/event/favorite/get/:postId', (req, res) => {
    const { postId } = req.params; // Извлекаем идентификатор поста из параметров запроса

    const query = `SELECT COUNT(*) AS favoriteCount FROM favorites WHERE post_id = ?`; // SQL-запрос для подсчета количества пользователей, добавивших пост в избранное

    db.query(query, [postId], (err, results) => { // Выполняем запрос к базе данных
        if (err) { // Обрабатываем возможные ошибки выполнения запроса
            console.error('Ошибка при получении лайков:', err); // Логируем ошибку
            return res.status(500).json({ success: false, message: 'Ошибка сервера.' }); // Ответ с ошибкой 500 
        }

        res.json({ success: true, favoriteCount: results[0].favoriteCount }); // Отправляем количество пользователей, добавивших данный пост в избранное
    });
});

// Обработчик для получения списка комментариев для определенного поста
app.get('/api/event/comments/get/:postId', (req, res) => {
    const { postId } = req.params; // Извлекаем идентификатор поста из параметров запроса

    const query = `SELECT c.*, u.name, u.surname FROM comments c LEFT JOIN users u ON c.user_id = u.id WHERE c.post_id = ? ORDER BY c.created_at ASC`;
    // SQL-запрос для получения всех комментариев, связанных с данным постом, включая имя и фамилию пользователя

    db.query(query, [postId], (err, results) => { // Выполняем запрос к базе данных
        if (err) { // Обрабатываем возможные ошибки выполнения запроса
            console.error('Ошибка при получении комментариев:', err); // Логируем ошибку
            return res.status(500).json({ success: false, message: 'Ошибка сервера.' }); // Ответ с ошибкой 500
        }

        if (results.length === 0) { // Если комментарии не найдены, отправляем сообщение об этом
            return res.json({ success: true, message: 'Комментарии не найдены.' }); // Сообщаем, что комментарии для этого поста отсутствуют
        }

        res.json({ success: true, comments: results }); // Отправляем список комментариев в случае успешного выполнения запроса
    });
});

// Обработчик для добавления комментария к посту
app.post('/api/event/comments/add/:postId', (req, res) => {
    const { postId } = req.params; // Извлекаем идентификатор поста из параметров запроса
    const { comment } = req.body; // Извлекаем текст комментария из тела запроса 
    const userId = req.session.user.id; // Получаем идентификатор пользователя из сессии

    // Проверка на наличие обязательных параметров (postId, userId, comment)
    if (!postId || !userId || !comment) {
        return res.status(400).json({ success: false, message: 'Необходимо указать postId, userId и текст комментария.' });
    }

    const query = `INSERT INTO comments (post_id, user_id, comment, created_at) VALUES (?, ?, ?, NOW())`; // SQL-запрос для добавления комментария в таблицу comments

    db.query(query, [postId, userId, comment], (err, result) => { // Выполняем запрос к базе данных для добавления комментария
        if (err) { // Обработка ошибок при выполнении запроса
            console.error('Ошибка при добавлении комментария:', err); // Логируем ошибку
            return res.status(500).json({ success: false, message: 'Ошибка при добавлении комментария.', }); // Ответ с ошибкой 500
        }

        res.json({ success: true, message: 'Комментарий успешно добавлен.' }); // Ответ при успешном добавлении комментария
    });
});



// Обработчик выхода пользователя
app.post('/api/logout', (req, res) => {
    const last = req.session.user; // Сохраняем информацию о текущем пользователе из сессии для логирования

    req.session.destroy((err) => { // Уничтожаем текущую сессию пользователя
        if (err) { // Если произошла ошибка при уничтожении сессии 
            console.log('[ERROR] Ошибка при выходе из системы', last); // Логируем ошибку с информацией о пользователе
            return res.status(500).json({ success: false }); // Отправляем ответ клиенту с кодом ошибки 500
        }
        res.json({ success: true }); // Если всё прошло успешно, отправляем клиенту подтверждение
        console.log('[SUCCESS|LOGOUT] Пользователь вышел:', last, '🔚'); // Логируем успешный выход пользователя
    });
});

// Обработчик регистрации пользователя
app.post('/api/register', async (req, res) => {
    const { login, password, email, name, surname, city, dob } = req.body; // Извлекаем данные из тела запроса

    try {
        const hashedPassword = await bcrypt.hash(password, 10); // Хэшируем пароль с помощью bcrypt с уровнем сложности 10

        const sql = 'INSERT INTO users (login, password, email, name, surname, city, dob) VALUES (?, ?, ?, ?, ?, ?, ?)'; // SQL-запрос для добавления нового пользователя
        db.query(sql, [login, hashedPassword, email, name, surname, city, dob], (err, result) => { // Выполняем запрос к базе данных
            if (err) { // Если произошла ошибка при выполнении запроса
                console.error('[ERROR]', err); // Логируем ошибку в консоль
                return res.status(500).json({ success: false, message: 'Ошибка регистрации! Пожалуйста, попробуйте позже.' }); // Возвращаем клиенту сообщение об ошибке
            }

            const user = { id: result.insertId, login }; // Сохраняем данные нового пользователя (id берётся из результата запроса)
            req.session.user = { id: user.id, login: user.login }; // Сохраняем информацию о пользователе в сессии
            console.log('[SUCCESS|AUTH] Пользователь авторизирован:', req.session.user, '🔛'); // Логируем успешную авторизацию
            res.json({ success: true, message: 'Поздравляем! Теперь вы с нами.' }); // Возвращаем клиенту сообщение об успешной регистрации
        });
    } catch (error) { // Обрабатываем ошибки, которые могут возникнуть при хэшировании пароля
        console.error('[ERROR]', error); // Логируем ошибку
        return res.status(500).json({ success: false, message: 'Ошибка при хэшировании пароля.' }); // Возвращаем клиенту сообщение об ошибке
    }
});

// Обработчик авторизации пользователя
app.post('/api/login', async (req, res) => {
    const { login, password, isEmail } = req.body; // Извлекаем логин/почту, пароль и флаг isEmail из тела запроса

    try {
        // Определяем, по какому полю будем искать пользователя: email или login
        const field = isEmail ? 'email' : 'login'; // Если isEmail true, ищем по email, иначе по login
        const sql = `SELECT * FROM users WHERE ${field} = ?`; // SQL-запрос для поиска пользователя в базе

        db.query(sql, [login], async (err, results) => { // Выполняем запрос к базе данных с указанным значением
            if (err) { // Если произошла ошибка при выполнении запроса
                console.error('[ERROR]', err); // Логируем ошибку
                return res.status(500).json({ success: false, message: 'Ошибка при авторизации.' }); // Возвращаем сообщение об ошибке
            }

            if (results.length === 0) { // Если пользователь с указанным логином/почтой не найден
                return res.status(401).json({ success: false, message: 'Неверный логин или пароль.' }); // Возвращаем сообщение о неудачной авторизации
            }

            const user = results[0]; // Получаем данные найденного пользователя

            const match = await bcrypt.compare(password, user.password); // Сравниваем введенный пароль с хэшированным паролем из базы
            if (!match) {
                return res.status(401).json({ success: false, message: 'Неверный логин или пароль.' }); // Возвращаем сообщение об ошибке
            }

            req.session.user = { id: user.id, login: user.login }; // Сохраняем информацию о пользователе в сессии
            console.log('[SUCCESS|AUTH] Пользователь авторизирован:', req.session.user, '🔛'); // Логируем успешную авторизацию
            res.json({ success: true, message: 'Воу! Добро пожаловать обратно!' }); // Отправляем клиенту сообщение об успешной авторизации
        });
    } catch (error) { // Обрабатываем ошибки, которые могут возникнуть в процессе выполнения
        console.error('[ERROR]', error); // Логируем ошибку
        res.status(500).json({ success: false, message: 'Ошибка при авторизации.' }); // Возвращаем сообщение об ошибке
    }
});



const PORT = 3000; // Устанавливаем порт, на котором будет запущен сервер
app.listen(PORT, () => { // Запускаем сервер и начинаем прослушивать указанный порт
    console.log(`[STARTING] Сервер запущен на порту ${PORT}🧑‍✈️`);
});