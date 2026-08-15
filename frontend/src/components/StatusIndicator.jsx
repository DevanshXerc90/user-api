import { useState, useEffect } from 'react';
import { getApiUrl } from '../services/api';

export default function StatusIndicator({ backend }) {
  const [status, setStatus] = useState('checking'); // checking, connected, disconnected
  
  useEffect(() => {
    let isMounted = true;
    setStatus('checking');
    
    // We do a lightweight fetch to the /users endpoint with limit=1 to check connection
    const checkConnection = async () => {
      try {
        const response = await fetch(`${getApiUrl(backend)}/users?limit=1`);
        if (isMounted) {
          setStatus(response.ok ? 'connected' : 'disconnected');
        }
      } catch (error) {
        if (isMounted) {
          setStatus('disconnected');
        }
      }
    };
    
    checkConnection();
    
    return () => {
      isMounted = false;
    };
  }, [backend]);
  
  return (
    <div className="status-indicator">
      API Status: 
      <span className={`status-badge status-${status}`}>
        {status === 'checking' && 'Checking...'}
        {status === 'connected' && 'Connected'}
        {status === 'disconnected' && 'Disconnected'}
      </span>
    </div>
  );
}
