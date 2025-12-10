import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ContentForm } from '../components/ContentForm';
const API_URL = 'http://localhost:8080';

const authHeader = () => {
    const token = localStorage.getItem('access_token');
    return {
        headers: { Authorization: `Bearer ${token}` }
    };
};

export const CourseContentManagement = ({ courseId,courseTitle, onBack }) => {
    // ... (Существующие хуки)
    const [contentList, setContentList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAddingContent, setIsAddingContent] = useState(false);
    // НОВОЕ: Состояние для редактируемого элемента
    const [editingContent, setEditingContent] = useState(null); 
    
    // Функция скачивания (перенесена с предыдущего шага)
    const handleDownloadFile = async (downloadUrl, suggestedFileName) => {
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


    // Функция загрузки контента (с логикой получения ссылок)
    const fetchCourseContent = async () => {
        // ... (логика fetchCourseContent как в предыдущем ответе)
        // (Оставлена без изменений для краткости, она работает)
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
                
                return {
                    ...item,
                    downloadUrl: downloadUrl
                };
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

    // ... (useEffect и handleContentSaved)

    useEffect(() => {
        if (courseId) {
            fetchCourseContent();
        }
    }, [courseId]);


    const handleContentSaved = () => {
        setIsAddingContent(false); // Закрываем форму добавления
        setEditingContent(null); // Закрываем форму редактирования
        fetchCourseContent(); // Обновляем список
    };


    // НОВАЯ ФУНКЦИЯ: Удаление контента
    const handleDeleteContent = async (contentId, title) => {
        if (!window.confirm(`Вы уверены, что хотите удалить элемент "${title}"? Это действие необратимо.`)) {
            return;
        }

        try {
            // DELETE /api/content/{id}
            await axios.delete(`${API_URL}/api/content/${contentId}`, authHeader());
            alert(`Элемент "${title}" успешно удален.`);
            fetchCourseContent(); // Обновляем список
        } catch (err) {
            setError('Не удалось удалить контент.');
            console.error(err);
            alert('Не удалось удалить контент. Проверьте права доступа.');
        }
    };

    // НОВАЯ ФУНКЦИЯ: Запуск режима редактирования
    const handleEditClick = (contentItem) => {
        setEditingContent(contentItem);
        setIsAddingContent(false); // Убедимся, что форма добавления закрыта
    };
    
    // ... (Условный рендеринг)

    // 3. Условный рендеринг формы (ранний return)
    // Условие для редактирования или добавления
    if (isAddingContent || editingContent) {
        return (
            <ContentForm 
                courseId={courseId}
                // Передаем текущий объект для редактирования (или null для добавления)
                initialData={editingContent} 
                onSave={handleContentSaved} 
                onCancel={() => {
                    setIsAddingContent(false);
                    setEditingContent(null);
                }}
            />
        );
    }
    
    // ... (Условный рендеринг загрузки/ошибки)

    return (
        <div className="container py-5" style={{ marginTop: '80px' }}>
          <button className="btn btn-secondary mb-4" onClick={onBack}>
                ← Назад к списку курсов
            </button>
            
            <button className="btn btn-success mb-4" onClick={() => setIsAddingContent(true)}>
                + Добавить новый элемент
            </button>

            {contentList.length === 0 ? (
                <p>В этом курсе пока нет содержания.</p>
            ) : (
                <ul className="list-group">
                    {contentList.map(item => (
                        <li key={item.id} className="list-group-item d-flex justify-content-between align-items-center">
                            {/* Отображение контента и ссылки на скачивание (как в предыдущем шаге) */}
                            <div>
                                <strong>{item.title}.</strong> ({item.contentType})
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
                                {/* КНОПКА ИЗМЕНИТЬ (запускает режим редактирования) */}
                                <button 
                                    className="btn btn-sm btn-outline-info me-2"
                                    onClick={() => handleEditClick(item)}
                                >
                                    Изменить
                                </button>
                                {/* КНОПКА УДАЛИТЬ (вызывает DELETE-запрос) */}
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