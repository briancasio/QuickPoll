/**
 * pollState.js - In-memory poll state management
 * 
 * This module handles all poll data storage and operations.
 * State resets on server restart (acceptable for MVP).
 */

// Current active poll (null if no poll)
let currentPoll = null;

/**
 * Get the current poll
 * @returns {Object|null} Current poll or null
 */
export function getPoll() {
  return currentPoll;
}

/**
 * Create a new poll (replaces existing)
 * @param {string} question - Poll question
 * @param {string[]} options - Array of option texts
 * @returns {Object} Created poll object
 */
export function createPoll(question, options) {
  currentPoll = {
    id: Date.now(),                    // Unique ID based on timestamp
    question,
    options: options.map((text, index) => ({
      id: index,                        // Option ID (0-based index)
      text,
      votes: 0                          // Vote counter starts at 0
    })),
    createdAt: new Date().toISOString() // Creation timestamp
  };
  return currentPoll;
}

/**
 * End the current poll (clears it)
 */
export function endPoll() {
  currentPoll = null;
}

/**
 * Cast a new vote for an option
 * @param {number} optionId - ID of the option to vote for
 * @returns {boolean} Success status
 */
export function vote(optionId) {
  if (!currentPoll) return false;
  
  // Find the option by ID
  const option = currentPoll.options.find(o => o.id === optionId);
  if (!option) return false;
  
  // Increment vote count
  option.votes += 1;
  return true;
}

/**
 * Change vote from one option to another
 * @param {number} previousOptionId - Previously selected option ID
 * @param {number} newOptionId - New option ID to vote for
 * @returns {boolean} Success status
 */
export function changeVote(previousOptionId, newOptionId) {
  if (!currentPoll) return false;
  
  // Find both options
  const prevOption = currentPoll.options.find(o => o.id === previousOptionId);
  const newOption = currentPoll.options.find(o => o.id === newOptionId);
  
  if (!newOption) return false;
  
  // Decrement previous vote (if valid)
  if (prevOption && prevOption.votes > 0) {
    prevOption.votes -= 1;
  }
  
  // Increment new vote
  newOption.votes += 1;
  return true;
}
