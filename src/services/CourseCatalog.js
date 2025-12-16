// src/components/CourseCatalog.js (или services/CourseCatalog.js)

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaBookOpen, FaInfoCircle, FaCheckCircle, FaUserGraduate, FaExclamationTriangle, FaStar, FaUser, FaTimes, FaCalendarAlt, FaEnvelope} from 'react-icons/fa'; 
// Добавил FaUser для отображения имени автора

const API_URL = 'http://localhost:8080';

// Хелпер для заголовков авторизации
const authHeader = () => {
    const token = localStorage.getItem('access_token');
    return {
        headers: { Authorization: `Bearer ${token}` }
    };
};

const CourseDetailsModal = ({ course, onClose, onEnroll }) => {
    if (!course) return null;

    // Временный форматировщик даты для красоты
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' });
        } catch (e) {
            return dateString;
        }
    };

    return (
        <div 
            className="modal show d-block" 
            tabIndex="-1" 
            style={{ 
                backgroundColor: 'rgba(0, 0, 0, 0.7)', // Сделаем фон темнее
                position: 'fixed', 
                top: 0, 
                left: 0, 
                width: '100%', 
                height: '100%', 
                overflowY: 'auto',
                zIndex: 1050 
            }}
            onClick={onClose}
        >
            <div 
                className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable" // Увеличим размер и добавим прокрутку
                onClick={e => e.stopPropagation()} 
            >
                <div className="modal-content shadow-lg rounded-4 border-0">
                    
                    {/* ЗАГОЛОВОК МОДАЛЬНОГО ОКНА */}
                    <div className="modal-header bg-primary text-white p-4 rounded-top-4">
                        <h3 className="modal-title fw-bolder mb-0">
                            {course.title}
                        </h3>
                        <button 
                            type="button" 
                            className="btn-close btn-close-white" // Белый крестик для темного фона
                            aria-label="Close" 
                            onClick={onClose}
                        ></button>
                    </div>
                    
                    <div className="modal-body p-5">
                        
                        {/* 1. КРАТКОЕ ОПИСАНИЕ И ОЦЕНКА */}
                        <p className="lead text-dark mb-4 border-bottom pb-3">
                            {course.description || 'Краткое описание курса отсутствует.'}
                        </p>

                        <div className="d-flex justify-content-between align-items-center mb-4">
                            {/* Рейтинг */}
                            <div className="text-warning h5 mb-0">
                                <FaStar /> <FaStar /> <FaStar /> <FaStar /> <FaStar className="text-muted" /> 
                                <span className="text-dark ms-2 fw-bold">4.0</span> 
                                <span className="text-muted small">(Условно)</span>
                            </div>
                            
                            {/* Статус */}
                            <span className="badge bg-success-subtle text-success py-2 px-3">
                                <FaCheckCircle className="me-1" /> Опубликован
                            </span>
                        </div>

                        {/* 2. МЕТА-ИНФОРМАЦИЯ (КАРТОЧКА) */}
                        <div className="card shadow-sm border-0 mb-5 bg-light-subtle">
                            <div className="card-body">
                                <h6 className="card-title text-primary mb-3">
                                    <FaInfoCircle className="me-1" /> Общая информация
                                </h6>
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <p className="mb-0 small text-dark">
                                            <FaUser className="me-2 text-secondary" /> 
                                            <span className='fw-bold'>Автор:</span> {course.authorName || 'Неизвестно'}
                                        </p>
                                    </div>
                                    <div className="col-md-6">
                                        <p className="mb-0 small text-dark">
                                            <FaCalendarAlt className="me-2 text-secondary" /> 
                                            <span className='fw-bold'>Создан:</span> {formatDate(course.createdAt)}
                                        </p>
                                    </div>
                                    {/* Добавим email, если он есть (если authorName содержит email) */}
                                    {course.authorName?.includes('@') && (
                                        <div className="col-12">
                                            <p className="mb-0 small text-dark">
                                                <FaEnvelope className="me-2 text-secondary" /> 
                                                <span className='fw-bold'>Контакт:</span> {course.authorName}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 3. ПОЛНОЕ ОПИСАНИЕ */}
                        <h4 className="mt-4 mb-3 text-dark fw-bold border-bottom pb-2">
                             Полное описание курса
                        </h4>
                        <div style={{ whiteSpace: 'pre-wrap' }} className="text-secondary">
                             {/* Используем pre-wrap для сохранения переносов строк, если они есть в данных */}
                            {course.description || 'Полное описание курса пока не предоставлено.'}
                        </div>
                        
                    </div>

                    {/* ФУТЕР (КНОПКИ) */}
                    <div className="modal-footer justify-content-between p-4 bg-light">
                        <button 
                            type="button" 
                            className="btn btn-outline-secondary px-4 fw-bold" 
                            onClick={onClose}
                        >
                            <FaTimes className="me-1" /> Закрыть
                        </button>
                        <button 
                            type="button" 
                            className="btn btn-primary px-4 fw-bold shadow-sm" 
                            onClick={(e) => {
                                onEnroll(course.id, course.title, e);
                                onClose();
                            }}
                        >
                            <FaUserGraduate className="me-1" /> Записаться на курс
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const CourseCatalog = ({ onCourseView }) => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCourse, setSelectedCourse] = useState(null);

    // --- ФУНКЦИЯ ЗАГРУЗКИ ОПУБЛИКОВАННЫХ КУРСОВ (Без изменений) ---
    const fetchPublishedCourses = async () => {
        setLoading(true);
        setError(null);
        try {
        
            const response = await axios.get(`${API_URL}/api/student/courses/published`, authHeader()); 
            setCourses(response.data);
            
        } catch (err) {
            console.error('Ошибка при загрузке каталога курсов:', err);
            setError('Не удалось загрузить каталог курсов. Проверьте соединение с сервером.');
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = async (courseId, courseTitle) => {
        setLoading(true);
        try {
            // 1. Запрос к новому эндпоинту бэкенда
            const response = await axios.get(`${API_URL}/api/student/courses/${courseId}`, authHeader());
            
            // 2. Установка данных курса для отображения в модальном окне
            setSelectedCourse(response.data); 
            
        } catch (err) {
            console.error('Ошибка при загрузке деталей курса:', err);
            const status = err.response?.status;
            let message = 'Не удалось загрузить детали курса.';

            if (status === 404) {
                 message = `🔎 Курс "${courseTitle}" не найден или не опубликован.`;
            } else {
                 message = `Ошибка: ${err.response?.data?.message || err.message}`;
            }

            alert(message);
            setSelectedCourse(null); // Сброс, если была ошибка
        } finally {
             // Здесь устанавливаем loading=false, но только для загрузки каталога.
             // Для модального окна лучше использовать локальный стейт, но для простоты, пока оставим так.
             // В реальном приложении можно добавить отдельное состояние `loadingDetails`.
             setLoading(false);
        }
    };
    
    // --- НОВАЯ ФУНКЦИЯ ДЛЯ ЗАКРЫТИЯ МОДАЛЬНОГО ОКНА ---
    const handleCloseModal = () => {
        setSelectedCourse(null);
    };
    useEffect(() => {
        fetchPublishedCourses();
    }, []);

    // ... (handleEnroll и handleViewDetails без изменений)
    const handleEnroll = async (courseId, courseTitle, e) => {
        e.stopPropagation(); 
        if (!window.confirm(`Вы уверены, что хотите записаться на курс "${courseTitle}"?`)) {
            return;
        }

        try {
            const response = await axios.post(`${API_URL}/api/student/courses/${courseId}/enroll`, {}, authHeader());
            const status = response.status;
            
            if (status === 201) { 
                alert(`✅ Вы успешно записались на курс "${courseTitle}"!`);
            } else if (status === 200) { 
                alert(`ℹ️ Вы уже были записаны на курс "${courseTitle}".`);
            }
            
        } catch (err) {
            const status = err.response?.status;
            let message = 'Неизвестная ошибка при записи.';

            if (status === 403) {
                message = '🚫 Курс не опубликован или доступ запрещен.';
            } else if (status === 404) {
                 message = '🔎 Курс не найден.';
            } else if (status === 500) {
                 message = `🚨 Внутренняя ошибка сервера.`;
            } else {
                 message = `Ошибка записи: ${err.response?.data?.message || err.message}`;
            }

            console.error('Ошибка записи:', err.response?.data || err.message);
            alert(message);
        }
    };
    



    // --- РЕНДЕРИНГ ---
    return (
        <div className="container py-5" style={{ marginTop: '80px' }}>
            <h2 className="mb-5 text-center fw-light">
                <FaBookOpen className="me-2 text-primary" /> 
                Каталог курсов
            </h2>
            
            {loading ? (
                 <div className="text-center p-5"><FaInfoCircle className="me-2 text-primary" /> Загрузка каталога...</div>
            ) : error ? (
                 <div className="alert alert-danger text-center"><FaExclamationTriangle className="me-2" /> {error}</div>
            ) : courses.length === 0 ? (
                <div className="alert alert-info text-center">
                    К сожалению, в данный момент нет опубликованных курсов.
                </div>
            ) : (
                <div className="row justify-content-center">
                    {courses.map((course) => (
                        <div key={course.id} className="col-12 col-md-6 col-lg-4 mb-4">
                            
                            <div className="card h-100 shadow border rounded-3 d-flex flex-column course-card-hover  ">
                                
                                <div 
                                    className="card-body flex-grow-1 p-4" 
                                    onClick={() => handleViewDetails(course.id, course.title)} 
                                    style={{ cursor: 'pointer' }} 
                                >
                                    <h5 className="card-title fw-bold text-dark mb-2">
                                        {course.title}
                                    </h5>
                                    
                                    <div className="mb-3 text-warning small">
                                        <FaStar /> <FaStar /> <FaStar /> <FaStar /> <FaStar className="text-muted" />
                                    </div>

                                    {/* Описание */}
                                    <p 
                                        className="card-text text-muted small mb-3" 
                                        style={{ 
                                            display: '-webkit-box', 
                                            WebkitLineClamp: 3, 
                                            WebkitBoxOrient: 'vertical', 
                                            overflow: 'hidden', 
                                            textOverflow: 'ellipsis',
                                            minHeight: '60px' 
                                        }}
                                    >
                                        {course.description || 'Описание курса пока не предоставлено.'}
                                    </p>
                                    
                                    {/* Мета-информация (Имя Автора и Статус) */}
                                    <div className="text-start border-top pt-2 mt-auto">
        
        {/* Имя Автора: d-block и mb-1 обеспечивают вертикальное расположение */}
        <small className="text-secondary d-block mb-1">
            <FaUser className="me-1" /> Автор: {course.authorName || 'Неизвестно'}
        </small>
       
        
    </div>
                                </div>
                                
                                {/* ФУТЕР (Кнопка Записаться) */}
                                <div className="card-footer bg-light border-top p-3">
                                    <button 
                                        className="btn btn-primary btn-sm w-100" 
                                        onClick={(e) => handleEnroll(course.id, course.title, e)}
                                    >
                                        <FaUserGraduate className="me-1" /> Записаться на курс
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <CourseDetailsModal 
                course={selectedCourse} 
                onClose={handleCloseModal} 
                onEnroll={handleEnroll} 
            />
        </div>
    );
};