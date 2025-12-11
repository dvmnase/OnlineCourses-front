import React, { useState, useEffect } from "react";
import { Navigation } from "./components/navigation";
import { Header } from "./components/header";
import { Features } from "./components/features";
import { About } from "./components/about";
import { Services } from "./components/services";

// Проверьте пути: если вы переместили эти компоненты в './services/', оставьте, как есть.
// Если они в './components/', измените путь. Я использую путь из вашего последнего сообщения.
import { CourseManagement } from './services/CourseManagement';
import { CourseCatalog } from './services/CourseCatalog';
import { CourseContentManagement } from './services/CourseContentManagement';

import { Gallery } from "./components/gallery";
import { Testimonials } from "./components/testimonials";
import { Team } from "./components/Team";
import { Contact } from "./components/contact";
import JsonData from "./data/data.json";
import SmoothScroll from "smooth-scroll";
import "./App.css";

import { AuthModal } from './components/AuthModal';


export const scroll = new SmoothScroll('a[href*="#"]', {
    speed: 1000,
    speedAsDuration: true,
});

const App = () => {
    const [landingPageData, setLandingPageData] = useState({});
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Инициализация статуса
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('access_token'));
    const [userRoleID, setUserRoleID] = useState(
        localStorage.getItem('user_role_id') 
        ? parseInt(localStorage.getItem('user_role_id')) 
        : null
    );

    const ROLE_TEACHER = 2;
    const ROLE_STUDENT = 3;

    const [selectedCourse, setSelectedCourse] = useState(null);
    
    // --- НОВОЕ СОСТОЯНИЕ ДЛЯ УПРАВЛЕНИЯ ТЕКУЩЕЙ СТРАНИЦЕЙ ---
    const [currentPage, setCurrentPage] = useState('home'); 

    // Функция для возврата к списку курсов (Учитель)
    const handleBackToCourses = () => setSelectedCourse(null);
    
    // Функция для выбора курса и перехода к контенту (Учитель)
    const handleCourseSelect = (courseData) => setSelectedCourse(courseData);

    // --- ФУНКЦИЯ: Смена страницы ---
    const handlePageChange = (page) => {
        setCurrentPage(page);
        setSelectedCourse(null); // Сброс выбранного курса при смене страницы
    };

    // ФУНКЦИИ УПРАВЛЕНИЯ МОДАЛОМ
    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);

    // ФУНКЦИИ АУТЕНТИФИКАЦИИ
    const handleLoginSuccess = (token, roleId) => {
        if (token && roleId) {
            localStorage.setItem('access_token', token); 
            localStorage.setItem('user_role_id', roleId);
            setUserRoleID(roleId);
        }
        setIsLoggedIn(true);
        closeModal();
        
        // Переход на стартовую страницу после логина
        if (roleId === ROLE_STUDENT) {
            handlePageChange('catalog');
        } else if (roleId === ROLE_TEACHER) {
            handlePageChange('management');
        }
    };
    
    const handleLogout = () => {
        localStorage.removeItem('access_token'); 
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_role_id');
        setIsLoggedIn(false);
        setUserRoleID(null);
        handlePageChange('home'); // Возвращаемся на главную
    };

    useEffect(() => {
        setLandingPageData(JsonData);
        
        // Установка страницы при загрузке, если пользователь уже авторизован
        if (isLoggedIn) {
            if (userRoleID === ROLE_STUDENT) {
                setCurrentPage('catalog');
            } else if (userRoleID === ROLE_TEACHER) {
                setCurrentPage('management');
            }
        }
    }, [isLoggedIn, userRoleID]);


    // --- ФУНКЦИЯ ДЛЯ РЕНДЕРИНГА КОНТЕНТА ---
    const renderContent = () => {
        if (!isLoggedIn) {
            // ГОСТЬ: Показываем лендинг
            return (
                <>
                    <Header data={landingPageData.Header} />
                    <Features data={landingPageData.Features} />
                    <About data={landingPageData.About} />
                    <Services data={landingPageData.Services} />
                    <Gallery data={landingPageData.Gallery} />
                    <Testimonials data={landingPageData.Testimonials} />
                    <Team data={landingPageData.Team} />
                    <Contact data={landingPageData.Contact} />
                </>
            );
        }

        // ЛОГИКА АВТОРИЗОВАННОГО ПОЛЬЗОВАТЕЛЯ
        if (userRoleID === ROLE_STUDENT) {
            // СТУДЕНТ
            switch(currentPage) {
                case 'catalog':
                    return <CourseCatalog />; // Каталог опубликованных курсов
                case 'my-learning':
                    return <div className="container py-5 mt-5"><h1>Мои курсы (В разработке)</h1></div>;
                // ... другие страницы студента
                default:
                    return <CourseCatalog />;
            }
        } else if (userRoleID === ROLE_TEACHER) {
            // УЧИТЕЛЬ
            if (selectedCourse) {
                // Если выбран курс, показываем управление контентом
                return (
                    <CourseContentManagement 
                        courseId={selectedCourse.id}
                        courseTitle={selectedCourse.title}
                        onBack={handleBackToCourses} 
                    />
                );
            }
            switch(currentPage) {
                case 'management':
                case 'my-courses-management': // Ссылка из навигации
                    return <CourseManagement onCourseSelect={handleCourseSelect} />;
                case 'create-course':
                    return <div className="container py-5 mt-5"><h1>Создание нового курса (В разработке)</h1></div>;
                // ... другие страницы учителя
                default:
                    return <CourseManagement onCourseSelect={handleCourseSelect} />;
            }
        }
        
        // Если залогинен, но роль не определена
        return <div className="container py-5 mt-5"><h1>Добро пожаловать! Ваша роль не определена.</h1></div>;
    };


    return (
        <div>
            <Navigation 
                openAuthModal={openModal} 
                isLoggedIn={isLoggedIn} 
                onLogout={handleLogout} 
                userRoleID={userRoleID}
                onPageChange={handlePageChange} // Передаем обработчик смены страницы
            />
            
            {/* Рендерим контент на основе роли и текущей страницы */}
            {renderContent()}

            <AuthModal 
                show={isModalOpen} 
                onClose={closeModal} 
                onLoginSuccess={handleLoginSuccess}
            />

        </div>
    );
};

export default App;