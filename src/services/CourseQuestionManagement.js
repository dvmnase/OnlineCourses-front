// src/components/CourseQuestionManagement.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { QuestionForm } from '../components/QuestionForm'; 

const API_URL = 'http://localhost:8080';

const authHeader = () => {
    const token = localStorage.getItem('access_token');
    return {
        headers: { Authorization: `Bearer ${token}` }
    };
};

export const CourseQuestionManagement = ({ testId, testTitle, onBack }) => {
    const [questionsList, setQuestionsList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // null или объект вопроса для редактирования
    const [editingQuestion, setEditingQuestion] = useState(null); 
    const [isAddingQuestion, setIsAddingQuestion] = useState(false);

    // --- ФУНКЦИЯ ЗАГРУЗКИ ВОПРОСОВ ---
    const fetchQuestions = async () => {
        setLoading(true);
        setError(null);
        try {
            // GET /api/tests/{testId}/questions
            const response = await axios.get(`${API_URL}/api/tests/${testId}/questions`, authHeader());
            
            // Предполагаем, что вопросов немного, и сортировка не требуется, 
            // но можно добавить сортировку по orderIndex, если он будет добавлен в модель.
            setQuestionsList(response.data);
            
        } catch (err) {
            setError('Не удалось загрузить список вопросов.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (testId) {
            fetchQuestions();
        }
    }, [testId]);

    // --- ОБРАБОТЧИК СОХРАНЕНИЯ (из QuestionForm) ---
    const handleQuestionSaved = () => {
        setIsAddingQuestion(false);
        setEditingQuestion(null);
        fetchQuestions(); // Обновляем список
    };

    // --- ФУНКЦИЯ УДАЛЕНИЯ ВОПРОСА ---
    const handleDeleteQuestion = async (questionId, text) => {
        if (!window.confirm(`Вы уверены, что хотите удалить вопрос "${text.substring(0, 50)}..."?`)) {
            return;
        }
        try {
            // DELETE /api/tests/questions/{id}
            await axios.delete(`${API_URL}/api/tests/questions/${questionId}`, authHeader());
            alert('Вопрос успешно удален.');
            fetchQuestions(); // Обновляем список
        } catch (err) {
            setError('Не удалось удалить вопрос. Проверьте права доступа.');
            console.error(err);
        }
    };

    // --- УСЛОВНЫЙ РЕНДЕРИНГ ФОРМЫ (добавление/редактирование) ---
    if (isAddingQuestion || editingQuestion) {
        return (
            <div className="container py-5" style={{ marginTop: '80px' }}>
                {/* Кнопка назад возвращает к списку вопросов */}
                <button className="btn btn-secondary mb-4" onClick={() => {
                    setIsAddingQuestion(false);
                    setEditingQuestion(null);
                }}>
                    ← Назад к вопросам
                </button>
                <QuestionForm 
                    testId={testId} 
                    initialData={editingQuestion}
                    onSave={handleQuestionSaved} 
                    onCancel={() => {
                        setIsAddingQuestion(false);
                        setEditingQuestion(null);
                    }}
                />
            </div>
        );
    }

    // --- РЕНДЕРИНГ СПИСКА ВОПРОСОВ ---
    if (loading) return <div className="text-center" style={{ marginTop: '80px' }}>Загрузка вопросов теста...</div>;
    if (error) return <div className="error-message text-center" style={{ marginTop: '80px' }}>{error}</div>;

    return (
        <div className="container py-5" style={{ marginTop: '80px' }}>
            {/* onBack - это функция, переданная из CourseTestManagement, возвращает к списку тестов */}
            <button className="btn btn-secondary mb-4" onClick={onBack}> 
                ← Назад к списку тестов
            </button>
            <h2 className="mb-4">Вопросы теста: {testTitle}</h2>
            
            <button className="btn btn-success mb-4" onClick={() => setIsAddingQuestion(true)}>
                + Добавить новый вопрос
            </button>

            {questionsList.length === 0 ? (
                <p>В этом тесте пока нет вопросов.</p>
            ) : (
                <ul className="list-group">
                    {questionsList.map((question, index) => (
                        <li key={question.id} className="list-group-item d-flex justify-content-between align-items-center">
                            
                            {/* Название и тип */}
                            <div className="flex-grow-1 me-3">
                                <strong>{index + 1}. {question.questionText}</strong> 
                                <span className="badge bg-info text-dark ms-3">{question.questionType}</span>
                                <span className="badge bg-secondary ms-2">{question.points} баллов</span>
                            </div>
                            
                            {/* Кнопки действий */}
                            <div>
                                <button 
                                    className="btn btn-sm btn-outline-info me-2"
                                    onClick={() => setEditingQuestion(question)}
                                >
                                    Изменить
                                </button>
                                <button 
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => handleDeleteQuestion(question.id, question.questionText)}
                                >
                                    Удалить
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};