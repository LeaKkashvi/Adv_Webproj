import { Link } from 'react-router-dom';

export function PublicLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-primary-900 shadow-lg">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-xl font-bold text-white tracking-tight">
                NRI Legal Portal
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/auth/login"
                className="text-primary-200 hover:text-white text-sm font-medium transition-colors"
              >
                Login
              </Link>
              <Link
                to="/auth/register/client"
                className="bg-accent-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-accent-600 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </nav>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="bg-primary-900 text-primary-300 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm">
          <p>&copy; 2024 NRI Legal Portal. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default PublicLayout;
