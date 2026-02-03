import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Dashboard from './pages/Dashboard';
import Videos from './pages/Videos';
import Menu from './pages/Menu';
import Config from './pages/Config';
import Devices from './pages/Devices';
import AnimationTest from './pages/AnimationTest';
import Login from './components/Login';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/videos" element={<Videos />} />
                    <Route path="/menu" element={<Menu />} />
                    <Route path="/devices" element={<Devices />} />
                    <Route path="/config" element={<Config />} />
                    <Route path="/animation-test" element={<AnimationTest />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
