import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import moment from 'moment-jalaali';

function GroupDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [drawInProgress, setDrawInProgress] = useState(false);

  useEffect(() => {
    fetchGroup();
  }, [id, navigate]);

  const fetchGroup = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login', { state: { from: `/groups/${id}` } });
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/groups/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.details || 'خطا در دریافت اطلاعات گروه');
      }

      const data = await response.json();
      setGroup(data);
    } catch (error) {
      console.error('Error fetching group:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDraw = async () => {
    if (!window.confirm('آیا از شروع قرعه‌کشی مطمئن هستید؟ این عمل قابل برگشت نیست.')) {
      return;
    }

    setDrawInProgress(true);
    setError('');

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/groups/${id}/draw`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.details || 'خطا در انجام قرعه‌کشی');
      }

      const data = await response.json();
      alert('قرعه‌کشی با موفقیت انجام شد! ایمیل‌های اطلاع‌رسانی در حال ارسال هستند.');
      fetchGroup(); // Refresh group data
    } catch (error) {
      console.error('Draw error:', error);
      setError(error.message);
    } finally {
      setDrawInProgress(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    return moment(date).format('jYYYY/jMM/jDD');
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto mt-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00B100] mx-auto"></div>
            <p className="mt-4 text-gray-600">در حال بارگذاری اطلاعات گروه...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto mt-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="bg-red-50 border-r-4 border-red-400 p-4">
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!group) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto mt-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{group.name}</h1>
            <p className="text-gray-600">{group.description}</p>
          </div>
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

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div>
            <p className="text-sm text-gray-500">تاریخ قرعه‌کشی</p>
            <p className="font-medium">{formatDate(group.drawDate)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">بودجه</p>
            <p className="font-medium">
              {group.budget.toLocaleString()} {group.currency === 'TOMAN' ? 'تومان' : group.currency}
            </p>
          </div>
        </div>

        <div className="border-t pt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">شرکت‌کنندگان</h2>
            {group.status === 'pending' && (
              <button
                className="bg-[#00B100] text-white px-4 py-2 rounded hover:bg-[#009100] transition-colors"
                onClick={() => navigate(`/groups/${id}/add-participant`)}
              >
                افزودن شرکت‌کننده
              </button>
            )}
          </div>

          {group.participants && group.participants.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-right py-2">نام</th>
                    <th className="text-right py-2">ایمیل</th>
                    {group.status !== 'pending' && (
                      <th className="text-right py-2">هدیه می‌دهد به</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {group.participants.map(participant => (
                    <tr key={participant.id} className="border-b">
                      <td className="py-2">{participant.name}</td>
                      <td className="py-2">{participant.email}</td>
                      {group.status !== 'pending' && (
                        <td className="py-2">
                          {participant.assignedTo ? participant.assignedTo.name : '-'}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">
              هنوز شرکت‌کننده‌ای اضافه نشده است
            </p>
          )}
        </div>

        {group.status === 'pending' && group.participants && group.participants.length >= 3 && (
          <div className="mt-6 border-t pt-6">
            <button
              className={`w-full bg-[#00B100] text-white py-3 rounded-md hover:bg-[#009100] transition-colors ${
                drawInProgress ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              onClick={handleDraw}
              disabled={drawInProgress}
            >
              {drawInProgress ? 'در حال انجام قرعه‌کشی...' : 'شروع قرعه‌کشی'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default GroupDetails; 