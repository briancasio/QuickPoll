'use client';

import { useState } from 'react';
import Link from 'next/link';
import useSWR, { mutate } from 'swr';
import './globals.css';

// Fetcher for SWR
const fetcher = (url) => fetch(url).then((res) => res.json());

export default function Home() {
  const [selectedOption, setSelectedOption] = useState(null); // Track which option is selected

  // QR Code URL (using Google Charts API)
  const siteUrl = 'https://quickpoll.briancasio.com';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(siteUrl)}`;

  // Use SWR for smart polling and caching
  // Students poll less frequently (5s) since they just need to see new polls
  // Admin keeps 2s for real-time vote updates
  const { data, error, isLoading } = useSWR('/api/poll', fetcher, {
    refreshInterval: 3000, // Poll every 3 seconds (balance between responsiveness and load)
    revalidateOnFocus: true, // Refresh when window gets focus
    dedupingInterval: 1000, // Avoid duplicate requests
  });

  const poll = data?.poll;

  // Handle vote with Optimistic UI
  const handleVote = async (optionId) => {
    // Optimistically update UI immediately
    setSelectedOption(optionId);
    
    // Optimistically update the poll data locally
    if (poll) {
      const updatedPoll = {
        ...poll,
        options: poll.options.map(opt => {
          if (opt.id === optionId) {
            return { ...opt, votes: opt.votes + 1 };
          }
          if (opt.id === selectedOption) {
            return { ...opt, votes: Math.max(0, opt.votes - 1) };
          }
          return opt;
        })
      };
      
      // Update local cache immediately without waiting for server
      mutate('/api/poll', { poll: updatedPoll }, false);
    }

    try {
      await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId, previousOptionId: selectedOption })
      });
      
      // Revalidate to ensure data consistency with server
      mutate('/api/poll');
    } catch (err) {
      console.error('Failed to vote:', err);
      // Revert on error
      mutate('/api/poll');
    }
  };

  if (isLoading && !poll) {
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
          <p className="no-poll-hint">Waiting for admin to create a poll...</p>
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

      {/* QR Code - Below poll for secondary priority */}
      <div className="qr-section">
        <img src={qrCodeUrl} alt="Scan to join" className="qr-code" />
        <p className="qr-text">quickpoll.briancasio.com</p>
      </div>
    </div>
  );
}
