import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Navbar({ isAuthenticated, setIsAuthenticated }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminInfo');
    setIsAuthenticated(false);
    navigate('/admin/login');
  };

  return (
    <nav className="bg-[#00B100] text-white shadow-lg" dir="rtl">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-2xl font-bold">
            X Buddy
          </Link>
          <div className="absolute top-2 right-2 w-12 h-12 bg-contain bg-no-repeat transform -scale-x-100"
             style={{ backgroundImage: 'url("/images/smartx.png")' }}></div>
          <div className="flex space-x-4 items-center">
            {!isAuthenticated ? (
              <>
                <Link
                  to="/admin/login"
                  className="hover:bg-[#009100] px-3 py-2 rounded-md mr-4"
                >
                  ورود مدیر
                </Link>
                {/* Only show register if needed */}
                <Link
                  to="/admin/register"
                  className="hover:bg-[#009100] px-3 py-2 rounded-md"
                >
                  ثبت نام مدیر
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/"
                  className="hover:bg-[#009100] px-3 py-2 rounded-md"
                >
                  صفحه اصلی
                </Link>
                <Link
                  to="/create-group"
                  className="hover:bg-[#009100] px-3 py-2 rounded-md mr-4"
                >
                  ایجاد گروه جدید
                </Link>
                <button
                  onClick={handleLogout}
                  className="hover:bg-[#009100] px-3 py-2 rounded-md"
                >
                  خروج
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar; 