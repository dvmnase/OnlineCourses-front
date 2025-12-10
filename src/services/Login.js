import React, { useState } from 'react';
import axios from 'axios';

// Базовый URL вашего бэкенда
const API_URL = 'http://localhost:8080'; 

export const Login = (props) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');

    // Функция для сохранения токена (например, в localStorage)
    const saveTokens = (accessToken, refreshToken) => {
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);
        // Здесь можно сохранить и статус "входа"
        // props.setAuthStatus(true); 
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');

        try {
            const response = await axios.post(`${API_URL}/api/auth/login`, {
                email, // Djoser JWT по умолчанию использует email и password
                password,
            });

            const { token, message, roleId  } = response.data;
          if (token && roleId) {
                // 1. Сохранение токена происходит в App.js через этот вызов
                props.onSuccess(token, roleId); 
                
                // 2. Отображение успешного сообщения (если нужно)
                setMessage(`✅ ${message}`);

            } else {
                setMessage('❌ Вход не удался: токен не получен.');
            }

        } catch (error) {
            if (error.response && error.response.status === 401) {
                setMessage('❌ Неверный email или пароль.');
            } else {
                setMessage('❌ Ошибка сети или сервера.');
            }
        }
    };

    return (
        <div id='login' className='text-center'>
            <h2>Вход</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <input
                        type='email'
                        placeholder='Email'
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <input
                        type='password'
                        placeholder='Пароль'
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type='submit'>Войти</button>
            </form>
            {message && <p className={message.startsWith('❌') ? 'error' : 'success'}>{message}</p>}
        </div>
    );
};