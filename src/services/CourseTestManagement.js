// src/components/CourseTestManagement.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CourseQuestionManagement } from './CourseQuestionManagement';
import { TestForm } from '../components/TestForm'; 

const API_URL = 'http://localhost:8080';

const authHeader = () => {
    const token = localStorage.getItem('access_token');
    return {
        headers: { Authorization: `Bearer ${token}` }
    };
};

export const CourseTestManagement = ({ courseId, courseTitle, onBack, onManageQuestions }) => {
    const [testsList, setTestsList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingTest, setEditingTest] = useState(null); // null или объект теста
    const [isAddingTest, setIsAddingTest] = useState(false);
    const [managingQuestions, setManagingQuestions] = useState(null);

    // --- ФУНКЦИЯ ЗАГРУЗКИ ТЕСТОВ ---
   const fetchTests = async () => {
        setLoading(true);
        setError(null);
        // Не загружаем, если управляем вопросами
        if (managingQuestions) {
            setLoading(false);
            return;
        } 
        try {
            const response = await axios.get(`${API_URL}/api/tests/course/${courseId}`, authHeader());
            const sortedTests = response.data.sort((a, b) => a.orderIndex - b.orderIndex);
            setTestsList(sortedTests);
        } catch (err) {
            setError('Не удалось загрузить список тестов.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

 useEffect(() => {
        if (courseId && !managingQuestions) { 
            fetchTests();
        }
    }, [courseId, managingQuestions]);



    // --- ФУНКЦИЯ УДАЛЕНИЯ ТЕСТА ---
    const handleDeleteTest = async (testId, title) => {
        if (!window.confirm(`Вы уверены, что хотите удалить тест "${title}"?`)) {
            return;
        }
        try {
            // DELETE /api/tests/{id}
            await axios.delete(`${API_URL}/api/tests/${testId}`, authHeader());
            alert(`Тест "${title}" успешно удален.`);
            fetchTests(); // Обновляем список
        } catch (err) {
            setError('Не удалось удалить тест. Проверьте права доступа.');
            console.error(err);
        }
    };
    
    // --- ОБРАБОТЧИК СОХРАНЕНИЯ (из TestForm) ---
    const handleTestSaved = () => {
        setIsAddingTest(false);
        setEditingTest(null);
        fetchTests(); // Обновляем список
    };
// --- ОБРАБОТЧИК КНОПКИ 'Вопросы' ---
    const handleManageQuestions = (testId, testTitle) => {
        setManagingQuestions({ testId, testTitle });
    };// --- ОБРАБОТЧИК КНОПКИ 'Назад' из CourseQuestionManagement ---
    const handleBackFromQuestions = () => {
        setManagingQuestions(null);
        fetchTests(); // Обновляем список тестов после возврата
    };


    // --- УСЛОВНЫЙ РЕНДЕРИНГ: УПРАВЛЕНИЕ ВОПРОСАМИ ---
    if (managingQuestions) {
        return (
            <CourseQuestionManagement
                testId={managingQuestions.testId}
                testTitle={managingQuestions.testTitle}
                onBack={handleBackFromQuestions} // Вернуться к списку тестов
            />
        );
    }


    // --- УСЛОВНЫЙ РЕНДЕРИНГ ФОРМЫ ---
    if (isAddingTest || editingTest) {
        return (
            <div className="container py-5" style={{ marginTop: '80px' }}>
                <button className="btn btn-secondary mb-4" onClick={onBack}>
                    ← Назад к списку курсов
                </button>
                <TestForm 
                    courseId={courseId} 
                    initialData={editingTest}
                    onSave={handleTestSaved} 
                    onCancel={() => {
                        setIsAddingTest(false);
                        setEditingTest(null);
                    }}
                />
            </div>
        );
    }

    // --- РЕНДЕРИНГ СПИСКА ТЕСТОВ ---
    if (loading) return <div className="text-center" style={{ marginTop: '80px' }}>Загрузка тестов курса...</div>;
    if (error) return <div className="error-message text-center" style={{ marginTop: '80px' }}>{error}</div>;

    return (
        <div className="container py-5" style={{ marginTop: '80px' }}>
            <button className="btn btn-secondary mb-4" onClick={onBack}>
                ← Назад к списку курсов
            </button>
            <h2 className="mb-4">Управление тестами: {courseTitle}</h2>
            
            <button className="btn btn-success mb-4" onClick={() => setIsAddingTest(true)}>
                + Создать новый тест
            </button>

            {testsList.length === 0 ? (
                <p>В этом курсе пока нет тестов.</p>
            ) : (
                <ul className="list-group">
                    {testsList.map(test => (
                        <li key={test.id} className="list-group-item d-flex justify-content-between align-items-center">
                            
                            {/* Название и порядок */}
                            <div>
                                <strong>{test.orderIndex}. {test.title}</strong>
                            </div>
                            
                            {/* Кнопки действий */}
                            <div>
                               <button 
                                    className="btn btn-sm btn-outline-primary me-2"
                                    onClick={() => handleManageQuestions(test.id, test.title)}
                                >
                                    Вопросы
                                </button>
                                <button 
                                    className="btn btn-sm btn-outline-info me-2"
                                    onClick={() => setEditingTest(test)}
                                >
                                    Изменить
                                </button>
                                <button 
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => handleDeleteTest(test.id, test.title)}
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