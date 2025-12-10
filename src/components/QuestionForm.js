// src/components/QuestionForm.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:8080';
const QUESTION_TYPES = ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TEXT_ANSWER', 'ESSAY']; // Добавьте типы из вашей модели, если они другие

const authHeader = () => {
    const token = localStorage.getItem('access_token');
    return {
        headers: { Authorization: `Bearer ${token}` }
    };
};

export const QuestionForm = ({ testId, initialData, onSave, onCancel }) => {
    const isEditing = !!initialData;
    const questionId = isEditing ? initialData.id : null;

    const [questionText, setQuestionText] = useState(isEditing ? initialData.questionText : '');
    const [questionType, setQuestionType] = useState(isEditing ? initialData.questionType : QUESTION_TYPES[0]);
    const [correctAnswer, setCorrectAnswer] = useState(isEditing ? initialData.correctAnswer : '');
    const [points, setPoints] = useState(isEditing ? String(initialData.points) : '1');
    const [optionsData, setOptionsData] = useState(isEditing ? initialData.optionsData : ''); // Пока работаем со строкой/JSON
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // --- Обработчик отправки формы ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const pointsValue = parseInt(points);

        if (isNaN(pointsValue) || pointsValue < 1) {
             setError('Количество баллов должно быть не менее 1.');
             setLoading(false);
             return;
        }

        const questionData = {
            id: isEditing ? questionId : null,
            testId: testId,
            questionText: questionText,
            questionType: questionType,
            correctAnswer: questionType === 'ESSAY' ? null : correctAnswer, // ESSAY не требует жесткого ответа
            optionsData: optionsData || null, // Отправляем как строку
            points: pointsValue,
        };

        try {
            const headersWithAuth = authHeader().headers;
            
            // Используем POST для создания и обновления, чтобы избежать ошибки PUT
            const targetUrl = `${API_URL}/api/tests/questions`;
            const method = 'post';

            await axios({
                method: method, 
                url: targetUrl, 
                data: questionData,
                headers: headersWithAuth
            });


            alert(`Вопрос успешно ${isEditing ? 'обновлен' : 'создан'}.`);
            onSave(); 

        } catch (err) {
            console.error('Ошибка при сохранении вопроса:', err.response?.data || err.message);
            const backendError = err.response?.data?.message || err.response?.data?.error || err.message || 'Неизвестная ошибка.';
            setError(`Ошибка при сохранении вопроса: ${backendError}`);
        } finally {
            setLoading(false);
        }
    };

    // --- Рендеринг формы ---
    return (
        <div className="card p-4">
            <h4>{isEditing ? 'Редактирование вопроса' : 'Создание нового вопроса'}</h4>
            {error && <div className="alert alert-danger">{error}</div>}

            <form onSubmit={handleSubmit}>
                
                <div className="mb-3">
                    <label className="form-label">Текст вопроса *</label>
                    <textarea
                        className="form-control"
                        value={questionText}
                        onChange={(e) => setQuestionText(e.target.value)}
                        required
                        rows="3"
                        disabled={loading}
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label">Тип вопроса *</label>
                    <select
                        className="form-select"
                        value={questionType}
                        onChange={(e) => setQuestionType(e.target.value)}
                        required
                        disabled={loading}
                    >
                        {QUESTION_TYPES.map(type => (
                            <option key={type} value={type}>{type.replace('_', ' ')}</option>
                        ))}
                    </select>
                </div>

                {questionType !== 'ESSAY' && (
                    <div className="mb-3">
                        <label className="form-label">Правильный ответ / Ключ *</label>
                        <input
                            type="text"
                            className="form-control"
                            value={correctAnswer}
                            onChange={(e) => setCorrectAnswer(e.target.value)}
                            required={questionType !== 'ESSAY'}
                            disabled={loading}
                        />
                        <small className="form-text text-muted">Для SINGLE_CHOICE/MULTIPLE_CHOICE это может быть JSON с ID опций, для TEXT_ANSWER — ожидаемый ответ.</small>
                    </div>
                )}
                
                {/* Упрощенное поле для опций (для выбора, пока как строка JSON) */}
                {(questionType === 'SINGLE_CHOICE' || questionType === 'MULTIPLE_CHOICE') && (
                    <div className="mb-3">
                        <label className="form-label">Данные опций (JSON)</label>
                        <textarea
                            className="form-control"
                            value={optionsData}
                            onChange={(e) => setOptionsData(e.target.value)}
                            rows="3"
                            disabled={loading}
                        />
                        <small className="form-text text-muted">Сложные формы для опций потребуют отдельной реализации. Здесь ожидается строка JSON.</small>
                    </div>
                )}


                <div className="mb-3">
                    <label className="form-label">Баллы за вопрос *</label>
                    <input
                        type="number"
                        className="form-control"
                        value={points}
                        onChange={(e) => setPoints(e.target.value)}
                        min="1"
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
                        {loading ? 'Сохранение...' : isEditing ? 'Обновить вопрос' : 'Создать вопрос'}
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