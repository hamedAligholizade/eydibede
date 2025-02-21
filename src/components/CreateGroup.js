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
  const [csvFile, setCsvFile] = useState(null);
  const [participants, setParticipants] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login', { state: { from: '/create-group' } });
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Token verification failed');
        }
      } catch (error) {
        console.error('Auth verification error:', error);
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminInfo');
        navigate('/admin/login', { state: { from: '/create-group' } });
      }
    };

    verifyToken();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCsvFile(file);
      // Read and parse CSV file
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const csvText = event.target.result;
          const lines = csvText.split('\n');
          const parsedParticipants = lines
            .slice(1) // Skip header row
            .filter(line => line.trim()) // Remove empty lines
            .map(line => {
              const [name, email] = line.split(',').map(field => field.trim());
              if (!name || !email) {
                throw new Error('فرمت نامعتبر CSV. هر خط باید شامل نام و ایمیل باشد.');
              }
              return { name, email };
            });

          if (parsedParticipants.length === 0) {
            throw new Error('هیچ شرکت‌کننده‌ای در فایل CSV یافت نشد.');
          }

          setParticipants(parsedParticipants);
          setError('');
        } catch (error) {
          setError(error.message);
          setParticipants([]);
        }
      };
      reader.onerror = () => {
        setError('خطا در خواندن فایل CSV');
        setParticipants([]);
      };
      reader.readAsText(file);
    }
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

      // Create group
      const groupResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/groups`, {
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

      if (!groupResponse.ok) {
        const errorData = await groupResponse.json();
        throw new Error(errorData.message || 'خطا در ایجاد گروه');
      }

      const groupData = await groupResponse.json();

      // If we have participants from CSV, add them
      if (participants.length > 0) {
        const participantsResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/participants/bulk`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            groupId: groupData.id,
            participants: participants
          }),
        });

        if (!participantsResponse.ok) {
          const errorData = await participantsResponse.json();
          throw new Error(errorData.message || 'خطا در افزودن شرکت‌کنندگان');
        }
      }

      navigate(`/group/${groupData.id}`);
    } catch (error) {
      console.error('Submit error:', error);
      setError(error.message || 'خطای ناشناخته در ایجاد گروه');
    } finally {
      setLoading(false);
    }
  };

  const today = moment().format('YYYY-MM-DD');
  const maxDate = moment().add(1, 'year').format('YYYY-MM-DD');

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
                min="0"
                step="1000"
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
              min={today}
              max={maxDate}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[#00B100] focus:border-[#00B100]"
            />
          </div>

          <div>
            <label htmlFor="csvFile" className="block text-sm font-medium text-gray-700">
              فایل CSV شرکت‌کنندگان (اختیاری)
            </label>
            <input
              type="file"
              id="csvFile"
              accept=".csv"
              onChange={handleFileChange}
              className="mt-1 block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-[#00B100] file:text-white
                hover:file:bg-[#009100]"
            />
            <p className="mt-1 text-sm text-gray-500">
              فرمت: نام، ایمیل (هر شرکت‌کننده در یک خط)
            </p>
          </div>

          {participants.length > 0 && (
            <div>
              <p className="text-sm text-gray-600">
                {participants.length} شرکت‌کننده از فایل CSV خوانده شد
              </p>
              <div className="mt-2 max-h-40 overflow-y-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-right">نام</th>
                      <th className="text-right">ایمیل</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participants.map((p, index) => (
                      <tr key={index} className="border-t">
                        <td className="py-1">{p.name}</td>
                        <td className="py-1">{p.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

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