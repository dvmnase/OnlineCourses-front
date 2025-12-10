// src/components/Navigation.js (Концептуальный код)
import React, { useState } from 'react';
// Принимаем userRoleID как пропс
export const Navigation = (props) => {
    const { isLoggedIn, onLogout, openAuthModal, userRoleID } = props;
    const [isMenuExpanded, setIsMenuExpanded] = useState(false);


    // ID ролей
    const ROLE_TEACHER = 2;
    const ROLE_ADMIN = 1;
    const ROLE_STUDENT = 3;
const toggleMenu = () => {
        setIsMenuExpanded(!isMenuExpanded);
    };

    // Функция для рендеринга меню, специфичного для ролей
    const renderRoleSpecificMenu = () => {
        if (userRoleID === ROLE_ADMIN) {
            // Меню для администратора (1)
            return (
                <ul className='nav navbar-nav navbar-right'>
                    <li><a href='#dashboard'>Админ-Панель</a></li>
                    <li><a href='#users'>Управление</a></li>
                </ul>
            );
        } else if (userRoleID === ROLE_TEACHER) { // Фокусируемся на Учителе (2)
            // Меню для учителя (2)
            return (
                <ul className='nav navbar-nav navbar-right'>
                    <li><a href='#my-courses-management'>Мои курсы</a></li>
                    <li><a href='#create-course'>Создать курс</a></li>
                    {/* Другие пункты меню учителя */}
                </ul>
            );
        } else if (userRoleID === ROLE_STUDENT) {
            // Меню для студента (3)
            return (
                <ul className='nav navbar-nav navbar-right'>
                    <li><a href='#catalog'>Каталог</a></li>
                    <li><a href='#my-learning'>Мое обучение</a></li>
                </ul>
            );
        }
        return null; // Ничего не рендерить, если пользователь вошел, но роли нет (или он на главной странице)
    };

   return (
        // Добавляем класс, чтобы меню было фиксированным сверху
        <nav id='menu' className='navbar navbar-default navbar-fixed-top'> 
            <div className='container'>
                <div className='navbar-header'>
                    
                    {/* КНОПКА-ПЕРЕКЛЮЧАТЕЛЬ (для мобильных устройств, но мы используем ее для сворачивания) */}
                    <button 
                        type='button' 
                        className='navbar-toggle collapsed' 
                        onClick={toggleMenu}
                        aria-expanded={isMenuExpanded} // Для доступности
                    >
                        <span className='sr-only'>Toggle navigation</span>
                        <span className='icon-bar'></span>
                        <span className='icon-bar'></span>
                        <span className='icon-bar'></span>
                    </button>
                    
                    {/* Логотип/Название сайта */}
                    <a className='navbar-brand page-scroll' href='#page-top'>
                        Название Сайта
                    </a>
                </div>

                {/* Главный контейнер для пунктов меню. Используем состояние isMenuExpanded */}
                <div 
                    className={'collapse navbar-collapse' + (isMenuExpanded ? ' in' : '')} 
                    id='bs-example-navbar-collapse-1'
                >
                    {/* 1. СТАНДАРТНЫЕ ПУНКТЫ (для всех, например, скроллинг по лендингу) */}
                    <ul className='nav navbar-nav'>
                        <li><a href='#features' className='page-scroll'>Особенности</a></li>
                        <li><a href='#about' className='page-scroll'>О нас</a></li>
                        {/* ... другие стандартные ссылки ... */}
                    </ul>


                    {/* 2. ПРАВАЯ ЧАСТЬ МЕНЮ (АУТЕНТИФИКАЦИЯ и РОЛИ) */}
                    
                    {/* Если пользователь вошел */}
                    {isLoggedIn && (
                        // Рендерим меню, специфичное для ролей, и кнопку "Выйти"
                        <>
                            {/* МЕНЮ ПО РОЛЯМ (например, "Мои курсы") */}
                            {renderRoleSpecificMenu()} 

                            {/* Кнопка ВЫЙТИ */}
                            <ul className='nav navbar-nav navbar-right'>
                                <li><a onClick={onLogout}>ВЫЙТИ</a></li>
                            </ul>
                        </>
                    )}
                    
                    {/* Если пользователь не вошел */}
                    {!isLoggedIn && (
                        <ul className='nav navbar-nav navbar-right'>
                            <li><a onClick={openAuthModal}>ВОЙТИ / РЕГИСТРАЦИЯ</a></li>
                        </ul>
                    )}
                </div>
            </div>
        </nav>
    );
};