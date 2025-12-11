import React, { useState } from 'react';

export const Navigation = (props) => {
    // Деструктурируем новый пропс onPageChange
    const { isLoggedIn, onLogout, openAuthModal, userRoleID, onPageChange } = props; 
    const [isMenuExpanded, setIsMenuExpanded] = useState(false);

    // ID ролей
    const ROLE_TEACHER = 2;
    const ROLE_ADMIN = 1;
    const ROLE_STUDENT = 3;
    
    const toggleMenu = () => {
        setIsMenuExpanded(!isMenuExpanded);
    };

    // --- Хелпер для клика по ссылке ---
    const handleNavClick = (e, pageKey) => {
        // Проверяем, что onPageChange существует, чтобы избежать ошибок
        if (onPageChange) {
            e.preventDefault(); 
            onPageChange(pageKey); 
            setIsMenuExpanded(false); // Закрываем мобильное меню
        }
    };

    // Функция для рендеринга меню, специфичного для ролей
    const renderRoleSpecificMenu = () => {
        if (userRoleID === ROLE_ADMIN) {
            // Меню для администратора (1)
            return (
                <ul className='nav navbar-nav navbar-right'>
                    <li><a href='#' onClick={(e) => handleNavClick(e, 'dashboard')}>Админ-Панель</a></li>
                    <li><a href='#' onClick={(e) => handleNavClick(e, 'users')}>Управление</a></li>
                </ul>
            );
        } else if (userRoleID === ROLE_TEACHER) {
            // Меню для учителя (2)
            return (
                <ul className='nav navbar-nav navbar-right'>
                    {/* Ключ 'management' */}
                    <li><a href='#' onClick={(e) => handleNavClick(e, 'management')}>Мои курсы</a></li> 
                    <li><a href='#' onClick={(e) => handleNavClick(e, 'create-course')}>Создать курс</a></li>
                </ul>
            );
        } else if (userRoleID === ROLE_STUDENT) {
            // Меню для студента (3)
            return (
                <ul className='nav navbar-nav navbar-right'>
                    {/* Ключ 'catalog' */}
                    <li><a href='#' onClick={(e) => handleNavClick(e, 'catalog')}>Каталог</a></li> 
                    <li><a href='#' onClick={(e) => handleNavClick(e, 'my-learning')}>Мое обучение</a></li>
                </ul>
            );
        }
        return null; 
    };

    return (
        // Убедитесь, что класс 'navbar-fixed-top' присутствует для корректного отображения
        <nav id='menu' className='navbar navbar-default navbar-fixed-top'> 
            <div className='container'>
                <div className='navbar-header'>
                    
                    <button 
                        type='button' 
                        className='navbar-toggle collapsed' 
                        onClick={toggleMenu}
                        aria-expanded={isMenuExpanded}
                    >
                        <span className='sr-only'>Toggle navigation</span>
                        <span className='icon-bar'></span>
                        <span className='icon-bar'></span>
                        <span className='icon-bar'></span>
                    </button>
                    
                    {/* Клик по логотипу всегда возвращает на главную (home) */}
                    <a className='navbar-brand page-scroll' href='#' onClick={(e) => handleNavClick(e, 'home')}> 
                        Название Сайта
                    </a>
                </div>

                <div 
                    className={'collapse navbar-collapse' + (isMenuExpanded ? ' in' : '')} 
                    id='bs-example-navbar-collapse-1'
                >
                    {/* 1. СТАНДАРТНЫЕ ПУНКТЫ (отображаются только для Гостей) */}
                    <ul className='nav navbar-nav'>
                        {userRoleID === null && (
                            <>
                                <li><a href='#features' className='page-scroll'>Особенности</a></li>
                                <li><a href='#about' className='page-scroll'>О нас</a></li>
                                <li><a href='#services' className='page-scroll'>Услуги</a></li>
                            </>
                        )}
                    </ul>


                    {/* 2. ПРАВАЯ ЧАСТЬ МЕНЮ (АУТЕНТИФИКАЦИЯ и РОЛИ) */}
                    
                    {isLoggedIn && (
                        // Авторизованный пользователь
                        <>
                            {renderRoleSpecificMenu()} 

                            <ul className='nav navbar-nav navbar-right'>
                                {/* Кнопка ВЫЙТИ */}
                                <li><a href='#' onClick={onLogout}>ВЫЙТИ</a></li> 
                            </ul>
                        </>
                    )}
                    
                    {!isLoggedIn && (
                        // Гость
                        <ul className='nav navbar-nav navbar-right'>
                            <li><a href='#' onClick={openAuthModal}>ВОЙТИ / РЕГИСТРАЦИЯ</a></li>
                        </ul>
                    )}
                </div>
            </div>
        </nav>
    );
};