// In-memory poll state
// Resets on server restart (acceptable for MVP)

let currentPoll = null;

export function getPoll() {
  return currentPoll;
}

export function createPoll(question, options) {
  currentPoll = {
    id: Date.now(),
    question,
    options: options.map((text, index) => ({
      id: index,
      text,
      votes: 0
    })),
    createdAt: new Date().toISOString()
  };
  return currentPoll;
}

export function endPoll() {
  currentPoll = null;
}

export function vote(optionId) {
  if (!currentPoll) return false;
  
  const option = currentPoll.options.find(o => o.id === optionId);
  if (!option) return false;
  
  option.votes += 1;
  return true;
}

export function changeVote(previousOptionId, newOptionId) {
  if (!currentPoll) return false;
  
  const prevOption = currentPoll.options.find(o => o.id === previousOptionId);
  const newOption = currentPoll.options.find(o => o.id === newOptionId);
  
  if (!newOption) return false;
  
  // Decrement previous vote if it exists
  if (prevOption && prevOption.votes > 0) {
    prevOption.votes -= 1;
  }
  
  // Increment new vote
  newOption.votes += 1;
  return true;
}
