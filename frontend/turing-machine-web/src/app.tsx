import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './app.css'
import LandingPage from './pages/landing';
import LoginPage from './pages/login';
import ModePage from './pages/mode';
import LevelPage from './pages/level';
import DesignerPage from './pages/designer';
import TutorialPage from './pages/tutorial';
import { useEffect } from 'react';
import { getAuth, getLevel as getLocalLevel, getSaveTime, invalidateAuth, PersistenceKey, save } from './helpers/persistence';
import { getAllProgress, getLevel, getLevelProgress, getMachine, startAutoValidate, validateAccessToken } from './helpers/network';

export function App() {
	// Initial load check auth
	useEffect(() => {
		const auth = getAuth();
		if (!auth) {
			// Not logged in -> /login
			//if (window.location.pathname != "/login")
			//	window.location.replace("/login");
		}	else {
			// Logged in -> validate
			validateAccessToken().then(async valid => {
				if (valid) {
					startAutoValidate();
					if (!["/", "/mode", "/level", "/designer", "/tutorial"].includes(window.location.pathname) && !window.location.pathname.startsWith("/level/"))
						window.location.replace("/mode");
					else {
						// Check if we have any level
						const localLevel = getLocalLevel();
						if (localLevel) {
							// Get progress of level
							const progress = await getLevelProgress(localLevel.LevelID);
							if (progress && progress.SubmittedTime > getSaveTime()) {
								const machine = await getMachine(progress.DesignID);
								if (machine) save(PersistenceKey.LEVEL_MACHINE, JSON.stringify(machine));

								const level = await getLevel(progress.LevelID);
								if (level) save(PersistenceKey.LEVEL, JSON.stringify(level));
							}
						} else {
							const progresses = await getAllProgress();
							if (progresses?.length) {
								let progress = progresses[0];
								for (let ii = 1; ii < progresses.length; ii++) {
									const prog = progresses[ii];
									if (prog.SubmittedTime > progress.SubmittedTime)
										progress = prog;
								}

								if (progress && progress.SubmittedTime > getSaveTime()) {
									const machine = await getMachine(progress.DesignID);
									if (machine) save(PersistenceKey.LEVEL_MACHINE, JSON.stringify(machine));
	
									const level = await getLevel(progress.LevelID);
									if (level) save(PersistenceKey.LEVEL, JSON.stringify(level));
								}
							}
						}
						window.location.replace("/designer");
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
