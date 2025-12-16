import React, { useState, useEffect } from 'react';
import axios from 'axios';
// Добавлены FaFileAlt и FaQuestionCircle для новых кнопок
import { FaBookReader, FaChalkboardTeacher, FaExclamationTriangle, FaHourglassHalf, FaTimes, FaFileAlt, FaQuestionCircle } from 'react-icons/fa'; 
import { act } from 'react';

const API_URL = 'http://localhost:8080';

// Хелпер для заголовков авторизации (как в CourseCatalog)
const authHeader = () => {
    const token = localStorage.getItem('access_token');
    return {
        headers: { Authorization: `Bearer ${token}` }
    };
};

export const MyLearning = ({ onCourseView }) => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- ФУНКЦИЯ ЗАГРУЗКИ КУРСОВ СТУДЕНТА ---
    const fetchEnrolledCourses = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`${API_URL}/api/student/courses/enrolled`, authHeader()); 
            setCourses(response.data);
            
        } catch (err) {
            console.error('Ошибка при загрузке курсов студента:', err);
            setError('Не удалось загрузить ваши курсы. Проверьте подключение.');
        } finally {
            setLoading(false);
        }
    };

    // --- ФУНКЦИЯ ОТПИСКИ ОТ КУРСА ---
    const handleUnenroll = async (courseId, courseTitle) => {
        if (!window.confirm(`Вы уверены, что хотите отписаться от курса "${courseTitle}"?`)) {
            return;
        }

        try {
            await axios.delete(`${API_URL}/api/student/courses/${courseId}/unenroll`, authHeader());
            
            alert(`✅ Вы успешно отписались от курса "${courseTitle}".`);
            fetchEnrolledCourses(); 
            
        } catch (err) {
            console.error('Ошибка при отписке:', err.response?.data || err.message);
            alert(`❌ Не удалось отписаться от курса. Ошибка: ${err.response?.data?.message || 'Неизвестная ошибка'}`);
        }
    };
    
    // --- НОВАЯ ФУНКЦИЯ: Перейти к контенту ---
    const handleGoToContent = (course) => {
        // Мы передаем в App.js объект с типом страницы и данными курса
        onCourseView({ 
            page: 'course-content-student', // <-- Эта страница будет рендерить StudentCourseContentView
            data: course 
        });
    };

    // --- НОВАЯ ФУНКЦИЯ: Перейти к тесту ---
    const handleGoToTest = (course) => {
        // Мы передаем в App.js объект с типом страницы и данными курса
        onCourseView({ 
            page: 'course-test-student', 
            data: course 
        });
        alert(`Переход к тестам курса: ${course.title} (ID: ${course.id})`);
        // В App.js вам нужно будет добавить логику рендеринга для 'course-test-student'
    };


    useEffect(() => {
        fetchEnrolledCourses();
    }, []);

    // --- РЕНДЕРИНГ ---
    return (
        <div className="container py-5" style={{ marginTop: '80px' }}>
            <h2 className="mb-5 text-center fw-light">
                <FaBookReader className="me-2 text-primary" /> 
                Мое обучение 
            </h2>
            
            {loading ? (
                 <div className="text-center p-5"><FaHourglassHalf className="me-2 text-primary" /> Загрузка вашего обучения...</div>
            ) : error ? (
                 <div className="alert alert-danger text-center"><FaExclamationTriangle className="me-2" /> {error}</div>
            ) : courses.length === 0 ? (
                <div className="alert alert-info text-center">
                    Вы пока не записаны ни на один курс. Перейдите в <a href='#' onClick={() => onCourseView('catalog')}>Каталог</a>.
                </div>
            ) : (
                <div className="row justify-content-center">
                    {courses.map((course) => (
                        <div key={course.id} className="col-12 col-md-6 col-lg-4 mb-4">
                            
                            <div className="card h-100 shadow border rounded-3 d-flex flex-column">
                                <div className="card-body flex-grow-1 p-4">
                                    <h5 className="card-title fw-bold text-dark mb-2">
                                        {course.title}
                                    </h5>
                                    
                                    <p className="card-text text-muted small mb-3">
                                        {course.description}
                                    </p>
                                    
                                    <div className="text-start border-top pt-2 mt-auto">
                                        <small className="text-secondary d-block mb-1">
                                            <FaChalkboardTeacher className="me-1" /> Автор: {course.authorName || 'Неизвестно'}
                                        </small>
                                    </div>
                                </div>
                                
                                {/* ФУТЕР с тремя кнопками */}
                                <div className="card-footer bg-light border-top p-3">
                                    <div className="d-flex justify-content-between gap-2">
                                        
                                        {/* Кнопка "Перейти к контенту" */}
                                        <button 
                                            className="btn btn-outline-primary btn-sm flex-fill" 
                                            onClick={() => handleGoToContent(course)}
                                        >
                                            <FaFileAlt className="me-1" /> Контент
                                        </button>
                                        
                                        {/* Кнопка "Пройти тест" */}
                                        <button 
                                            className="btn btn-outline-success btn-sm flex-fill" 
                                            onClick={() => handleGoToTest(course)}
                                        >
                                            <FaQuestionCircle className="me-1" /> Тест
                                        </button>

                                        {/* Кнопка "Отписаться" */}
                                        <button 
                                            className="btn btn-outline-danger btn-sm" 
                                            onClick={() => handleUnenroll(course.id, course.title)}
                                            style={{ minWidth: '100px' }} // Фиксированная ширина для "Отписаться"
                                        >
                                            <FaTimes className="me-1" /> Отписаться
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};