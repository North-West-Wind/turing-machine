import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './app.css'
import LandingPage from './pages/landing';
import LoginPage from './pages/login';
import ModePage from './pages/mode';
import LevelPage from './pages/level';
import DesignerPage from './pages/designer';
import TutorialPage from './pages/tutorial';

export function App() {
  return <BrowserRouter>
    <Routes>
      <Route path='/' element={<LandingPage />} />
      <Route path='/login' element={<LoginPage />} />
      <Route path='/mode' element={<ModePage />} />
      { /* "/level" for level selection. "/level/:id" for level detail. */ }
      <Route path='/level' element={<LevelPage />} />
      <Route path='/level/:id' element={<LevelPage />} /> 
      <Route path='/designer' element={<DesignerPage />} />
      <Route path='/tutorial' element={<TutorialPage />} />
    </Routes>
  </BrowserRouter>;
}
