import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import EverydayItems from './pages/EverydayItems';
import ShoppingSession from './pages/ShoppingSession';
import Navigation from './components/Navigation';
import { Toaster } from './components/ui/sonner';
import packageJson from '../package.json';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <Routes>
          <Route path="/" element={<EverydayItems />} />
          <Route path="/shop" element={<ShoppingSession />} />
        </Routes>
        <footer className="px-4 py-6 pb-20 sm:pb-6 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} vyonizr · v{packageJson.version}
        </footer>
        <Toaster
          position="bottom-center"
          toastOptions={{
            classNames: {
              toast: 'mb-16 sm:mb-4',
            },
          }}
          richColors
        />
      </div>
    </Router>
  );
}

export default App;
