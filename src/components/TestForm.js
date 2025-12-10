import React, { useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:8080';

const authHeader = () => {
    const token = localStorage.getItem('access_token');
    return {
        headers: { Authorization: `Bearer ${token}` }
    };
};

export const TestForm = ({ courseId, initialData, onSave, onCancel }) => {
    
    // --- Инициализация состояния ---
    const isEditing = !!initialData;
    const testId = isEditing ? initialData.id : null;

    // Инициализация, убеждаемся, что парсим или устанавливаем значения по умолчанию
    const [title, setTitle] = useState(isEditing ? initialData.title : '');
    const [description, setDescription] = useState(isEditing ? initialData.description : '');
    
    const [orderIndex, setOrderIndex] = useState(
        isEditing && initialData.orderIndex !== null ? String(initialData.orderIndex) : '0'
    );
    
    const [passThreshold, setPassThreshold] = useState(
        isEditing && initialData.passThreshold !== null ? String(initialData.passThreshold) : '70'
    );

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);


    // --- Обработчик отправки формы ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Парсим значения непосредственно перед отправкой
        const thresholdValue = parseInt(passThreshold);
        const orderValue = parseInt(orderIndex);

        if (isNaN(thresholdValue) || thresholdValue < 0 || thresholdValue > 100) {
             setError('Порог прохождения должен быть числом от 0 до 100.');
             setLoading(false);
             return;
        }

        const testData = {
            // Для режима обновления (isEditing=true) ID передается в теле
            id: isEditing ? testId : null, 
            courseId: courseId,
            title: title,
            description: description,
            orderIndex: orderValue, 
            passThreshold: thresholdValue, 
        };

        try {
            const headersWithAuth = authHeader().headers;
            
            // *** КЛЮЧЕВОЕ ИЗМЕНЕНИЕ: Используем POST для обоих случаев ***
            const targetUrl = `${API_URL}/api/tests`;
            const method = 'post';

            const response = await axios({
                method: method, 
                url: targetUrl, 
                data: testData,
                headers: headersWithAuth
            });


            alert(`Тест "${title}" успешно ${isEditing ? 'обновлен' : 'создан'}.`);
            onSave(); 

        } catch (err) {
            console.error('Ошибка при сохранении теста:', err.response?.data || err.message);
            const backendError = err.response?.data?.message || err.response?.data?.error || err.message || 'Неизвестная ошибка.';
            setError(`Ошибка при сохранении теста: ${backendError}`);
        } finally {
            setLoading(false);
        }
    };

    // --- Рендеринг формы ---
    return (
        <div className="card p-4">
            <h4>{isEditing ? `Редактирование теста: ${initialData.title}` : 'Создание нового теста'}</h4>
            {error && <div className="alert alert-danger">{error}</div>}

            <form onSubmit={handleSubmit}>
                
                <div className="mb-3">
                    <label className="form-label">Название теста *</label>
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
                    <label className="form-label">Описание</label>
                    <textarea
                        className="form-control"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows="3"
                        disabled={loading}
                    />
                </div>
                
                <div className="mb-3">
                    <label className="form-label">Порог прохождения (%) *</label>
                    <input
                        type="number"
                        className="form-control"
                        value={passThreshold}
                        onChange={(e) => setPassThreshold(e.target.value)} 
                        min="0"
                        max="100"
                        required
                        disabled={loading}
                    />
                    <small className="form-text text-muted">Минимальный процент правильных ответов для сдачи теста (0-100).</small>
                </div>

                <div className="mb-3">
                    <label className="form-label">Порядок отображения</label>
                    <input
                        type="number"
                        className="form-control"
                        value={orderIndex}
                        onChange={(e) => setOrderIndex(e.target.value)}
                        min="0"
                        required
                        disabled={loading}
                    />
                </div>
                
                <div className="d-flex justify-content-end">
                    <button 
                        type="submit" 
                        className="btn btn-success me-2" 
                        disabled={loading}
                    >
                        {loading ? 'Сохранение...' : isEditing ? 'Обновить тест' : 'Создать тест'}
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