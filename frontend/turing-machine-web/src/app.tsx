import './app.css'
import { ErrorBoundary, lazy, LocationProvider, Route, Router } from 'preact-iso'

const Landing = lazy(() => import('./pages/landing'));
const Login = lazy(() => import('./pages/login'));
const Mode = lazy(() => import('./pages/mode'));
const Level = lazy(() => import('./pages/level'));
const Designer = lazy(() => import('./pages/designer'));

export function App() {
  return <LocationProvider>
    <ErrorBoundary>
      <Router>
        <Route path='/' component={Landing} />
        <Route path='/login' component={Login} />
        <Route path='/mode' component={Mode} />
        { /* "/level" for level selection. "/level/:id" for level detail. */ }
        <Route path='/level' component={Level} />
        <Route path='/level/:id' component={Level} /> 
        <Route path='/designer' component={Designer} />
      </Router>
    </ErrorBoundary>
  </LocationProvider>;
}
