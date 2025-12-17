import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    FaBookReader, FaChalkboardTeacher, FaExclamationTriangle, 
    FaHourglassHalf, FaTimes, FaFileAlt, FaQuestionCircle, FaStar 
} from 'react-icons/fa'; 

const API_URL = 'http://localhost:8080';

// Хелпер для авторизации
const authHeader = () => {
    const token = localStorage.getItem('access_token');
    return {
        headers: { Authorization: `Bearer ${token}` }
    };
};

/**
 * Вспомогательная функция для получения ID пользователя из JWT токена
 */
const getUserIdFromToken = () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
        console.warn("Токен отсутствует в localStorage");
        return null;
    }
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        // Предполагаем, что в токене ID лежит в поле 'userId' или 'id'
        const payload = JSON.parse(jsonPayload);
        console.log("ПОЛНЫЙ СОСТАВ ВАШЕГО ТОКЕНА:", payload);
        return payload.userId || payload.id; 
    } catch (e) {
        return null;
    }
};

export const MyLearning = ({ onCourseView }) => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Состояния для модалки отзыва
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [selectedCourseForReview, setSelectedCourseForReview] = useState(null);
    const [rating, setRating] = useState(5);
    const [reviewText, setReviewText] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- ЗАГРУЗКА КУРСОВ ---
    const fetchEnrolledCourses = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/api/student/courses/enrolled`, authHeader()); 
            setCourses(response.data);
        } catch (err) {
            setError('Не удалось загрузить ваши курсы.');
        } finally {
            setLoading(false);
        }
    };

    // --- ОТКРЫТИЕ МОДАЛКИ С ПРЕДЗАПОЛНЕНИЕМ ---
    const openReviewModal = async (course) => {
        setSelectedCourseForReview(course);
        setLoading(true); // Кратковременный лоадер, пока ищем отзыв

        let initialRating = 5;
        let initialText = "";
        try {
            

          

            // Получаем все отзывы курса
            const response = await axios.get(`${API_URL}/api/student/reviews/${course.id}`, authHeader());
            console.log("Отзывы с сервера (RAW):", response.data);
            const currentUserId = getUserIdFromToken();

            console.log("ID пользователя из вашего токена:", currentUserId, "| Тип:", typeof currentUserId);

        if (!currentUserId) {
            console.error("КРИТИЧЕСКАЯ ОШИБКА: userId не найден в токене! Проверьте функцию getUserIdFromToken.");
        }
            // Ищем отзыв текущего пользователя в списке
          const myExistingReview = response.data.find(r => r.userId == currentUserId);
            if (myExistingReview) {
                initialRating = myExistingReview.rating;
                initialText = myExistingReview.reviewText || "";
            }
        } catch (err) {
            console.error("Ошибка при поиске существующего отзыва:", err);
        } finally {
            setRating(initialRating);
            setReviewText(initialText);
            setLoading(false);
            setShowReviewModal(true);
        }
    };

    // --- ОТПРАВКА (UPSERT) ---
    const submitReview = async () => {
        if (rating < 1) {
            alert("Пожалуйста, поставьте оценку.");
            return;
        }

        setIsSubmitting(true);
        try {
            await axios.post(
                `${API_URL}/api/student/reviews/${selectedCourseForReview.id}`, 
                { rating, reviewText }, 
                authHeader()
            );
            alert("✅ Ваш отзыв успешно сохранен!");
            setShowReviewModal(false);
        } catch (err) {
            alert("❌ Ошибка при сохранении отзыва.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUnenroll = async (courseId, courseTitle) => {
        if (!window.confirm(`Вы уверены, что хотите отписаться от курса "${courseTitle}"?`)) return;
        try {
            await axios.delete(`${API_URL}/api/student/courses/${courseId}/unenroll`, authHeader());
            fetchEnrolledCourses();
        } catch (err) {
            alert("Ошибка при отписке.");
        }
    };

    useEffect(() => {
        fetchEnrolledCourses();
    }, []);

    return (
        <div className="container py-5" style={{ marginTop: '80px' }}>
            <h2 className="mb-5 text-center fw-light">
                <FaBookReader className="me-2 text-primary" /> Мое обучение 
            </h2>
            
            {loading && !showReviewModal ? (
                <div className="text-center p-5"><FaHourglassHalf className="me-2 text-primary" /> Загрузка...</div>
            ) : error ? (
                <div className="alert alert-danger text-center">{error}</div>
            ) : (
                <div className="row justify-content-center">
                    {courses.map((course) => (
                        <div key={course.id} className="col-12 col-md-6 col-lg-4 mb-4">
                            <div className="card h-100 shadow border rounded-3 d-flex flex-column">
                                <div className="card-body flex-grow-1 p-4">
                                    <h5 className="card-title fw-bold text-dark mb-2">{course.title}</h5>
                                    <p className="card-text text-muted small mb-3">{course.description}</p>
                                    <div className="text-start border-top pt-2 mt-auto">
                                        <small className="text-secondary d-block mb-1">
                                            <FaChalkboardTeacher className="me-1" /> Автор: {course.authorName || 'Неизвестно'}
                                        </small>
                                    </div>
                                </div>
                                
                                <div className="card-footer bg-light border-top p-3">
                                    <div className="d-flex flex-wrap justify-content-between gap-2">
                                        <button className="btn btn-outline-primary btn-sm flex-fill" 
                                            onClick={() => onCourseView({ page: 'course-content-student', data: course })}>
                                            <FaFileAlt className="me-1" /> Контент
                                        </button>
                                        <button className="btn btn-outline-success btn-sm flex-fill" 
                                            onClick={() => onCourseView({ page: 'course-test-student', data: course })}>
                                            <FaQuestionCircle className="me-1" /> Тест
                                        </button>
                                        <button className="btn btn-outline-warning btn-sm flex-fill" 
                                            onClick={() => openReviewModal(course)}>
                                            <FaStar className="me-1" /> Отзыв
                                        </button>
                                        <button className="btn btn-outline-danger btn-sm w-100 mt-1" 
                                            onClick={() => handleUnenroll(course.id, course.title)}>
                                            <FaTimes className="me-1" /> Отписаться
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* МОДАЛЬНОЕ ОКНО ОТЗЫВА */}
            {showReviewModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg">
                            <div className="modal-header bg-warning text-dark">
                                <h5 className="modal-title fw-bold">
                                    <FaStar className="me-2" />
                                    {reviewText ? "Редактировать отзыв" : "Оставить отзыв"}
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setShowReviewModal(false)}></button>
                            </div>
                            <div className="modal-body p-4">
                                <p className="text-muted text-center mb-4">Курс: <strong>{selectedCourseForReview?.title}</strong></p>
                                
                                <div className="mb-4 text-center">
                                    <label className="form-label d-block mb-3 text-uppercase small fw-bold text-secondary">Ваша оценка</label>
                                    <div className="d-flex justify-content-center gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <FaStar 
                                                key={star}
                                                size={35}
                                                style={{ 
                                                    cursor: 'pointer', 
                                                    color: star <= rating ? '#ffc107' : '#dee2e6',
                                                    transition: 'transform 0.2s'
                                                }}
                                                onMouseEnter={(e) => e.target.style.transform = 'scale(1.2)'}
                                                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                                                onClick={() => setRating(star)}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label small fw-bold text-secondary text-uppercase">Ваш комментарий</label>
                                    <textarea 
                                        className="form-control border-2" 
                                        rows="4" 
                                        value={reviewText}
                                        onChange={(e) => setReviewText(e.target.value)}
                                        placeholder="Поделитесь впечатлениями о курсе..."
                                        style={{ resize: 'none' }}
                                    ></textarea>
                                </div>
                            </div>
                            <div className="modal-footer border-0 p-3">
                                <button className="btn btn-light px-4" onClick={() => setShowReviewModal(false)}>Отмена</button>
                                <button 
                                    className="btn btn-warning px-4 fw-bold" 
                                    onClick={submitReview}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? "Сохранение..." : "Сохранить"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};