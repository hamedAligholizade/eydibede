import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function AdminParticipantView() {
  const { groupId, participantId } = useParams();
  const navigate = useNavigate();
  const [participant, setParticipant] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchParticipantDetails();
    fetchMessages();
  }, [participantId]);

  const fetchParticipantDetails = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/participants/${participantId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('شرکت‌کننده پیدا نشد');
      const data = await response.json();
      setParticipant(data);
    } catch (error) {
      console.error('Error fetching participant:', error);
      setError('خطا در بارگذاری اطلاعات شرکت‌کننده');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/participants/${participantId}/messages/admin`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('خطا در دریافت پیام‌ها');
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('خطا در بارگذاری پیام‌ها');
    }
  };

  if (loading) return <div className="text-center">در حال بارگذاری...</div>;
  if (!participant) return <div className="text-center text-red-600">{error || 'شرکت‌کننده پیدا نشد'}</div>;

  return (
    <div className="max-w-4xl mx-auto p-4" dir="rtl">
      <div className="mb-4">
        <button
          onClick={() => navigate(`/group/${groupId}`)}
          className="text-[#00B100] hover:text-[#009100]"
        >
          ← بازگشت به گروه
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[#00B100] mb-2">{participant.name}</h2>
          <p className="text-gray-600">{participant.email}</p>
        </div>

        {participant.assignedTo && (
          <div className="mb-6 p-4 bg-green-50 rounded-lg border border-[#00B100]">
            <h3 className="font-semibold text-[#00B100] mb-2">اطلاعات قرعه‌کشی</h3>
            <p>هدیه می‌دهد به: <span className="font-semibold">{participant.assignedTo.name}</span></p>
          </div>
        )}

        <div className="mb-6">
          <h3 className="text-xl font-semibold text-[#00B100] mb-4">لیست هدایای مورد علاقه</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            {participant.wishList ? (
              <p className="whitespace-pre-line">{participant.wishList}</p>
            ) : (
              <p className="text-gray-500">هنوز لیست هدایایی ثبت نشده است</p>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold text-[#00B100] mb-4">پیام‌های ارسال شده</h3>
          <div className="space-y-4">
            {messages.length > 0 ? (
              messages.map(message => (
                <div key={message.id} className="bg-gray-50 p-4 rounded-lg">
                  <p className="whitespace-pre-line">{message.content}</p>
                  <div className="mt-2 flex justify-between text-sm text-gray-500">
                    <span>به: {message.recipientName}</span>
                    <span>{new Date(message.createdAt).toLocaleDateString('fa-IR')}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 p-4">هنوز پیامی ارسال نشده است</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminParticipantView; 