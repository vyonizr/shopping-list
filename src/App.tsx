import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import EverydayItems from './pages/EverydayItems';
import ShoppingSession from './pages/ShoppingSession';
import { Toaster } from '@/components/ui/sonner';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b sticky top-0 z-10" role="navigation" aria-label="Main navigation">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex h-14 sm:h-16">
              <div className="flex w-full">
                <Link
                  to="/"
                  className="flex-1 inline-flex items-center justify-center px-4 py-1 text-sm sm:text-base font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 border-b-2 border-transparent hover:border-blue-300 transition-colors"
                >
                  <span className="mr-2">📝</span>
                  <span>Items</span>
                </Link>
                <Link
                  to="/shop"
                  className="flex-1 inline-flex items-center justify-center px-4 py-1 text-sm sm:text-base font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 border-b-2 border-transparent hover:border-blue-300 transition-colors"
                >
                  <span className="mr-2">🛒</span>
                  <span>Shopping</span>
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <main className="pb-6">
          <Routes>
            <Route path="/" element={<EverydayItems />} />
            <Route path="/shop" element={<ShoppingSession />} />
          </Routes>
        </main>
      </div>
      <Toaster />
    </BrowserRouter>
  );
}

export default App;
