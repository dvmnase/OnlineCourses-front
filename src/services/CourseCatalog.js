import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    FaBookOpen, FaInfoCircle, FaCheckCircle, FaUserGraduate, 
    FaExclamationTriangle, FaStar, FaUser, FaTimes, 
    FaCalendarAlt, FaEnvelope, FaCommentDots, FaUserCircle
} from 'react-icons/fa';

const API_URL = 'http://localhost:8080';

// Хелпер для авторизации
const authHeader = () => {
    const token = localStorage.getItem('access_token');
    return { headers: { Authorization: `Bearer ${token}` } };
};

// --- КОМПОНЕНТ 1: ОТОБРАЖЕНИЕ ЗВЕЗД ---
const StarRating = ({ rating }) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    return (
        <div className="text-warning d-inline-block">
            {[...Array(5)].map((_, i) => {
                if (i < fullStars) return <FaStar key={i} />;
                return <FaStar key={i} className="text-muted" style={{ opacity: 0.5 }} />;
            })}
            <span className="text-dark ms-2 fw-bold">{rating > 0 ? rating.toFixed(1) : '0.0'}</span>
        </div>
    );
};

// --- КОМПОНЕНТ 2: СПИСОК ОТЗЫВОВ (МОДАЛЬНОЕ ОКНО) ---
const ReviewsListModal = ({ reviews, courseTitle, onClose }) => {
    return (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', zIndex: 1100 }}>
            <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
                <div className="modal-content shadow-lg border-0">
                    <div className="modal-header bg-dark text-white">
                        <h5 className="modal-title"><FaCommentDots className="me-2" /> Отзывы: {courseTitle}</h5>
                        <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
                    </div>
                    <div className="modal-body p-4">
                        {reviews.length === 0 ? (
                            <p className="text-center text-muted">Для этого курса еще нет отзывов.</p>
                        ) : (
                            reviews.map((rev) => (
                                <div key={rev.id} className="card mb-3 border-0 bg-light shadow-sm">
                                    <div className="card-body">
                                       <div className="bg-primary-subtle rounded-circle p-2 me-3">
                                                <FaUserCircle className="text-primary" size={24} />
                                            </div>
                                        <p className="card-text mb-0 italic">"{rev.reviewText || 'Без комментария'}"</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="modal-footer">
                        <button className="btn btn-secondary w-100" onClick={onClose}>Закрыть список</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- КОМПОНЕНТ 3: ДЕТАЛИ КУРСА ---
const CourseDetailsModal = ({ course, averageRating, reviews, onClose, onEnroll }) => {
    const [showAllReviews, setShowAllReviews] = useState(false);
    if (!course) return null;

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    return (
        <>
            <div className="modal show d-block" style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', overflowY: 'auto', zIndex: 1050 }} onClick={onClose}>
                <div className="modal-dialog modal-xl modal-dialog-centered" onClick={e => e.stopPropagation()}>
                    <div className="modal-content shadow-lg rounded-4 border-0">
                        <div className="modal-header bg-primary text-white p-4">
                            <h3 className="modal-title fw-bolder mb-0">{course.title}</h3>
                            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
                        </div>
                        
                        <div className="modal-body p-5">
                            <div className="d-flex justify-content-between align-items-start mb-4">
                                <div>
                                    <h5 className="text-muted mb-2">Рейтинг курса:</h5>
                                    <StarRating rating={averageRating} />
                                    <button 
                                        className="btn btn-link btn-sm text-primary ms-2" 
                                        onClick={() => setShowAllReviews(true)}
                                    >
                                        Посмотреть все отзывы ({reviews.length})
                                    </button>
                                </div>
                                <span className="badge bg-success py-2 px-3"><FaCheckCircle className="me-1" /> Опубликован</span>
                            </div>

                            <div className="card shadow-sm border-0 mb-4 bg-light">
                                <div className="card-body">
                                    <div className="row">
                                        <div className="col-md-6">
                                            <p><FaUser className="me-2 text-primary" /> <strong>Автор:</strong> {course.authorName || 'Неизвестно'}</p>
                                        </div>
                                        <div className="col-md-6">
                                            <p><FaCalendarAlt className="me-2 text-primary" /> <strong>Создан:</strong> {formatDate(course.createdAt)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <h4 className="border-bottom pb-2">Описание</h4>
                            <div style={{ whiteSpace: 'pre-wrap' }} className="text-secondary">{course.description}</div>
                        </div>

                        <div className="modal-footer justify-content-between p-4 bg-light">
                            <button className="btn btn-outline-secondary px-4" onClick={onClose}><FaTimes /> Закрыть</button>
                            <button className="btn btn-primary px-4 fw-bold" onClick={(e) => onEnroll(course.id, course.title, e)}>
                                <FaUserGraduate className="me-1" /> Записаться
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {showAllReviews && (
                <ReviewsListModal 
                    reviews={reviews} 
                    courseTitle={course.title} 
                    onClose={() => setShowAllReviews(false)} 
                />
            )}
        </>
    );
};

// --- ОСНОВНОЙ КОМПОНЕНТ КАТАЛОГА ---
export const CourseCatalog = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Состояния для деталей
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [selectedCourseRating, setSelectedCourseRating] = useState(0);
    const [selectedCourseReviews, setSelectedCourseReviews] = useState([]);

    const fetchPublishedCourses = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/api/student/courses/published`, authHeader());
            // Для каждого курса подгрузим его средний рейтинг сразу (опционально)
            // Но в данном коде будем подгружать при открытии для экономии ресурсов
            setCourses(response.data);
        } catch (err) {
            setError('Ошибка загрузки каталога.');
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = async (courseId, courseTitle) => {
        try {
            // Выполняем 3 запроса параллельно: сам курс, средний рейтинг и все отзывы
            const [detailsRes, ratingRes, reviewsRes] = await Promise.all([
                axios.get(`${API_URL}/api/student/courses/${courseId}`, authHeader()),
                axios.get(`${API_URL}/api/student/reviews/${courseId}/average`, authHeader()),
                axios.get(`${API_URL}/api/student/reviews/${courseId}`, authHeader())
            ]);

            setSelectedCourse(detailsRes.data);
            setSelectedCourseRating(ratingRes.data || 0);
            setSelectedCourseReviews(reviewsRes.data || []);
        } catch (err) {
            alert('Не удалось загрузить данные курса.');
        }
    };

    const handleEnroll = async (courseId, courseTitle, e) => {
        e.stopPropagation();
        if (!window.confirm(`Записаться на "${courseTitle}"?`)) return;
        try {
            await axios.post(`${API_URL}/api/student/courses/${courseId}/enroll`, {}, authHeader());
            alert('Вы успешно записаны!');
            setSelectedCourse(null);
        } catch (err) {
            alert('Ошибка при записи.');
        }
    };

    useEffect(() => { fetchPublishedCourses(); }, []);

    return (
        <div className="container py-5" style={{ marginTop: '80px' }}>
            <h2 className="mb-5 text-center fw-light"><FaBookOpen className="me-2 text-primary" /> Каталог курсов</h2>
            
            {loading ? (
                <div className="text-center p-5">Загрузка...</div>
            ) : error ? (
                <div className="alert alert-danger">{error}</div>
            ) : (
                <div className="row">
                    {courses.map((course) => (
                        <div key={course.id} className="col-md-4 mb-4">
                            <div className="card h-100 shadow-sm course-card-hover" onClick={() => handleViewDetails(course.id, course.title)} style={{ cursor: 'pointer' }}>
                                <div className="card-body p-4">
                                    <h5 className="card-title fw-bold">{course.title}</h5>
                                    <p className="card-text text-muted small" style={{ minHeight: '60px' }}>{course.description}</p>
                                    <div className="border-top pt-2">
                                        <small className="text-secondary"><FaUser className="me-1" /> {course.authorName}</small>
                                    </div>
                                </div>
                                <div className="card-footer bg-white border-0 p-3">
                                    <button className="btn btn-primary btn-sm w-100" onClick={(e) => handleEnroll(course.id, course.title, e)}>
                                        Записаться
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <CourseDetailsModal 
                course={selectedCourse} 
                averageRating={selectedCourseRating}
                reviews={selectedCourseReviews}
                onClose={() => setSelectedCourse(null)} 
                onEnroll={handleEnroll} 
            />
        </div>
    );
};