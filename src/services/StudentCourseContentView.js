import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaFilePdf, FaExternalLinkAlt, FaDownload, FaVideo, FaBookOpen, FaHourglassHalf, FaExclamationTriangle } from 'react-icons/fa';

const API_URL = 'http://localhost:8080';

const authHeader = () => {
    const token = localStorage.getItem('access_token');
    return {
        headers: { Authorization: `Bearer ${token}` }
    };
};

export const StudentCourseContentView = ({ course, onBack }) => {
    const courseId = course.id;
    const [contentList, setContentList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Функция, похожая на ту, что используется в CourseContentManagement
    const fetchCourseContent = async () => {
        setLoading(true);
        setError(null);
        try {
            // 1. Получаем список контента для курса
            const contentResponse = await axios.get(`${API_URL}/api/content/course/${courseId}`, authHeader());
            const contentData = contentResponse.data;

            // 2. Для элементов, содержащих файл, запрашиваем ссылку на скачивание (как в CourseContentManagement)
            const contentWithLinksPromises = contentData.map(async (item) => {
                const isFileContent = item.contentType === 'PDF' || item.contentType === 'FILE';
                let downloadUrl = null;
                if (isFileContent) {
                    try {
                        // Эндпоинт, который возвращает DTO с URL для скачивания
                        const linkResponse = await axios.get(`${API_URL}/api/content/${item.id}`, authHeader());
                        downloadUrl = linkResponse.data.downloadUrl; 
                    } catch (linkError) {
                        console.warn(`Не удалось получить ссылку для контента ID ${item.id}:`, linkError);
                    }
                }
                return { ...item, downloadUrl: downloadUrl };
            });
            
            const contentWithLinks = await Promise.all(contentWithLinksPromises);
            // Сортировка по orderIndex, если он есть
            const sortedContent = contentWithLinks.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
            
            setContentList(sortedContent);
        } catch (err) {
            setError('Не удалось загрузить содержание курса. Возможно, курс не имеет контента.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    
    // --- Обработчик скачивания файла (тот же, что и у автора) ---
    const handleDownloadFile = async (downloadUrl, suggestedFileName) => {
        try {
            const response = await axios.get(downloadUrl, {
                ...authHeader(), 
                responseType: 'blob', // Важно для скачивания бинарных данных
            });
            // Логика извлечения имени файла из заголовков (Content-Disposition)
            let finalFileName = suggestedFileName || 'download.bin';
            const disposition = response.headers['content-disposition'];
            if (disposition && disposition.indexOf('attachment') !== -1) {
                const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                const matches = filenameRegex.exec(disposition);
                if (matches != null && matches[1]) {
                    finalFileName = matches[1].replace(/['"]/g, '');
                }
            }
            
            // Создание и активация ссылки для скачивания
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
            alert("Не удалось скачать файл. Проверьте права доступа.");
        }
    };

    useEffect(() => {
        if (courseId) {
            fetchCourseContent();
        }
    }, [courseId]);


    // --- Функция для определения иконки ---
    const getIconForContentType = (type) => {
        switch (type) {
            case 'PDF': return <FaFilePdf className="me-2 text-danger" />;
            case 'VIDEO': return <FaVideo className="me-2 text-primary" />;
            case 'LINK': return <FaExternalLinkAlt className="me-2 text-info" />;
            case 'TEXT': return <FaBookOpen className="me-2 text-success" />;
            default: return <FaFilePdf className="me-2 text-secondary" />; // FILE по умолчанию
        }
    };

    // --- РЕНДЕРИНГ ---
    return (
        <div className="container py-5" style={{ marginTop: '80px' }}>
            <button className="btn btn-secondary mb-4" onClick={onBack}>
                ← Назад к Моему обучению
            </button>
            
            <h2 className="mb-4 text-primary">📚 Контент курса: {course.title}</h2>

            {loading ? (
                <div className="text-center p-5"><FaHourglassHalf className="me-2 text-primary" /> Загрузка содержания...</div>
            ) : error ? (
                <div className="alert alert-danger text-center"><FaExclamationTriangle className="me-2" /> {error}</div>
            ) : contentList.length === 0 ? (
                <div className="alert alert-info text-center">
                    Содержание для этого курса пока не добавлено.
                </div>
            ) : (
                <ul className="list-group shadow-sm">
                    {contentList.map(item => (
                        <li key={item.id} className="list-group-item d-flex justify-content-between align-items-center">
                            
                            <div className="d-flex align-items-center flex-grow-1 me-3">
                                {getIconForContentType(item.contentType)}
                                <div>
                                    <strong className="d-block">{item.title}</strong>
                                    <small className="text-muted">{item.contentType} | Порядок: {item.orderIndex}</small>
                                </div>
                            </div>
                            
                            {/* Блок действий */}
                            <div className="d-flex gap-2">
                                
                                {/* Действие для PDF/FILE: СКАЧАТЬ */}
                                {(item.contentType === 'PDF' || item.contentType === 'FILE') && item.downloadUrl && (
                                    <button 
                                        className="btn btn-sm btn-success"
                                        onClick={() => handleDownloadFile(item.downloadUrl, item.title || 'файл_курса')} 
                                    >
                                        <FaDownload className="me-1" /> Скачать
                                    </button>
                                )}

                                {/* Действие для LINK: ОТКРЫТЬ */}
                                {item.contentType === 'LINK' && item.contentLink && (
                                    <a 
                                        href={item.contentLink} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="btn btn-sm btn-info text-white"
                                    >
                                        <FaExternalLinkAlt className="me-1" /> Перейти
                                    </a>
                                )}

                                {/* Действие для TEXT/VIDEO: ПОСМОТРЕТЬ (Может быть реализовано позже) */}
                                {(item.contentType === 'TEXT' || item.contentType === 'VIDEO') && (
                                    <button 
                                        className="btn btn-sm btn-outline-secondary"
                                        onClick={() => alert(`Просмотр контента: ${item.title} (В разработке)`)}
                                    >
                                        Просмотреть
                                    </button>
                                )}
                            </div>

                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

