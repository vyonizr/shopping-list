import { Link, useLocation } from 'react-router-dom';
import { ClipboardList, ShoppingCart } from 'lucide-react';

export default function Navigation() {
  const location = useLocation();
  const isItemsPage = location.pathname === '/';
  const isShoppingPage = location.pathname === '/shop';

  return (
    <>
      {/* Desktop/Tablet Navigation - Top */}
      <nav className="hidden sm:block border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center space-x-8">
            <Link
              to="/"
              className={`inline-flex items-center px-6 py-4 border-b-2 text-sm font-medium transition-colors min-w-[120px] justify-center ${
                isItemsPage
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <ClipboardList className="mr-2 h-5 w-5" />
              Items
            </Link>
            <Link
              to="/shop"
              className={`inline-flex items-center px-6 py-4 border-b-2 text-sm font-medium transition-colors min-w-[120px] justify-center ${
                isShoppingPage
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              Shopping
            </Link>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation - Bottom Fixed */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-inset-bottom">
        <div className="grid grid-cols-2 h-16">
          <Link
            to="/"
            className={`flex flex-col items-center justify-center space-y-1 transition-colors ${
              isItemsPage
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <ClipboardList className="h-6 w-6" />
            <span className="text-xs font-medium">Items</span>
          </Link>
          <Link
            to="/shop"
            className={`flex flex-col items-center justify-center space-y-1 transition-colors ${
              isShoppingPage
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <ShoppingCart className="h-6 w-6" />
            <span className="text-xs font-medium">Shopping</span>
          </Link>
        </div>
      </nav>
    </>
  );
}
