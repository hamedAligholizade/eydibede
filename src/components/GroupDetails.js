import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function GroupDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startingDraw, setStartingDraw] = useState(false);
  const [error, setError] = useState('');
  const [newParticipant, setNewParticipant] = useState({
    name: '',
    email: ''
  });
  const [resendingEmails, setResendingEmails] = useState({});

  useEffect(() => {
    fetchGroupDetails();
  }, [id]);

  const fetchGroupDetails = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/groups/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Group not found');
      const data = await response.json();
      setGroup(data);
      fetchParticipants();
    } catch (error) {
      console.error('Error fetching group:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchParticipants = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/participants/group/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setParticipants(data);
    } catch (error) {
      console.error('Error fetching participants:', error);
    }
  };

  const handleAddParticipant = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/participants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newParticipant,
          groupId: id
        }),
      });

      if (!response.ok) throw new Error('Failed to add participant');

      await fetchParticipants();
      setNewParticipant({ name: '', email: '' });
      setError('');
    } catch (error) {
      console.error('Error adding participant:', error);
      setError('Failed to add participant');
    }
  };

  const handleStartDraw = async () => {
    if (!window.confirm('آیا مطمئن هستید که می‌خواهید قرعه‌کشی را شروع کنید؟ این عمل قابل برگشت نیست.')) {
      return;
    }

    setStartingDraw(true);
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
        throw new Error('Failed to perform draw');
      }

      alert('قرعه‌کشی با موفقیت انجام شد! شرکت‌کنندگان از طریق ایمیل نتیجه را دریافت خواهند کرد.');
      navigate('/'); // Redirect to home page after successful draw
    } catch (error) {
      console.error('Error performing draw:', error);
      setError('خطا در انجام قرعه‌کشی. لطفاً دوباره تلاش کنید.');
    } finally {
      setStartingDraw(false);
    }
  };

  const handleCsvUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError('');
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const csvText = event.target.result;
        const rows = csvText.split('\n').map(row => row.trim()).filter(row => row);
        
        // Skip header row and process data
        const participants = rows.slice(1).map(row => {
          const [name, email] = row.split(',').map(field => field.trim());
          return { name, email };
        });

        // Validate data
        const invalidRows = participants.filter(p => !p.name || !p.email || !p.email.includes('@'));
        if (invalidRows.length > 0) {
          setError('فایل CSV شامل داده‌های نامعتبر است. لطفاً فرمت را بررسی کنید.');
          return;
        }

        // Upload participants
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/participants/group/${id}/bulk`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ participants }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to upload participants');
        }

        await fetchParticipants();
        alert(`${participants.length} شرکت‌کننده با موفقیت اضافه شدند.`);
        
        // Reset file input
        e.target.value = '';
      } catch (error) {
        console.error('Error processing CSV:', error);
        setError('خطا در پردازش فایل CSV. لطفاً فرمت فایل را بررسی کنید.');
      }
    };

    reader.onerror = () => {
      setError('خطا در خواندن فایل CSV');
    };

    reader.readAsText(file);
  };

  const handleResendEmail = async (participantId) => {
    setResendingEmails(prev => ({ ...prev, [participantId]: true }));
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/groups/${id}/participants/${participantId}/resend-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to resend email');
      }

      alert('ایمیل با موفقیت ارسال شد');
    } catch (error) {
      console.error('Error resending email:', error);
      alert('خطا در ارسال مجدد ایمیل');
    } finally {
      setResendingEmails(prev => ({ ...prev, [participantId]: false }));
    }
  };

  if (loading) return <div className="text-center">Loading...</div>;
  if (!group) return null;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-3xl font-bold mb-2">{group.name}</h2>
            <p className="text-gray-600">{group.description}</p>
          </div>
          <div className="text-right">
            <p className="text-gray-600">Budget: ${group.budget} {group.currency}</p>
            <p className="text-gray-600">Draw Date: {new Date(group.drawDate).toLocaleDateString()}</p>
            <span className={`inline-block px-3 py-1 rounded-full text-sm ${
              group.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              group.status === 'drawn' ? 'bg-[#00B100] text-white' :
              'bg-blue-100 text-blue-800'
            }`}>
              {group.status === 'pending' ? 'در انتظار قرعه‌کشی' :
               group.status === 'drawn' ? 'قرعه‌کشی شده' :
               group.status}
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-[#00B100] p-4">
            <p className="text-[#00B100]">{error}</p>
          </div>
        )}

        {group.status === 'pending' && (
          <>
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-4">افزودن شرکت‌کننده</h3>
              
              {/* CSV Upload Section */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="font-semibold mb-2">آپلود فایل CSV</h4>
                <p className="text-sm text-gray-600 mb-4">
                  فایل CSV باید شامل دو ستون باشد: نام و ایمیل
                </p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCsvUpload}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-[#00B100] file:text-white
                    hover:file:bg-[#009100]"
                />
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">یا</span>
                </div>
              </div>

              {/* Manual Entry Form */}
              <form onSubmit={handleAddParticipant} className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="نام"
                    value={newParticipant.name}
                    onChange={(e) => setNewParticipant(prev => ({ ...prev, name: e.target.value }))}
                    required
                    className="p-2 border rounded"
                  />
                  <input
                    type="email"
                    placeholder="ایمیل"
                    value={newParticipant.email}
                    onChange={(e) => setNewParticipant(prev => ({ ...prev, email: e.target.value }))}
                    required
                    className="p-2 border rounded"
                  />
                </div>
                <button
                  type="submit"
                  className="mt-4 bg-[#00B100] text-white px-4 py-2 rounded hover:bg-[#009100]"
                >
                  افزودن شرکت‌کننده
                </button>
              </form>
            </div>

            {participants.length >= 3 && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="text-xl font-semibold text-green-800 mb-2">آماده برای شروع!</h3>
                <p className="text-green-700 mb-4">
                  شما {participants.length} شرکت‌کننده دارید. می‌توانید قرعه‌کشی را شروع کنید.
                </p>
                <button
                  onClick={handleStartDraw}
                  disabled={startingDraw}
                  className={`w-full bg-[#00B100] text-white py-3 px-6 rounded-lg text-lg font-semibold hover:bg-[#009100] transition-colors ${
                    startingDraw ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {startingDraw ? 'در حال انجام قرعه‌کشی...' : 'شروع قرعه‌کشی'}
                </button>
              </div>
            )}
          </>
        )}

        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">شرکت‌کنندگان ({participants.length})</h3>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {participants.map((participant) => (
              <div
                key={participant.id}
                className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/group/${id}/participant/${participant.id}`)}
              >
                <h4 className="font-semibold">{participant.name}</h4>
                <p className="text-gray-600 text-sm">{participant.email}</p>
                {group.status === 'drawn' && participant.secretSantaFor && (
                  <div className="mt-2">
                    <p className="text-sm text-[#00B100]">
                      هدیه می‌دهد به: {participant.secretSantaFor.name}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent navigation when clicking the button
                        handleResendEmail(participant.id);
                      }}
                      disabled={resendingEmails[participant.id]}
                      className={`mt-2 text-sm px-3 py-1 rounded-md bg-[#00B100] text-white hover:bg-[#009100] transition-colors ${
                        resendingEmails[participant.id] ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {resendingEmails[participant.id] ? 'در حال ارسال...' : 'ارسال مجدد ایمیل'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {participants.length < 3 && group.status === 'pending' && (
            <div className="mt-6 text-center text-gray-600">
              برای شروع قرعه‌کشی حداقل به {3 - participants.length} شرکت‌کننده دیگر نیاز دارید.
            </div>
          )}
         <div className=" bg-contain bg-no-repeat"
             style={{ backgroundImage: 'url("/images/koskhola.png")', width: '650px', height: '650px', marginTop: '20px' }}></div>
        </div>
      </div>
    </div>
  );
}

export default GroupDetails; 