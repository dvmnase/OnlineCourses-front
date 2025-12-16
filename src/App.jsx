import React, { useState, useEffect } from "react";
import { Navigation } from "./components/navigation";
import { Header } from "./components/header";
import { Features } from "./components/features";
import { About } from "./components/about";
import { Services } from "./components/services";
import { Gallery } from "./components/gallery";
import { Testimonials } from "./components/testimonials";
import { Team } from "./components/Team";
import { Contact } from "./components/contact";
import JsonData from "./data/data.json";
import SmoothScroll from "smooth-scroll";
import "./App.css";

import { AuthModal } from './components/AuthModal';

// Импорт компонентов страниц
import { CourseManagement } from './services/CourseManagement';
import { CourseCatalog } from './services/CourseCatalog';
import { CourseContentManagement } from './services/CourseContentManagement';
import { MyLearning } from './services/MyLearning';
import { StudentCourseContentView } from './services/StudentCourseContentView';

// =======================================================
// PLACEHOLDERS: Предполагаемые компоненты для студента
// =======================================================



// Компонент-заглушка для прохождения тестов студентом
const StudentCourseTestView = ({ course, onBack }) => (
    <div className="container py-5 mt-5">
        <h1 className="text-success">Тесты курса: {course.title}</h1>
        <p>ID курса: {course.id}</p>
        <button onClick={onBack} className="btn btn-secondary">
            ← Назад к Моему обучению
        </button>
        <div className="mt-4 border p-3">
            {/* Здесь будет логика отображения тестов, полученных через API */}
            Раздел тестирования в разработке.
        </div>
    </div>
);

// =======================================================
// ГЛАВНЫЙ КОМПОНЕНТ APP
// =======================================================

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

    // Состояние для управления курсом (Учитель)
    const [selectedCourse, setSelectedCourse] = useState(null); 
    
    // НОВОЕ СОСТОЯНИЕ ДЛЯ УПРАВЛЕНИЯ КУРСОМ (Студент)
    const [studentSelectedCourse, setStudentSelectedCourse] = useState(null); 
    
    // --- НОВОЕ СОСТОЯНИЕ ДЛЯ УПРАВЛЕНИЯ ТЕКУЩЕЙ СТРАНИЦЕЙ ---
    const [currentPage, setCurrentPage] = useState('home'); 

    // Функция для возврата к списку курсов (Учитель)
    const handleBackToCourses = () => setSelectedCourse(null);
    
    // Функция для возврата к "Моему обучению" (Студент)
    const handleBackToMyLearning = () => {
        setStudentSelectedCourse(null);
        setCurrentPage('my-learning');
    };

    // Функция для выбора курса и перехода к контенту (Учитель)
    const handleCourseSelect = (courseData) => setSelectedCourse(courseData);

    /**
     * ФУНКЦИЯ: Смена страницы (Поддерживает как строку, так и объект)
     * @param {string | {page: string, data: object}} target - Название страницы или объект перехода
     */
    const handlePageChange = (target) => {
        // Если передан объект (например, из MyLearning для перехода в контент/тест)
        if (typeof target === 'object' && target !== null && target.page) {
            setCurrentPage(target.page);
            setStudentSelectedCourse(target.data); // Сохраняем данные курса для студента
        } else if (typeof target === 'string') {
            // Если передана строка (для обычной навигации)
            setCurrentPage(target);
            setSelectedCourse(null); // Сброс курса учителя
            setStudentSelectedCourse(null); // Сброс курса студента
        }
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
                // Если студент залогинен, переходим к каталогу по умолчанию
                setCurrentPage('catalog'); 
            } else if (userRoleID === ROLE_TEACHER) {
                // Если учитель залогинен, переходим к управлению курсами
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

            // 1. Просмотр контента курса
            if (currentPage === 'course-content-student' && studentSelectedCourse) {
                return (
                    <StudentCourseContentView 
                        course={studentSelectedCourse} 
                        onBack={handleBackToMyLearning} 
                    />
                );
            }
            // 2. Просмотр тестов курса
            if (currentPage === 'course-test-student' && studentSelectedCourse) {
                 return (
                    <StudentCourseTestView 
                        course={studentSelectedCourse} 
                        onBack={handleBackToMyLearning} 
                    />
                );
            }

            // 3. Основная навигация
            switch(currentPage) {
                case 'catalog':
                    return <CourseCatalog />; // Каталог опубликованных курсов
                case 'my-learning':
                    // MyLearning использует handlePageChange для перехода к контенту/тестам
                    return <MyLearning onCourseView={handlePageChange} />; 
                // ... другие страницы студента
                default:
                    return <CourseCatalog />;
            }
            
        } else if (userRoleID === ROLE_TEACHER) {
            // УЧИТЕЛЬ

            // 1. Управление контентом/тестами конкретного курса
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
            
            // 2. Основная навигация
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