'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import './globals.css';

export default function Home() {
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState(null); // Track which option is selected

  // Fetch poll data
  const fetchPoll = async () => {
    try {
      const res = await fetch('/api/poll');
      const data = await res.json();
      setPoll(data.poll);
    } catch (err) {
      console.error('Failed to fetch poll:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and set up polling interval
  useEffect(() => {
    fetchPoll();
    const interval = setInterval(fetchPoll, 2000);
    return () => clearInterval(interval);
  }, []);

  // Handle vote - allows changing vote
  const handleVote = async (optionId) => {
    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId, previousOptionId: selectedOption })
      });
      
      if (res.ok) {
        setSelectedOption(optionId);
        fetchPoll(); // Immediately refresh
      }
    } catch (err) {
      console.error('Failed to vote:', err);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <p className="loading">Loading...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <nav className="nav">
        <Link href="/admin" className="nav-link">Admin</Link>
      </nav>

      {!poll ? (
        <div className="no-poll">
          <p>No poll available at the moment.</p>
        </div>
      ) : (
        <div className="poll">
          <h1 className="question">{poll.question}</h1>
          
          <div className="options">
            {poll.options.map((option) => (
              <button
                key={option.id}
                className={`option ${selectedOption === option.id ? 'selected' : ''}`}
                onClick={() => handleVote(option.id)}
              >
                <span className="option-text">{option.text}</span>
                {selectedOption === option.id && (
                  <span className="option-check">✓</span>
                )}
              </button>
            ))}
          </div>

          {selectedOption !== null && (
            <p className="vote-message">Your vote has been recorded. You can change it anytime.</p>
          )}
        </div>
      )}
    </div>
  );
}
