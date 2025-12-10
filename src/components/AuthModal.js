import React, { useState } from 'react';
// Импортируем компоненты, которые вы создали ранее
import { Login } from '../services/Login';
import { Register } from '../services/Register'; 

export const AuthModal = ({ show, onClose,onLoginSuccess }) => {
    // Состояние для определения, какую форму показать: 'login' или 'register'
    const [authView, setAuthView] = useState('login'); 


    if (!show) {
        return null;
    }

    // Функции для переключения вида
    const switchToLogin = () => setAuthView('login');
    const switchToRegister = () => setAuthView('register');

    // Функция, которая будет вызываться после успешного входа/регистрации
const handleSuccess = (token) => {
        // Вызываем функцию из App.js, передавая токен
        onLoginSuccess(token); 
        onClose(); 
    };

    return (
        <div className='modal-overlay' onClick={onClose}>
            {/* Остановка всплытия события, чтобы клик внутри не закрывал модал */}
            <div className='modal-content' onClick={(e) => e.stopPropagation()}>
                <button className='modal-close-btn' onClick={onClose}>
                    &times; {/* Символ 'x' для закрытия */}
                </button>

                <div className='auth-switch'>
                    <button 
                        className={authView === 'login' ? 'active' : ''} 
                        onClick={switchToLogin}
                    >
                        Войти
                    </button>
                    <button 
                        className={authView === 'register' ? 'active' : ''} 
                        onClick={switchToRegister}
                    >
                        Регистрация
                    </button>
                </div>

                {/* Рендеринг нужного компонента в зависимости от состояния authView */}
                {authView === 'login' ? (
                    <Login 
                      onSuccess={handleSuccess}
                        switchToRegister={switchToRegister} 
                    />
                ) : (
                    <Register 
                        onSuccess={(token) => { // Регистр теперь тоже принимает токен
                        handleSuccess(token); // Передаем токен для сохранения
                        switchToLogin(); // После регистрации обычно переходят на вход
                    }}
                        switchToLogin={switchToLogin}
                    />
                )}
            </div>
        </div>
    );
};