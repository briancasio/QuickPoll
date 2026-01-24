'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import useSWR, { mutate } from 'swr';
import '../globals.css';

// Fetcher for SWR
const fetcher = (url) => fetch(url).then((res) => res.json());

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authToken, setAuthToken] = useState('');
  
  // Use SWR for smart polling
  const { data, error } = useSWR(isLoggedIn ? '/api/poll' : null, fetcher, {
    refreshInterval: 2000,
    revalidateOnFocus: true,
    dedupingInterval: 500,
  });
  
  const poll = data?.poll;
  
  // Login form
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  // Poll creation - default to Yes/No for speed
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['Yes', 'No']);
  const [isListening, setIsListening] = useState(false);
  const [activeInput, setActiveInput] = useState(null); // 'question' or option index
  const [isIOS, setIsIOS] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const recognitionRef = useRef(null);
  const questionInputRef = useRef(null);

  // Fetch current poll - kept for manual refresh if needed
  const fetchPoll = () => mutate('/api/poll');

  useEffect(() => {
    // Check for stored token (persistent across browser sessions)
    const token = localStorage.getItem('adminToken');
    if (token) {
      setAuthToken(token);
      setIsLoggedIn(true);
    }
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
    
    // Detect iOS/iPadOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    if (isIOSDevice) {
      console.log('iOS detected');
      setIsIOS(true);
    }
    
    if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      console.log('Speech recognition not supported');
      setIsSpeechSupported(false);
      return;
    }
    
    setIsSpeechSupported(true);
    
    console.log('Initializing speech recognition...');
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true; // Keep listening until manually stopped
    recognitionRef.current.lang = 'en-US';
    recognitionRef.current.interimResults = false; // Only final results
    
    recognitionRef.current.onstart = () => {
      console.log('Speech recognition started');
    };
    
    recognitionRef.current.onresult = (event) => {
      console.log('Speech recognition result:', event);
      const result = event.results[event.results.length - 1];
      
      if (result.isFinal) {
        const transcript = result[0].transcript;
        console.log('Transcript:', transcript, 'Active input:', activeInputRef.current);
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
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };
    
    recognitionRef.current.onend = () => {
      console.log('Speech recognition ended');
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
        localStorage.setItem('adminToken', data.token);
      } else {
        setLoginError('Invalid credentials');
      }
    } catch (err) {
      setLoginError('Login failed');
    }
  };

  // Autofocus question input when logged in
  useEffect(() => {
    if (isLoggedIn && questionInputRef.current) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        questionInputRef.current.focus();
      }, 100);
    }
  }, [isLoggedIn]);

  // Stop voice input (called on mouse up)
  const stopVoice = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  // Start voice input (called on mouse down)
  const startVoice = (inputType) => {
    console.log('startVoice called with:', inputType);
    if (!recognitionRef.current) {
      alert('Speech recognition not supported in this browser');
      return;
    }
    
    // Don't start if already listening
    if (isListening) {
      console.log('Already listening, skipping start');
      return;
    }
    
    setActiveInput(inputType);
    setIsListening(true);
    try {
      console.log('Starting speech recognition...');
      recognitionRef.current.start();
    } catch (err) {
      // Handle case where recognition is already started
      console.error('Recognition start error:', err);
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
    
    // Auto-add new option when typing in the last one
    if (index === options.length - 1 && value.trim() && options.length < 10) {
      setOptions([...newOptions, '']);
    }
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
        
        // Haptic feedback on iOS
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
        
        // Show success toast
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
        
        // Refocus question input for next poll
        if (questionInputRef.current) {
          questionInputRef.current.focus();
        }
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
    localStorage.removeItem('adminToken');
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

        {/* Success Toast */}
        {showSuccess && (
          <div className="success-toast">
            ✓ Poll created successfully!
          </div>
        )}

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
          
          {/* iOS Dictation Tip - Only show if speech API is NOT supported AND we are on iOS */}
          {!isSpeechSupported && isIOS && (
            <div className="ios-tip">
              <span className="ios-tip-icon">💡</span>
              <span>Tap the <strong>🎤</strong> button on your keyboard (bottom right) to dictate text</span>
            </div>
          )}
          
          <form onSubmit={handleCreatePoll}>
            {/* Create Poll Button - TOP for quick access */}
            <button type="submit" className="btn-primary btn-create btn-create-top">
              {poll ? 'Replace Current Poll' : 'Create Poll'}
            </button>

            {/* Question Input */}
            <div className="input-group">
              <label>Question</label>
              <div className="input-with-voice">
                <input
                  ref={questionInputRef}
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Enter your poll question..."
                />
                {isSpeechSupported && (
                  <button
                    type="button"
                    onMouseDown={() => startVoice('question')}
                    onMouseUp={stopVoice}
                    onMouseLeave={stopVoice}
                    onTouchStart={() => startVoice('question')}
                    onTouchEnd={stopVoice}
                    className={`btn-voice ${isListening && activeInput === 'question' ? 'listening' : ''}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                      <line x1="12" y1="19" x2="12" y2="23"></line>
                      <line x1="8" y1="23" x2="16" y2="23"></line>
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Templates */}
            <div className="templates">
              <label>Quick Templates</label>
              <div className="template-buttons">
                <button type="button" onClick={() => applyTemplate('yesno')} className="active">Yes / No</button>
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
                    {isSpeechSupported && (
                      <button
                        type="button"
                        onMouseDown={() => startVoice(index)}
                        onMouseUp={stopVoice}
                        onMouseLeave={stopVoice}
                        onTouchStart={() => startVoice(index)}
                        onTouchEnd={stopVoice}
                        className={`btn-voice ${isListening && activeInput === index ? 'listening' : ''}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                          <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                          <line x1="12" y1="19" x2="12" y2="23"></line>
                          <line x1="8" y1="23" x2="16" y2="23"></line>
                        </svg>
                      </button>
                    )}
                  </div>
                  {options.length > 2 && (
                    <button type="button" onClick={() => removeOption(index)} className="btn-remove">×</button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addOption} className="btn-add">+ Add Option</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
