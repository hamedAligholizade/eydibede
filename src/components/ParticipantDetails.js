import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

function ParticipantDetails() {
  const { id } = useParams();
  const [participant, setParticipant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wishList, setWishList] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [saving, setSaving] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchParticipantDetails();
    fetchMessages();
  }, [id]);

  const fetchParticipantDetails = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/participants/${id}`);
      if (!response.ok) throw new Error('شرکت‌کننده پیدا نشد');
      const data = await response.json();
      setParticipant(data);
      setWishList(data.wishList || '');
    } catch (error) {
      console.error('Error fetching participant:', error);
      setError('خطا در بارگذاری اطلاعات');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/participants/${id}/messages`);
      if (!response.ok) throw new Error('خطا در دریافت پیام‌ها');
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSaveWishList = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/participants/${id}/wishlist`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ wishList }),
      });

      if (!response.ok) throw new Error('خطا در ذخیره لیست هدایا');
      const updatedParticipant = await response.json();
      setParticipant(updatedParticipant);
      alert('لیست هدایا با موفقیت ذخیره شد!');
    } catch (error) {
      console.error('Error saving wish list:', error);
      setError('خطا در ذخیره لیست هدایا');
    } finally {
      setSaving(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSendingMessage(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/participants/${id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: message }),
      });

      if (!response.ok) throw new Error('خطا در ارسال پیام');
      
      setMessage('');
      await fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      setError('خطا در ارسال پیام');
    } finally {
      setSendingMessage(false);
    }
  };

  if (loading) return <div className="text-center">در حال بارگذاری...</div>;
  if (!participant) return <div className="text-center text-red-600">{error || 'شرکت‌کننده پیدا نشد'}</div>;

  return (
    <div className="max-w-4xl mx-auto p-4" dir="rtl">
      {error && (
        <div className="mb-6 bg-red-50 border-r-4 border-[#00B100] p-4">
          <p className="text-[#00B100]">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6 mb-6 relative overflow-hidden">
        {/* Nowruz decorative elements */}
        <div className="absolute top-0 left-0 w-full h-16 bg-gradient-to-r from-[#FF9933] via-[#00B100] to-[#FF5733] opacity-20"></div>
        <div className="absolute top-0 left-0 w-24 h-20 bg-contain bg-no-repeat transform -scale-x-100"
             style={{ backgroundImage: 'url("/images/haft-sin.jpg")', width: '88px', height: '100px' }}></div>

        <div className="mb-8 relative">
          <h2 className="text-3xl font-bold mb-2 text-[#00B100]">{participant.name}</h2>
          <p className="text-lg text-gray-600">به جشن عیدی X Buddy خوش آمدید</p>
        </div>

        <div className="mb-8 bg-gradient-to-r from-[#FFECD2] to-white p-6 rounded-lg border border-[#FFD700] relative">
          <h3 className="text-xl font-semibold mb-4 text-[#B8860B]">لیست هدایای نوروزی شما</h3>
          <textarea
            value={wishList}
            onChange={(e) => setWishList(e.target.value)}
            className="w-full p-4 border border-[#FFD700] rounded min-h-[200px] bg-white/80"
            placeholder="لیست هدایای مورد علاقه خود را برای عید اینجا بنویسید..."
          />
          <button
            onClick={handleSaveWishList}
            disabled={saving}
            className={`mt-4 bg-[#00B100] text-white px-6 py-2 rounded hover:bg-[#009100] ${
              saving ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {saving ? 'در حال ذخیره...' : 'ذخیره لیست'}
          </button>
        </div>

        {participant.assignedTo && (
          <>
            <div className="mt-8 p-6 bg-gradient-to-r from-[#E8F5E9] to-white rounded-lg border border-[#00B100]">
              <h3 className="text-xl font-semibold text-[#00B100] mb-4">
                دوست نوروزی شما
              </h3>
              <p className="text-[#006400] text-lg">
                شما عیدی دهنده به این شخص هستید: <strong className="text-[#00B100]">{participant.assignedTo.name}</strong>
              </p>
              {participant.assignedTo.wishList && (
                <div className="mt-6 bg-white/80 p-4 rounded-lg border border-[#00B100]">
                  <h4 className="font-semibold text-[#00B100] mb-2">لیست هدایای مورد علاقه ایشان:</h4>
                  <p className="text-gray-700 whitespace-pre-line">
                    {participant.assignedTo.wishList}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4 text-[#00B100]">ارسال پیام نوروزی</h3>
              <form onSubmit={handleSendMessage} className="space-y-4">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full p-4 border border-[#00B100] rounded min-h-[100px] bg-white"
                  placeholder="پیام تبریک عید خود را به دوست X Buddy بنویسید..."
                />
                <button
                  type="submit"
                  disabled={sendingMessage || !message.trim()}
                  className={`bg-[#00B100] text-white px-6 py-2 rounded hover:bg-[#009100] ${
                    sendingMessage || !message.trim() ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {sendingMessage ? 'در حال ارسال...' : 'ارسال پیام'}
                </button>
              </form>
            </div>

            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4 text-[#00B100]">پیام‌های نوروزی شما</h3>
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <p className="text-gray-500 text-center p-4 bg-gray-50 rounded-lg">هنوز پیامی دریافت نکرده‌اید</p>
                ) : (
                  messages.map(message => (
                    <div key={message.id} className="bg-gradient-to-r from-[#E8F5E9] to-white p-4 rounded-lg border border-[#00B100]">
                      <p className="whitespace-pre-line text-gray-700">{message.content}</p>
                      <p className="text-sm text-[#00B100] mt-2">
                        {new Date(message.createdAt).toLocaleDateString('fa-IR')}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}

        {/* Nowruz footer decoration */}
        <div className="mt-8 pt-8 border-t border-[#FFD700] text-center">
          <p className="text-[#00B100] text-lg">نوروزتان پیروز</p>
          <p className="text-gray-600">هر روزتان نوروز، نوروزتان پیروز</p>
          <div className=" bg-contain bg-no-repeat"
             style={{ backgroundImage: 'url("/images/mahmooda.png")', width: '650px', height: '650px', marginTop: '20px' }}></div>
        </div>
      </div>
    </div>
  );
}

export default ParticipantDetails; 