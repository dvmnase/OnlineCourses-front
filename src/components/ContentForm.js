import React, { useState, useEffect } from 'react';
import axios from 'axios';

// URL API, как определено в других компонентах
const API_URL = 'http://localhost:8080';

// Вспомогательная функция для получения заголовков с токеном
const authHeader = () => {
    const token = localStorage.getItem('access_token');
    return {
        headers: { Authorization: `Bearer ${token}` }
    };
};

export const ContentForm = ({ courseId, initialData, onSave, onCancel }) => {
    
    // --- 1. Определение режима работы и ID ---
    const isEditing = !!initialData;
    const contentId = isEditing ? initialData.id : null;

    // --- 2. Состояния формы (инициализация из initialData) ---
    const [title, setTitle] = useState(isEditing ? initialData.title : '');
    const [contentType, setContentType] = useState(isEditing ? initialData.contentType : 'TEXT');
    const [contentText, setContentText] = useState(isEditing ? initialData.contentText || '' : '');
    const [file, setFile] = useState(null); // Для загрузки нового файла
    const [orderIndex, setOrderIndex] = useState(isEditing ? initialData.orderIndex : 0);
    
    // Состояние процесса
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // --- 3. Вспомогательные переменные для типа контента ---
    const isFileRequired = contentType === 'PDF' || contentType === 'FILE';
    const isTextRequired = contentType === 'TEXT' || contentType === 'VIDEO';


    // --- 4. Обработчик отправки формы ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // 1. Создание объекта метаданных (JSON часть для бэкенда)
            const contentJson = {
                id: contentId, // Будет null при создании, ID при редактировании
                courseId: courseId,
                title: title,
                contentType: contentType,
                contentText: isTextRequired ? contentText : null,
                orderIndex: orderIndex, 
                // При редактировании бэкенд должен сам сохранить старые fileData, 
                // если новый файл не был загружен.
            };

            // 2. Определение URL и метода
            const headersWithAuth = authHeader().headers;
            let response;
            let targetUrl = `${API_URL}/api/content`;
            let method = axios.post;
            let payload;

            if (isEditing) {
                // РЕЖИМ РЕДАКТИРОВАНИЯ (PUT)
                targetUrl = `${API_URL}/api/content/${contentId}`;
                method = axios.put;
                
                // Для простоты: 
                // Если файл НЕ меняется, отправляем JSON (Content-Type: application/json).
                // Если файл меняется, отправляем multipart/form-data.
                
                if (!isFileRequired || !file) {
                    // Обновляем только метаданные
                    payload = contentJson;
                    // ВАЖНО: PUT-запрос должен иметь application/json
                    // Headers останутся без 'Content-Type': 'multipart/form-data'
                } else {
                    // Обновляем метаданные и файл (multipart)
                    const formData = new FormData();
                    formData.append('content', new Blob([JSON.stringify(contentJson)], {
                        type: 'application/json'
                    }));
                    formData.append('file', file, file.name);
                    payload = formData;
                    headersWithAuth['Content-Type'] = 'multipart/form-data';
                }

            } else {
                // РЕЖИМ СОЗДАНИЯ (POST)
                method = axios.post;
                
                // Всегда multipart/form-data, так как бэкенд ожидает две части (@RequestPart)
                const formData = new FormData();
                formData.append('content', new Blob([JSON.stringify(contentJson)], {
                    type: 'application/json'
                }));
                
                // Файл обязателен, даже если он пустой (для соответствия @RequestPart("file") на бэкенде)
                // Если файла нет, отправляем пустой Blob
                const fileToUpload = file || new Blob([""], { type: 'application/octet-stream' });
                const fileName = file ? file.name : 'placeholder';
                
                formData.append('file', fileToUpload, fileName);
                
                payload = formData;
                headersWithAuth['Content-Type'] = 'multipart/form-data';
            }

            // 3. Выполнение запроса
            response = await method(targetUrl, payload, { headers: headersWithAuth });

            alert(`Контент "${title}" успешно ${isEditing ? 'обновлен' : 'создан'}!`);
            onSave(); // Закрывает форму и обновляет родительский список

        } catch (err) {
            console.error('Ошибка при сохранении контента:', err.response?.data || err.message);
            setError(`Ошибка при сохранении контента: ${err.response?.data?.message || err.message}`);
        } finally {
            setLoading(false);
        }
    };


    // --- 5. Рендеринг формы ---
    return (
        <div className="container py-5" style={{ marginTop: '80px' }}>
            <h2>{isEditing ? 'Редактировать элемент' : 'Добавить новый элемент'}</h2>
            <p className="text-muted">Курс: {courseId}</p>
            <button className="btn btn-secondary mb-3" onClick={onCancel}>
                ← Назад к содержанию
            </button>

            {error && <div className="alert alert-danger">{error}</div>}

            <form onSubmit={handleSubmit}>
                
                <div className="mb-3">
                    <label className="form-label">Название элемента</label>
                    <input
                        type="text"
                        className="form-control"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        disabled={loading}
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label">Порядок отображения (Order Index)</label>
                    <input
                        type="number"
                        className="form-control"
                        value={orderIndex}
                        onChange={(e) => setOrderIndex(parseInt(e.target.value))}
                        min="0"
                        required
                        disabled={loading}
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label">Тип контента</label>
                    <select
                        className="form-select"
                        value={contentType}
                        onChange={(e) => {
                            setContentType(e.target.value);
                            setFile(null); // Сброс файла при смене типа
                            setContentText(''); // Сброс текста при смене типа
                        }}
                        required
                        disabled={loading}
                    >
                        <option value="TEXT">Текст / Статья</option>
                        <option value="VIDEO">Видео (URL)</option>
                        <option value="PDF">Документ (PDF)</option>
                        <option value="FILE">Другой файл</option>
                        <option value="QUIZ">Тест / Задание</option>
                    </select>
                </div>

                {isTextRequired && (
                    <div className="mb-3">
                        <label className="form-label">
                            {contentType === 'TEXT' ? 'Содержание статьи' : 'URL-адрес видео'}
                        </label>
                        <textarea
                            className="form-control"
                            value={contentText}
                            onChange={(e) => setContentText(e.target.value)}
                            rows={contentType === 'TEXT' ? 5 : 1}
                            required
                            disabled={loading}
                        />
                    </div>
                )}

                {isFileRequired && (
                    <div className="mb-3">
                        <label className="form-label">Загрузка файла ({contentType})</label>
                        <input
                            type="file"
                            className="form-control"
                            onChange={(e) => setFile(e.target.files[0])}
                            // Файл обязателен только при создании, если тип FILE/PDF
                            required={!isEditing && isFileRequired} 
                            disabled={loading}
                        />
                         {isEditing && (
                            <div className="form-text text-warning">
                                Чтобы сохранить старый файл, не выбирайте новый. Выбор нового файла заменит предыдущий.
                            </div>
                        )}
                    </div>
                )}
                
                <div className="d-flex justify-content-end">
                    <button 
                        type="submit" 
                        className="btn btn-success me-2" 
                        disabled={loading || (isFileRequired && !isEditing && !file)}
                    >
                        {loading ? 'Сохранение...' : isEditing ? 'Обновить' : 'Создать'}
                    </button>
                    <button 
                        type="button" 
                        className="btn btn-outline-secondary" 
                        onClick={onCancel}
                        disabled={loading}
                    >
                        Отмена
                    </button>
                </div>
            </form>
        </div>
    );
};