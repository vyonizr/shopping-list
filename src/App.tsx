import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import EverydayItems from './pages/EverydayItems';
import ShoppingSession from './pages/ShoppingSession';
import Navigation from './components/Navigation';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <Routes>
          <Route path="/" element={<EverydayItems />} />
          <Route path="/shop" element={<ShoppingSession />} />
        </Routes>
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
