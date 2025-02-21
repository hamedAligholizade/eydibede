import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function CreateGroup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    budget: '',
    currency: 'TOMAN',
    drawDate: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check if admin is logged in
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
    }
  }, [navigate]);

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
        throw new Error('خطا در ایجاد گروه');
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
      <h2 className="text-3xl font-bold mb-6">ایجاد گروه کادو</h2>
      
      {error && (
        <div className="mb-6 bg-red-50 border-r-4 border-red-400 p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            نام گروه
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded"
            placeholder="کریسمس ۱۴۰۳"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            توضیحات
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            rows="3"
            placeholder="توضیحات گروه کادو را وارد کنید"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              بودجه
            </label>
            <input
              type="number"
              name="budget"
              value={formData.budget}
              onChange={handleChange}
              required
              min="0"
              step="1000"
              className="w-full p-2 border rounded"
              placeholder="۵۰۰,۰۰۰"
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              واحد پول
            </label>
            <select
              name="currency"
              value={formData.currency}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            >
              <option value="TOMAN">تومان</option>
              <option value="RIAL">ریال</option>
            </select>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            تاریخ قرعه‌کشی
          </label>
          <input
            type="date"
            name="drawDate"
            value={formData.drawDate}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? 'در حال ایجاد...' : 'ایجاد گروه'}
        </button>
      </form>
    </div>
  );
}

export default CreateGroup; 