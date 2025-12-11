// src/components/CourseCatalog.js (или services/CourseCatalog.js)

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaBookOpen, FaInfoCircle, FaCheckCircle, FaUserGraduate, FaExclamationTriangle, FaStar, FaUser } from 'react-icons/fa'; 
// Добавил FaUser для отображения имени автора

const API_URL = 'http://localhost:8080';

// Хелпер для заголовков авторизации
const authHeader = () => {
    const token = localStorage.getItem('access_token');
    return {
        headers: { Authorization: `Bearer ${token}` }
    };
};

export const CourseCatalog = ({ onCourseView }) => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
    
    const handleViewDetails = (courseId, courseTitle) => {
        alert(`Переход на страницу: Подробности о курсе "${courseTitle}" (ID: ${courseId}). Нажмите на любую область карточки, кроме кнопки "Записаться".`);
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
        </div>
    );
};