import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Toaster } from 'sonner';
import EverydayItems from './pages/EverydayItems';
import ShoppingSession from './pages/ShoppingSession';
import Navigation from './components/Navigation';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="pb-6">
          <Routes>
            <Route path="/" element={<EverydayItems />} />
            <Route path="/shop" element={<ShoppingSession />} />
          </Routes>
        </main>
      </div>
      <Toaster position="top-center" richColors />
    </BrowserRouter>
  );
}

export default App;
