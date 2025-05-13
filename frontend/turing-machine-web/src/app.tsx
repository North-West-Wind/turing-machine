import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './app.css'
import LandingPage from './pages/landing';
import LoginPage from './pages/login';
import ModePage from './pages/mode';
import LevelPage from './pages/level';
import DesignerPage from './pages/designer';
import TutorialPage from './pages/tutorial';
import { useEffect } from 'react';
import { getAuth, getSaveTime, invalidateAuth, PersistenceKey, save } from './helpers/persistence';
import { getLevel, getProgress, getSandboxMachine, startAutoValidate, validateAccessToken } from './helpers/network';

export function App() {
	// Initial load check auth
	useEffect(() => {
		const auth = getAuth();
		if (!auth) {
			// Not logged in -> /login
			if (window.location.pathname != "/login")
				window.location.replace("/login");
		}	else {
			// Logged in -> validate
			validateAccessToken().then(async valid => {
				if (valid) {
					startAutoValidate();
					if (!["/mode", "/level", "/designer", "/tutorial"].includes(window.location.pathname) && !window.location.pathname.startsWith("/level/"))
						window.location.replace("/mode");
					else {
						const progress = await getProgress();
						if (progress && progress.time > getSaveTime()) {
							// Server progress is more recent. Use that
							if (progress.level === undefined) {
								// Sandbox mode
								save(PersistenceKey.LEVEL, undefined, false);
								save(PersistenceKey.MACHINE, JSON.stringify(progress.machineDesign));
							} else {
								// Level selected
								const level = await getLevel(progress.level);
								level.design = progress.machineDesign;
								save(PersistenceKey.LEVEL, JSON.stringify(level), false);
								save(PersistenceKey.MACHINE, JSON.stringify(await getSandboxMachine()));
							}
							window.location.replace("/designer");
						}
					}
				} else {
					invalidateAuth();
					window.location.replace("/login");
				}
			}).catch(console.error);
		}
	}, []);

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
