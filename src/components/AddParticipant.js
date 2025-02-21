import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function AddParticipant() {
  const { id: groupId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [csvFile, setCsvFile] = useState(null);
  const [participants, setParticipants] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login', { state: { from: `/groups/${groupId}/add-participant` } });
      return;
    }
  }, [groupId, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
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
          console.error('CSV parsing error:', error);
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
        throw new Error('برای افزودن شرکت‌کننده باید وارد شوید');
      }

      if (participants.length > 0) {
        // Bulk add participants
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/participants/group/${groupId}/bulk`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ participants })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || errorData.details || 'خطا در افزودن شرکت‌کنندگان');
        }
      } else {
        // Add single participant
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/participants`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            ...formData,
            groupId
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || errorData.details || 'خطا در افزودن شرکت‌کننده');
        }
      }

      navigate(`/groups/${groupId}`);
    } catch (error) {
      console.error('Submit error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6">افزودن شرکت‌کننده</h2>

        {error && (
          <div className="mb-4 bg-red-50 border-r-4 border-red-400 p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="csvFile" className="block text-sm font-medium text-gray-700 mb-2">
              افزودن گروهی با فایل CSV
            </label>
            <input
              type="file"
              id="csvFile"
              accept=".csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
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

          {participants.length > 0 ? (
            <div>
              <h3 className="text-lg font-medium mb-2">شرکت‌کنندگان از فایل CSV:</h3>
              <div className="max-h-60 overflow-y-auto border rounded">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        نام
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ایمیل
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {participants.map((p, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {p.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {p.email}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <>
              <div className="text-center py-4 border-b mb-6">
                <span className="text-gray-500">- یا -</span>
              </div>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  نام
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required={!csvFile}
                  value={formData.name}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[#00B100] focus:border-[#00B100]"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  ایمیل
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required={!csvFile}
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[#00B100] focus:border-[#00B100]"
                />
              </div>
            </>
          )}

          <div className="flex justify-end space-x-4 space-x-reverse">
            <button
              type="button"
              onClick={() => navigate(`/groups/${groupId}`)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00B100]"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-[#00B100] hover:bg-[#009100] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00B100] ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'در حال افزودن...' : 'افزودن'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddParticipant; 