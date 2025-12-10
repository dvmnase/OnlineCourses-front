import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:8080';

// Вспомогательная функция для получения заголовков с токеном
const authHeader = () => {
    const token = localStorage.getItem('access_token');
    return {
        headers: { Authorization: `Bearer ${token}` }
    };
};

export const CourseManagement = ({ onCourseSelect }) => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [currentCourse, setCurrentCourse] = useState(null);
    const [isCreating, setIsCreating] = useState(false);

    // --- ФУНКЦИИ ЗАГРУЗКИ ---

    const fetchMyCourses = async () => {
        setLoading(true);
        setError(null);
        try {
            // GET /api/courses/my-courses
            const response = await axios.get(`${API_URL}/api/courses/my-courses`, authHeader());
            setCourses(response.data);
        } catch (err) {
            setError('Не удалось загрузить ваши курсы. Проверьте аутентификацию.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyCourses();
    }, []);

    // --- ФУНКЦИИ ИЗМЕНЕНИЯ ---

    const handleEditClick = (course) => {
        setCurrentCourse(course);
        setIsEditing(true);
        setIsCreating(false);
    };

    const handleNewClick = () => {
        setCurrentCourse({ title: '', description: '', isPublished: false }); // Инициализация нового курса
        setIsCreating(true);
        setIsEditing(true);
    };

    const handleSave = async (courseData) => {
        setError(null);
        
        try {const baseDataToSend = {
            title: courseData.title,
            description: courseData.description,
        };
        let dataToSend;
                
            if (isCreating) {
                // Создание (POST)
                // POST /api/courses
                dataToSend = baseDataToSend;
                await axios.post(`${API_URL}/api/courses`, dataToSend, authHeader());
                alert('Курс успешно создан!');
            } else {
                // Обновление (PUT)
                // PUT /api/courses/{id}
                dataToSend = {
                ...baseDataToSend,
                isPublished:  false 
            };
                await axios.put(`${API_URL}/api/courses/${courseData.id}`, dataToSend, authHeader());
                alert('Курс успешно обновлен!');
            }
            
            setIsEditing(false);
            setIsCreating(false);
            setCurrentCourse(null);
            fetchMyCourses(); // Обновление списка
            
        } catch (err) {
            setError(`Ошибка при сохранении курса: ${err.response?.data?.message || err.message}`);
        }
    };

    const handleDelete = async (courseId) => {
        if (!window.confirm("Вы уверены, что хотите удалить этот курс?")) return;

        setError(null);
        try {
            // DELETE /api/courses/{id}
            await axios.delete(`${API_URL}/api/courses/${courseId}`, authHeader());
            alert('Курс успешно удален (архивирован)!');
            fetchMyCourses(); // Обновление списка
        } catch (err) {
            setError('Ошибка при удалении курса. Возможно, у вас нет прав.');
            console.error(err);
        }
    };

    if (loading) return <div className="text-center">Загрузка курсов...</div>;
    if (error) return <div className="error-message text-center">{error}</div>;

    // --- РЕНДЕРИНГ ФОРМЫ (СОЗДАНИЕ/РЕДАКТИРОВАНИЕ) ---

    if (isEditing) {
        return (
            <CourseForm
                course={currentCourse}
                onSave={handleSave}
                onCancel={() => setIsEditing(false)}
                isNew={isCreating}
            />
        );
    }
    
    // --- РЕНДЕРИНГ СПИСКА КУРСОВ ---

  return (
        <div id="my-courses-management" className="container py-5"style={{ marginTop: '100px' }} >
            <h2 className="text-center mb-4">Мои курсы</h2>
            
            {/* УЛУЧШЕНИЕ КНОПКИ: Используем класс для лучшей видимости */}
            <button className="btn btn-primary mb-4" onClick={handleNewClick} style={{ backgroundColor: '#1abc9c', borderColor: '#1abc9c' }}>
                + Создать новый курс
            </button>

            {courses.length === 0 ? (
                <p className="text-center">Курсы пока не созданы.</p>
            ) : (
                <table className="table table-striped">
                    <thead>
                        <tr>
                            <th>Название</th>
                            <th>Описание (фрагмент)</th> {/* НОВОЕ ПОЛЕ */}
                            <th>Статус</th>
                            <th>Дата создания</th> {/* НОВОЕ ПОЛЕ */}
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {courses.map(course => (
                            <tr

                                key={course.id}

                                // !!! ИЗМЕНЕНИЕ ЗДЕСЬ: ПЕРЕДАЕМ ID И TITLE !!!

                                onClick={() => onCourseSelect({ id: course.id, title: course.title })}

                                style={{ cursor: 'pointer' }}

                                className="course-row-hover"

                            >
                                <td>{course.title}</td>
                                <td>{course.description ? course.description.substring(0, 50) + '...' : 'Нет описания'}</td> {/* ОГРАНИЧИВАЕМ ДЛИНУ */}
                                <td>{course.isPublished ? 'Опубликован' : 'Черновик'}</td>
                                <td>{new Date(course.createdAt).toLocaleDateString()}</td> {/* ФОРМАТИРУЕМ ДАТУ */}
                                <td>
                                    {/* ДОБАВЛЯЕМ ОТСТУП С ПОМОЩЬЮ margin-right */}
                                    <button 
                                        className="btn btn-sm btn-info" 
                                        onClick={() => handleEditClick(course)}
                                        style={{ marginRight: '10px' }}> 
                                        Изменить
                                    </button>
                                    <button 
                                        className="btn btn-sm btn-danger" 
                                        onClick={() => handleDelete(course.id)}>
                                        Архивировать
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

// --- ВСПОМОГАТЕЛЬНЫЙ КОМПОНЕНТ ФОРМЫ ---

const CourseForm = ({ course, onSave, onCancel, isNew }) => {
    const [formData, setFormData] = useState(course);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

   return (
        <div className="container py-5" style={{ marginTop: '80px' }}>
            <h3 className="mb-4">{isNew ? 'Создание нового курса' : `Редактирование: ${course.title}`}</h3>
            <form onSubmit={handleSubmit} className="card p-4">
                <div className="mb-3">
                    <label className="form-label">Название:</label>
                    <input 
                        type="text" 
                        name="title" 
                        value={formData.title} 
                        onChange={handleChange} 
                        className="form-control"
                        required 
                    />
                </div>
                <div className="mb-3">
                    <label className="form-label">Описание:</label>
                    <textarea 
                        name="description" 
                        value={formData.description || ''}
                        onChange={handleChange} 
                        className="form-control"
                        rows="4"
                        required 
                    />
                </div>
                
                {/* !!! УДАЛЕНО: Чекбокс isPublished удален полностью, чтобы учитель не мог его менять !!! */}
                
                {/* 2. Увеличение расстояния между кнопками */}
                <div className="d-flex" style={{ justifyContent: 'flex-start', gap: '20px' }}>
                    <button type="submit" className="btn btn-success">
                        Сохранить
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={onCancel}>
                        Отмена
                    </button>
                </div>
            </form>
        </div>
    );
};