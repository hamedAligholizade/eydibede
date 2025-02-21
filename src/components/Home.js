import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function Home() {
  const [groups, setGroups] = useState([]);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    setIsAuthenticated(!!token);
  }, []);

  const fetchGroups = async () => {
    if (!email) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/groups/organizer/${email}`);
      const data = await response.json();
      setGroups(data);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
    setLoading(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto text-center">
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <h1 className="text-4xl font-bold mb-6">به X Buddy خوش آمدید</h1>
          <p className="text-xl mb-8">
            برای مدیریت گروه‌های X Buddy و ایجاد گروه جدید، لطفا وارد شوید یا ثبت نام کنید.
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
        <h2 className="text-2xl font-bold mb-4">گروه‌های X Buddy شما</h2>
        <Link
          to="/create-group"
          className="bg-[#00B100] text-white px-4 py-2 rounded hover:bg-[#009100] mb-4 inline-block"
        >
          ایجاد گروه جدید
        </Link>
        <div className="mt-4">
          {groups.length > 0 ? (
            <div className="grid gap-4">
              {groups.map(group => (
                <Link
                  key={group.id}
                  to={`/group/${group.id}`}
                  className="block p-4 border rounded hover:bg-gray-50"
                >
                  <h3 className="font-bold">{group.name}</h3>
                  <p className="text-gray-600">{group.description}</p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">هنوز گروهی ایجاد نکرده‌اید.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home; 