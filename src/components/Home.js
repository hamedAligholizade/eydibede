import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function Home() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    setIsAuthenticated(!!token);
    if (token) {
      fetchUserGroups(token);
    }
  }, []);

  const fetchUserGroups = async (token) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/groups/my-groups`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('خطا در دریافت گروه‌ها');
      }
      
      const data = await response.json();
      setGroups(data);
    } catch (error) {
      console.error('Error fetching groups:', error);
      setError('خطا در دریافت گروه‌ها. لطفا دوباره تلاش کنید.');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto text-center">
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <h1 className="text-4xl font-bold mb-6">به عیدی بده خوش آمدید</h1>
          <p className="text-xl mb-8">
            برای مدیریت گروه‌های عیدی بده و ایجاد گروه جدید، لطفا وارد شوید یا ثبت نام کنید.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              to="/admin/login"
              className="bg-[#00B100] text-white px-6 py-3 rounded-lg hover:bg-[#009100] transition-colors"
            >
              ورود به سیستم
            </Link>
            <Link
              to="/admin/register"
              className="bg-white text-[#00B100] border-2 border-[#00B100] px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              ثبت نام
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">گروه‌های عیدی بده شما</h2>
          <Link
            to="/create-group"
            className="bg-[#00B100] text-white px-4 py-2 rounded hover:bg-[#009100] transition-colors"
          >
            ایجاد گروه جدید
          </Link>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border-r-4 border-red-400 p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00B100] mx-auto"></div>
            <p className="mt-4 text-gray-600">در حال بارگذاری گروه‌ها...</p>
          </div>
        ) : groups.length > 0 ? (
          <div className="grid gap-4">
            {groups.map(group => (
              <Link
                key={group.id}
                to={`/group/${group.id}`}
                className="block p-4 border rounded hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg mb-1">{group.name}</h3>
                    <p className="text-gray-600">{group.description}</p>
                  </div>
                  <div className="text-sm">
                    <span className={`px-3 py-1 rounded-full ${
                      group.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      group.status === 'drawn' ? 'bg-green-100 text-green-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {group.status === 'pending' ? 'در انتظار قرعه‌کشی' :
                       group.status === 'drawn' ? 'قرعه‌کشی شده' :
                       'تکمیل شده'}
                    </span>
                  </div>
                </div>
                {group.drawDate && (
                  <p className="text-sm text-gray-500 mt-2">
                    تاریخ قرعه‌کشی: {new Date(group.drawDate).toLocaleDateString('fa-IR')}
                  </p>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">هنوز گروهی ایجاد نکرده‌اید</p>
            <p className="text-gray-500">برای شروع، روی دکمه «ایجاد گروه جدید» کلیک کنید</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Home; 