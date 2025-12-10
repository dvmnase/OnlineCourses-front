import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ContentForm } from '../components/ContentForm';
// Импортируем компонент для управления тестами
import { CourseTestManagement } from './CourseTestManagement'; 

const API_URL = 'http://localhost:8080';

const authHeader = () => {
    const token = localStorage.getItem('access_token');
    return {
        headers: { Authorization: `Bearer ${token}` }
    };
};

// Удаляем onManageTests из пропсов, так как логика переключения теперь внутри
export const CourseContentManagement = ({ courseId, courseTitle, onBack }) => {
    
    // --- НОВОЕ СОСТОЯНИЕ: Управление режимом отображения ---
    const [viewMode, setViewMode] = useState('content'); // 'content' или 'tests'
    // --- Существующие хуки для контента ---
    const [contentList, setContentList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAddingContent, setIsAddingContent] = useState(false);
    const [editingContent, setEditingContent] = useState(null); 
    
    // --- Дополнительное состояние для управления вопросами теста ---
    const [managingQuestions, setManagingQuestions] = useState(null); // { testId, testTitle }


    // =================================================================
    // 1. ФУНКЦИИ КОНТЕНТА (Без изменений)
    // =================================================================

    const handleDownloadFile = async (downloadUrl, suggestedFileName) => {
        // ... (Ваша рабочая логика скачивания файла)
        try {
            const response = await axios.get(downloadUrl, {
                ...authHeader(), 
                responseType: 'blob',
            });
            let finalFileName = suggestedFileName || 'download.bin';
            const disposition = response.headers['content-disposition'];
            if (disposition && disposition.indexOf('attachment') !== -1) {
                const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                const matches = filenameRegex.exec(disposition);
                if (matches != null && matches[1]) {
                    finalFileName = matches[1].replace(/['"]/g, '');
                }
            }
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', finalFileName);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Ошибка при скачивании файла:", error);
            alert("Не удалось скачать файл. Возможно, требуется повторная авторизация.");
        }
    };

    const fetchCourseContent = async () => {
        setLoading(true);
        setError(null);
        try {
            const contentResponse = await axios.get(`${API_URL}/api/content/course/${courseId}`, authHeader());
            const contentData = contentResponse.data;
            const contentWithLinksPromises = contentData.map(async (item) => {
                const isFileContent = item.contentType === 'PDF' || item.contentType === 'FILE';
                let downloadUrl = null;
                if (isFileContent) {
                    try {
                        const linkResponse = await axios.get(`${API_URL}/api/content/${item.id}`, authHeader());
                        downloadUrl = linkResponse.data.downloadUrl;
                    } catch (linkError) {
                        console.warn(`Не удалось получить ссылку для контента ID ${item.id}:`, linkError);
                    }
                }
                return { ...item, downloadUrl: downloadUrl };
            });
            const contentWithLinks = await Promise.all(contentWithLinksPromises);
            const sortedContent = contentWithLinks.sort((a, b) => a.orderIndex - b.orderIndex);
            setContentList(sortedContent);
        } catch (err) {
            setError('Не удалось загрузить содержание курса.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        if (courseId && viewMode === 'content') {
            fetchCourseContent();
        }
    }, [courseId, viewMode]);


    const handleContentSaved = () => {
        setIsAddingContent(false); 
        setEditingContent(null); 
        fetchCourseContent(); 
    };

    const handleDeleteContent = async (contentId, title) => {
        if (!window.confirm(`Вы уверены, что хотите удалить элемент "${title}"? Это действие необратимо.`)) {
            return;
        }
        try {
            await axios.delete(`${API_URL}/api/content/${contentId}`, authHeader());
            alert(`Элемент "${title}" успешно удален.`);
            fetchCourseContent(); 
        } catch (err) {
            setError('Не удалось удалить контент.');
            console.error(err);
            alert('Не удалось удалить контент. Проверьте права доступа.');
        }
    };

    const handleEditClick = (contentItem) => {
        setEditingContent(contentItem);
        setIsAddingContent(false); 
    };
    
    // =================================================================
    // 2. ФУНКЦИИ ТЕСТОВ
    // =================================================================

    // Функция для перехода в режим управления вопросами (для CourseTestManagement)
    const handleManageQuestions = (testId, testTitle) => {
        setManagingQuestions({ testId, testTitle });
    };

    // Функция для возврата из управления вопросами (если мы их реализовали)
    const handleBackFromQuestions = () => {
        setManagingQuestions(null);
    };


    // =================================================================
    // 3. УСЛОВНЫЙ РЕНДЕРИНГ
    // =================================================================

    // 3.1. РЕНДЕРИНГ: Форма контента (добавление/редактирование)
    if (isAddingContent || editingContent) {
        return (
            <ContentForm 
                courseId={courseId}
                initialData={editingContent} 
                onSave={handleContentSaved} 
                onCancel={() => {
                    setIsAddingContent(false);
                    setEditingContent(null);
                }}
            />
        );
    }
    
    // 3.2. РЕНДЕРИНГ: Управление тестами (главная страница тестов)
    if (viewMode === 'tests') {
        
        // TODO: Здесь должна быть логика для управления вопросами, если managingQuestions не null.
        // Пока просто возвращаем CourseTestManagement
        
        return (
            <CourseTestManagement 
                courseId={courseId}
                courseTitle={courseTitle}
                // Назад ведет к управлению контентом
                onBack={() => setViewMode('content')} 
                onManageQuestions={handleManageQuestions}
            />
        );
    }

    // 3.3. РЕНДЕРИНГ: Управление контентом (по умолчанию, viewMode === 'content')
    
    if (loading) return <div className="text-center" style={{ marginTop: '80px' }}>Загрузка контента курса...</div>;
    if (error) return <div className="error-message text-center" style={{ marginTop: '80px' }}>{error}</div>;

    return (
        <div className="container py-5" style={{ marginTop: '80px' }}>
            <button className="btn btn-secondary mb-4" onClick={onBack}>
                ← Назад к списку курсов
            </button>
            
            <h2 className="mb-4">Содержание курса: {courseTitle}</h2>
            
            <div className="d-flex mb-4">
                <button className="btn btn-success me-3" onClick={() => setIsAddingContent(true)}>
                    + Добавить новый элемент
                </button>
                
                {/* КНОПКА, КОТОРАЯ ПЕРЕКЛЮЧАЕТ viewMode */}
                <button className="btn btn-primary" onClick={() => setViewMode('tests')}> 
                    Перейти к тестам
                </button>
            </div>
            
            {contentList.length === 0 ? (
                <p>В этом курсе пока нет содержания.</p>
            ) : (
                <ul className="list-group">
                    {contentList.map(item => (
                        <li key={item.id} className="list-group-item d-flex justify-content-between align-items-center">
                            
                            <div>
                                <strong>{item.title}</strong> ({item.contentType})
                                {item.downloadUrl && (
                                    <span className="ms-3">
                                        <button 
                                            className="btn btn-link p-0 text-success small"
                                            onClick={() => handleDownloadFile(item.downloadUrl, item.title || 'файл_курса')} 
                                            style={{ textDecoration: 'none' }}
                                        >
                                            [Скачать файл]
                                        </button>
                                    </span>
                                )}
                            </div>
                            
                            {/* Кнопки действий */}
                            <div>
                                <button 
                                    className="btn btn-sm btn-outline-info me-2"
                                    onClick={() => handleEditClick(item)}
                                >
                                    Изменить
                                </button>
                                <button 
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => handleDeleteContent(item.id, item.title)}
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