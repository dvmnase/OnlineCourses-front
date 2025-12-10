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


export const scroll = new SmoothScroll('a[href*="#"]', {
  speed: 1000,
  speedAsDuration: true,
});

const App = () => {
 const [landingPageData, setLandingPageData] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Инициализируем статус, проверяя наличие токена в localStorage
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('access_token'));
  // ФУНКЦИИ УПРАВЛЕНИЯ МОДАЛОМ
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  // ФУНКЦИИ АУТЕНТИФИКАЦИИ (требуется для Header/Navigation)
const handleLoginSuccess = (token) => {
      if (token) {
          localStorage.setItem('access_token', token); // Сохраняем токен
      }
      setIsLoggedIn(true);
      closeModal();
  };
  const handleLogout = () => {
      localStorage.removeItem('access_token'); // Удаляем токены при выходе
      localStorage.removeItem('refresh_token');
      setIsLoggedIn(false);
  };
  useEffect(() => {
    setLandingPageData(JsonData);
  }, []);

  return (
    <div>
      <Navigation 
        openAuthModal={openModal} 
        isLoggedIn={isLoggedIn} 
        onLogout={handleLogout} 
      />
      <Header data={landingPageData.Header} />
      <Features data={landingPageData.Features} />
      <About data={landingPageData.About} />
      <Services data={landingPageData.Services} />
      <Gallery data={landingPageData.Gallery} />
      <Testimonials data={landingPageData.Testimonials} />
      <Team data={landingPageData.Team} />
      <Contact data={landingPageData.Contact} />
      <AuthModal 
        show={isModalOpen} 
        onClose={closeModal} 
        onLoginSuccess={handleLoginSuccess}
      />

    </div>
  );
};

export default App;
