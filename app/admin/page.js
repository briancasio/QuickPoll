'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import '../globals.css';

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authToken, setAuthToken] = useState('');
  const [poll, setPoll] = useState(null);
  
  // Login form
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  // Poll creation
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [isListening, setIsListening] = useState(false);
  const [activeInput, setActiveInput] = useState(null); // 'question' or option index
  
  const recognitionRef = useRef(null);

  // Fetch current poll
  const fetchPoll = async () => {
    try {
      const res = await fetch('/api/poll');
      const data = await res.json();
      setPoll(data.poll);
    } catch (err) {
      console.error('Failed to fetch poll:', err);
    }
  };

  useEffect(() => {
    // Check for stored token
    const token = sessionStorage.getItem('adminToken');
    if (token) {
      setAuthToken(token);
      setIsLoggedIn(true);
    }
    fetchPoll();
    
    // Auto-refresh poll data every 2 seconds for real-time updates
    const interval = setInterval(fetchPoll, 2000);
    return () => clearInterval(interval);
  }, []);

  // Ref for silence timeout
  const silenceTimeoutRef = useRef(null);

  // Refs to store current values for use in callbacks
  const activeInputRef = useRef(null);
  
  // Keep ref updated when activeInput changes
  useEffect(() => {
    activeInputRef.current = activeInput;
  }, [activeInput]);

  // Initialize speech recognition and set up event handlers (only once)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) return;
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true; // Keep listening until manually stopped
    recognitionRef.current.lang = 'en-US';
    recognitionRef.current.interimResults = false; // Only final results
    
    recognitionRef.current.onresult = (event) => {
      const result = event.results[event.results.length - 1];
      
      if (result.isFinal) {
        const transcript = result[0].transcript;
        const currentActiveInput = activeInputRef.current;
        
        if (currentActiveInput === 'question') {
          setQuestion(prev => prev + (prev ? ' ' : '') + transcript);
        } else if (typeof currentActiveInput === 'number') {
          setOptions(prevOptions => {
            const newOptions = [...prevOptions];
            newOptions[currentActiveInput] = (newOptions[currentActiveInput] || '') + (newOptions[currentActiveInput] ? ' ' : '') + transcript;
            return newOptions;
          });
        }
        
        // Auto-stop after getting a result
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
        setIsListening(false);
      }
    };
    
    recognitionRef.current.onerror = (event) => {
      console.log('Speech recognition error:', event.error);
      setIsListening(false);
    };
    
    recognitionRef.current.onend = () => {
      setIsListening(false);
    };
    
    // Cleanup on unmount
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []); // Empty deps - only run once on mount

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setAuthToken(data.token);
        setIsLoggedIn(true);
        sessionStorage.setItem('adminToken', data.token);
      } else {
        setLoginError('Invalid credentials');
      }
    } catch (err) {
      setLoginError('Login failed');
    }
  };

  // Stop voice input (called on mouse up)
  const stopVoice = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  // Start voice input (called on mouse down)
  const startVoice = (inputType) => {
    if (!recognitionRef.current) {
      alert('Speech recognition not supported in this browser');
      return;
    }
    
    // Don't start if already listening
    if (isListening) return;
    
    setActiveInput(inputType);
    setIsListening(true);
    try {
      recognitionRef.current.start();
    } catch (err) {
      // Handle case where recognition is already started
      console.log('Recognition already started');
    }
  };

  // Option templates
  const applyTemplate = (template) => {
    switch (template) {
      case 'yesno':
        setOptions(['Yes', 'No']);
        break;
      case '123':
        setOptions(['1', '2', '3']);
        break;
      case '12345':
        setOptions(['1', '2', '3', '4', '5']);
        break;
    }
  };

  // Add/remove options
  const addOption = () => setOptions([...options, '']);
  const removeOption = (index) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };
  const updateOption = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  // Create poll
  const handleCreatePoll = async (e) => {
    e.preventDefault();
    
    const validOptions = options.filter(o => o.trim());
    if (!question.trim() || validOptions.length < 2) {
      alert('Please enter a question and at least 2 options');
      return;
    }
    
    try {
      const res = await fetch('/api/poll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${authToken}`
        },
        body: JSON.stringify({ question: question.trim(), options: validOptions })
      });
      
      if (res.ok) {
        fetchPoll();
        setQuestion('');
        setOptions(['', '']);
      }
    } catch (err) {
      console.error('Failed to create poll:', err);
    }
  };

  // End poll
  const handleEndPoll = async () => {
    try {
      await fetch('/api/poll', {
        method: 'DELETE',
        headers: { 'Authorization': `Basic ${authToken}` }
      });
      fetchPoll();
    } catch (err) {
      console.error('Failed to end poll:', err);
    }
  };

  // Logout
  const handleLogout = () => {
    setIsLoggedIn(false);
    setAuthToken('');
    sessionStorage.removeItem('adminToken');
  };

  // Login form
  if (!isLoggedIn) {
    return (
      <div className="container">
        <nav className="nav">
          <Link href="/" className="nav-link">← Back to Poll</Link>
        </nav>
        
        <div className="admin-login">
          <h1>Admin Login</h1>
          <form onSubmit={handleLogin}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {loginError && <p className="error">{loginError}</p>}
            <button type="submit" className="btn-primary">Login</button>
          </form>
        </div>
      </div>
    );
  }

  // Admin dashboard
  return (
    <div className="container">
      <nav className="nav">
        <Link href="/" className="nav-link">← Back to Poll</Link>
        <button onClick={handleLogout} className="nav-link logout">Logout</button>
      </nav>

      <div className="admin-dashboard">
        <h1>Admin Dashboard</h1>

        {/* Current Poll Status */}
        {poll && (() => {
          const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);
          return (
            <div className="current-poll">
              <h2>Current Poll <span className="live-badge">● LIVE</span></h2>
              <p className="poll-question">{poll.question}</p>
              <div className="poll-results">
                {poll.options.map((opt) => {
                  const percentage = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                  return (
                    <div key={opt.id} className="result-row">
                      <div className="result-info">
                        <span className="result-text">{opt.text}</span>
                        <span className="result-stats">{opt.votes} votes ({percentage}%)</span>
                      </div>
                      <div className="result-bar-container">
                        <div className="result-bar" style={{ width: `${percentage}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="total-votes-admin">Total votes: {totalVotes}</p>
              <button onClick={handleEndPoll} className="btn-danger">End Poll</button>
            </div>
          );
        })()}

        {/* Create Poll Form */}
        <div className="create-poll">
          <h2>{poll ? 'Replace Poll' : 'Create Poll'}</h2>
          
          <form onSubmit={handleCreatePoll}>
            {/* Question Input */}
            <div className="input-group">
              <label>Question</label>
              <div className="input-with-voice">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Enter your poll question..."
                />
                <button
                  type="button"
                  onMouseDown={() => startVoice('question')}
                  onMouseUp={stopVoice}
                  onMouseLeave={stopVoice}
                  onTouchStart={() => startVoice('question')}
                  onTouchEnd={stopVoice}
                  className={`btn-voice ${isListening && activeInput === 'question' ? 'listening' : ''}`}
                >
                  🎤
                </button>
              </div>
            </div>

            {/* Templates */}
            <div className="templates">
              <label>Quick Templates</label>
              <div className="template-buttons">
                <button type="button" onClick={() => applyTemplate('yesno')}>Yes / No</button>
                <button type="button" onClick={() => applyTemplate('123')}>1 / 2 / 3</button>
                <button type="button" onClick={() => applyTemplate('12345')}>1 / 2 / 3 / 4 / 5</button>
              </div>
            </div>

            {/* Options Input */}
            <div className="options-group">
              <label>Options</label>
              {options.map((opt, index) => (
                <div key={index} className="option-input">
                  <div className="input-with-voice">
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => updateOption(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                    />
                    <button
                      type="button"
                      onMouseDown={() => startVoice(index)}
                      onMouseUp={stopVoice}
                      onMouseLeave={stopVoice}
                      onTouchStart={() => startVoice(index)}
                      onTouchEnd={stopVoice}
                      className={`btn-voice ${isListening && activeInput === index ? 'listening' : ''}`}
                    >
                      🎤
                    </button>
                  </div>
                  {options.length > 2 && (
                    <button type="button" onClick={() => removeOption(index)} className="btn-remove">×</button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addOption} className="btn-add">+ Add Option</button>
            </div>

            <button type="submit" className="btn-primary btn-create">
              {poll ? 'Replace Current Poll' : 'Create Poll'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
