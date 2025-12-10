// src/components/Navigation.js (Концептуальный код)

// Принимаем userRoleID как пропс
export const Navigation = (props) => {
    const { isLoggedIn, onLogout, openAuthModal, userRoleID } = props;
    
    // ID ролей
    const ROLE_TEACHER = 2;
    const ROLE_ADMIN = 1;
    const ROLE_STUDENT = 3;

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
                    <li><a href='#my-courses'>Мои курсы</a></li>
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
        <nav id='menu' className='navbar navbar-default navbar-fixed-top'>
            <div className='container'>
                {/* ... Логотип и стандартное меню ... */}
                
                {/* Меню, видимое только для залогиненных пользователей */}
                {isLoggedIn && (
                    <>
                        {renderRoleSpecificMenu()}
                        <ul className='nav navbar-nav navbar-right'>
                            <li><a onClick={onLogout}>Выйти</a></li>
                        </ul>
                    </>
                )}
                
                {/* Кнопка "Войти/Регистрация" для не-залогиненных пользователей */}
                {!isLoggedIn && (
                    <ul className='nav navbar-nav navbar-right'>
                        <li><a onClick={openAuthModal}>Войти / Регистрация</a></li>
                    </ul>
                )}

            </div>
        </nav>
    );
};