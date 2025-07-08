import React, { useState, useEffect } from 'react';

const ApiDebugPanel = ({ darkMode }) => {
  const [apiCalls, setApiCalls] = useState([]);
  const [showRawData, setShowRawData] = useState(false);
  const [gameData, setGameData] = useState(null);

  const fetchGameData = async () => {
    try {
      const response = await fetch('http://localhost:8080/api_tools/return_data/checkers_moves', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer 4e31d5e989125dc49a09d234c59e85bc',
          'X-Generated-App-ID': 'f90b7499-c495-4817-bb4b-9b98df8a1969'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setGameData(data);
      }
    } catch (error) {
      console.error('Failed to fetch game data:', error);
    }
  };

  const deleteGameData = async () => {
    try {
      const response = await fetch('http://localhost:8080/api_tools/objects/checkers_moves', {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer 4e31d5e989125dc49a09d234c59e85bc',
          'X-Generated-App-ID': 'f90b7499-c495-4817-bb4b-9b98df8a1969'
        }
      });
      
      if (response.ok) {
        setGameData(null);
        alert('Game data deleted successfully');
      }
    } catch (error) {
      console.error('Failed to delete game data:', error);
    }
  };

  return (
    <div className={`rounded-2xl shadow-lg p-6 ${
      darkMode ? 'bg-gray-800' : 'bg-white'
    }`}>
      <h3 className="text-xl font-bold mb-4 text-primary-600 dark:text-primary-400">
        API Debug Panel
      </h3>
      
      <div className="space-y-4">
        <div className="flex space-x-2">
          <button
            onClick={fetchGameData}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-green-400"
            aria-label="Show raw API data"
          >
            Show Raw Data
          </button>
          
          <button
            onClick={deleteGameData}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
            aria-label="Delete game objects"
          >
            Delete Objects
          </button>
        </div>

        {gameData && (
          <div className={`p-4 rounded-lg border ${
            darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
          }`}>
            <h4 className="font-semibold mb-2">Game Data:</h4>
            <pre className="text-xs overflow-auto max-h-40">
              {JSON.stringify(gameData, null, 2)}
            </pre>
          </div>
        )}

        <div className={`rounded-lg border ${
          darkMode ? 'border-gray-600' : 'border-gray-200'
        }`}>
          <div className="p-4 border-b border-gray-200 dark:border-gray-600">
            <h4 className="font-semibold">Recent API Calls</h4>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {apiCalls.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                No API calls yet
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-600">
                {apiCalls.map((call) => (
                  <div key={call.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        call.method === 'POST' 
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      }`}>
                        {call.method}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(call.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    
                    <div className="text-sm font-mono mb-2">
                      {call.endpoint}
                    </div>
                    
                    <details className="text-xs">
                      <summary className="cursor-pointer text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                        View Details
                      </summary>
                      <div className="mt-2 space-y-2">
                        <div>
                          <strong>Request:</strong>
                          <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-700 rounded overflow-auto">
                            {JSON.stringify(call.data, null, 2)}
                          </pre>
                        </div>
                        <div>
                          <strong>Response:</strong>
                          <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-700 rounded overflow-auto">
                            {JSON.stringify(call.response, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </details>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiDebugPanel;
