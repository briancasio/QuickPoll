/**
 * page.js - Student View (Homepage)
 * 
 * This is the main page where students vote on polls.
 * Features:
 * - Real-time poll display
 * - Optimistic UI updates for instant feedback
 * - QR code for easy sharing
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import useSWR, { mutate } from 'swr';
import './globals.css';

// Fetcher function for SWR data fetching
const fetcher = (url) => fetch(url).then((res) => res.json());

export default function Home() {
  // Track which option the user has selected
  const [selectedOption, setSelectedOption] = useState(null);

  // QR Code configuration - points to the deployed app
  const siteUrl = 'https://quickpoll.briancasio.com';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(siteUrl)}`;

  // SWR hook for automatic polling and caching
  // Polls every 3 seconds to check for new polls or vote updates
  const { data, error, isLoading } = useSWR('/api/poll', fetcher, {
    refreshInterval: 3000,      // Refresh every 3 seconds
    revalidateOnFocus: true,    // Refresh when user returns to tab
    dedupingInterval: 1000,     // Prevent duplicate requests within 1s
  });

  // Extract poll from response
  const poll = data?.poll;

  /**
   * Handle voting with Optimistic UI
   * Updates the UI immediately before the server responds
   * for a snappy user experience
   */
  const handleVote = async (optionId) => {
    // 1. Update selected option immediately
    setSelectedOption(optionId);
    
    // 2. Optimistically update vote counts in the cache
    if (poll) {
      const updatedPoll = {
        ...poll,
        options: poll.options.map(opt => {
          // Increment vote for selected option
          if (opt.id === optionId) {
            return { ...opt, votes: opt.votes + 1 };
          }
          // Decrement vote for previously selected option (if changing vote)
          if (opt.id === selectedOption) {
            return { ...opt, votes: Math.max(0, opt.votes - 1) };
          }
          return opt;
        })
      };
      
      // Update local cache without revalidating yet
      mutate('/api/poll', { poll: updatedPoll }, false);
    }

    // 3. Send vote to server
    try {
      await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId, previousOptionId: selectedOption })
      });
      
      // Revalidate to sync with server
      mutate('/api/poll');
    } catch (err) {
      console.error('Failed to vote:', err);
      // Revert optimistic update on error
      mutate('/api/poll');
    }
  };

  // Show loading state on initial load
  if (isLoading && !poll) {
    return (
      <div className="container">
        <p className="loading">Loading...</p>
      </div>
    );
  }

  // Main render
  return (
    <div className="container">
      {/* Navigation - link to admin page */}
      <nav className="nav">
        <Link href="/admin" className="nav-link">Admin</Link>
      </nav>

      {/* Poll content or "no poll" message */}
      {!poll ? (
        // No active poll
        <div className="no-poll">
          <p>No poll available at the moment.</p>
          <p className="no-poll-hint">Waiting for admin to create a poll...</p>
        </div>
      ) : (
        // Active poll
        <div className="poll">
          {/* Poll question */}
          <h1 className="question">{poll.question}</h1>
          
          {/* Voting options */}
          <div className="options">
            {poll.options.map((option) => (
              <button
                key={option.id}
                className={`option ${selectedOption === option.id ? 'selected' : ''}`}
                onClick={() => handleVote(option.id)}
              >
                <span className="option-text">{option.text}</span>
                {/* Show checkmark for selected option */}
                {selectedOption === option.id && (
                  <span className="option-check">✓</span>
                )}
              </button>
            ))}
          </div>

          {/* Confirmation message after voting */}
          {selectedOption !== null && (
            <p className="vote-message">Your vote has been recorded. You can change it anytime.</p>
          )}
        </div>
      )}

      {/* QR Code for easy access */}
      <div className="qr-section">
        <img src={qrCodeUrl} alt="Scan to join" className="qr-code" />
        <p className="qr-text">quickpoll.briancasio.com</p>
      </div>
    </div>
  );
}
