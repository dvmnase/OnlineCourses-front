import React, { useState } from 'react';
import axios from 'axios';

// Базовый URL вашего бэкенда
const API_URL = 'http://localhost:8080'; 

export const Register = (props) => {
    // Состояния для хранения данных формы
 const [full_name, setfull_name] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [re_password, setRePassword] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(''); // Сброс сообщения

        if (password !== re_password) {
            setMessage('Пароли не совпадают!');
            return;
        }

        try {
            const response = await axios.post(`${API_URL}/api/auth/register`, {
              fullName: full_name,
                email,
                password
            });
            const { token, roleId } = response.data;
            props.onSuccess(token, roleId);

            // Успешная регистрация
            setMessage('✅ Регистрация прошла успешно! Теперь можете войти.');
            // Можно перенаправить на страницу входа
            // props.history.push('/login'); 

        } catch (error) {
            // Обработка ошибок, полученных от бэкенда (например, email уже занят)
            if (error.response && error.response.data) {
                const errorData = error.response.data;
                // Форматирование ошибок для отображения
                const errors = Object.keys(errorData)
                    .map(key => `${key}: ${errorData[key]}`)
                    .join(' | ');
                setMessage(`❌ Ошибка регистрации: ${errors}`);
            } else {
                setMessage('❌ Ошибка сети или сервера.');
            }
        }
    };

    return (
        <div id='register' className='text-center'>
            <h2>Регистрация</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <input
                        type='text'
                        placeholder='Имя пользователя'
                        value={full_name}
                        onChange={(e) => setfull_name(e.target.value)}
                        required
                    />
                </div>
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
                <div>
                    <input
                        type='password'
                        placeholder='Повторите пароль'
                        value={re_password}
                        onChange={(e) => setRePassword(e.target.value)}
                        required
                    />
                </div>
                <button type='submit'>Зарегистрироваться</button>
            </form>
            {message && <p className={message.startsWith('❌') ? 'error' : 'success'}>{message}</p>}
        </div>
    );
};