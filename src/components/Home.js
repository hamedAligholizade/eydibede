import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function Home() {
  const [groups, setGroups] = useState([]);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold mb-4">Find Your Secret Santa Groups</h2>
        <div className="flex gap-4">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 p-2 border rounded"
          />
          <button
            onClick={fetchGroups}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Find Groups
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center">Loading...</div>
      ) : groups.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {groups.map((group) => (
            <Link
              key={group.id}
              to={`/group/${group.id}`}
              className="block bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <h3 className="text-xl font-semibold mb-2">{group.name}</h3>
              <p className="text-gray-600 mb-2">{group.description}</p>
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>Budget: ${group.budget} {group.currency}</span>
                <span className={`px-2 py-1 rounded ${
                  group.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  group.status === 'drawn' ? 'bg-green-100 text-green-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {group.status.charAt(0).toUpperCase() + group.status.slice(1)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : email ? (
        <div className="text-center text-gray-600">
          No groups found for this email.
          <Link to="/create-group" className="block mt-4 text-red-600 hover:text-red-700">
            Create a new group
          </Link>
        </div>
      ) : null}
    </div>
  );
}

export default Home; 