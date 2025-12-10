import React from "react";

// Этот компонент принимает props: openAuthModal, isLoggedIn, onLogout
export const Navigation = (props) => {
  return (
    <nav id="menu" className="navbar navbar-default navbar-fixed-top">
      <div className="container">
        <div className="navbar-header">
          <button
            type="button"
            className="navbar-toggle collapsed"
            data-toggle="collapse"
            data-target="#bs-example-navbar-collapse-1"
          >
            {" "}
            <span className="sr-only">Toggle navigation</span>{" "}
            <span className="icon-bar"></span>{" "}
            <span className="icon-bar"></span>{" "}
            <span className="icon-bar"></span>{" "}
          </button>
          <a className="navbar-brand page-scroll" href="#page-top">
            React Landing Page
          </a>{" "}
        </div>

        <div
          className="collapse navbar-collapse"
          id="bs-example-navbar-collapse-1"
        >
          <ul className="nav navbar-nav navbar-right">
            <li><a href="#features" className="page-scroll">Features</a></li>
            <li><a href="#about" className="page-scroll">About</a></li>
            <li><a href="#services" className="page-scroll">Services</a></li>
            <li><a href="#portfolio" className="page-scroll">Gallery</a></li>
            <li><a href="#testimonials" className="page-scroll">Testimonials</a></li>
            <li><a href="#team" className="page-scroll">Team</a></li>
            <li><a href="#contact" className="page-scroll">Contact</a></li>
            
            {/* !!! ВСТАВЛЯЕМ КНОПКУ СЮДА !!! */}
            <li style={{ marginLeft: '15px' }}>
              {/* Используем пропсы, переданные из App.js */}
              {props.isLoggedIn ? (
                <a 
                  onClick={props.onLogout} 
                  className='page-scroll btn btn-custom' 
                  style={{ cursor: 'pointer' }}
                >
                  Выйти
                </a>
              ) : (
                <a 
                  onClick={props.openAuthModal} // Вот вызов функции, которая откроет модал
                  className='page-scroll btn btn-custom' 
                  style={{ cursor: 'pointer' }}
                >
                  Войти / Регистрация
                </a>
              )}
            </li>
            {/* ---------------------------------- */}
          </ul>
        </div>
      </div>
    </nav>
  );
};