import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import moment from 'moment-jalaali';

function CreateGroup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    budget: '',
    currency: 'TOMAN',
    drawDate: moment().add(1, 'month').format('YYYY-MM-DD')
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminInfo');
        navigate('/admin/login');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminInfo');
      navigate('/admin/login');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        throw new Error('برای ایجاد گروه باید وارد شوید');
      }

      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          budget: parseFloat(formData.budget)
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminInfo');
          navigate('/admin/login');
          throw new Error('نشست شما منقضی شده است. لطفا دوباره وارد شوید');
        }
        const data = await response.json();
        throw new Error(data.error || 'خطا در ایجاد گروه');
      }

      const data = await response.json();
      navigate(`/group/${data.id}`);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6">ایجاد گروه جدید</h2>

        {error && (
          <div className="mb-4 bg-red-50 border-r-4 border-red-400 p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              نام گروه
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[#00B100] focus:border-[#00B100]"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              توضیحات
            </label>
            <textarea
              id="description"
              name="description"
              rows="3"
              value={formData.description}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[#00B100] focus:border-[#00B100]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="budget" className="block text-sm font-medium text-gray-700">
                بودجه
              </label>
              <input
                type="number"
                id="budget"
                name="budget"
                required
                value={formData.budget}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[#00B100] focus:border-[#00B100]"
              />
            </div>

            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-gray-700">
                واحد پول
              </label>
              <select
                id="currency"
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[#00B100] focus:border-[#00B100]"
              >
                <option value="TOMAN">تومان</option>
                <option value="USD">دلار</option>
                <option value="EUR">یورو</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="drawDate" className="block text-sm font-medium text-gray-700">
              تاریخ قرعه‌کشی
            </label>
            <input
              type="date"
              id="drawDate"
              name="drawDate"
              required
              value={formData.drawDate}
              onChange={handleChange}
              min={moment().format('YYYY-MM-DD')}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[#00B100] focus:border-[#00B100]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-[#00B100] text-white p-3 rounded-md hover:bg-[#009100] transition-colors ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'در حال ایجاد گروه...' : 'ایجاد گروه'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateGroup; 