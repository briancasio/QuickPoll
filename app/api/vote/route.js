/**
 * /api/vote - Voting API
 * 
 * POST - Cast a vote or change an existing vote
 */

import { NextResponse } from 'next/server';
import { vote, changeVote } from '@/lib/pollState';

/**
 * POST /api/vote - Cast or change a vote
 * Public endpoint - no auth required
 * Body: { optionId: number, previousOptionId?: number }
 */
export async function POST(request) {
  // Parse request body
  const { optionId, previousOptionId } = await request.json();
  
  // Validate optionId is provided
  if (optionId === undefined) {
    return NextResponse.json({ error: 'optionId required' }, { status: 400 });
  }
  
  let success;
  
  // Check if this is a vote change or new vote
  if (previousOptionId !== null && previousOptionId !== undefined) {
    // User is changing their vote
    success = changeVote(previousOptionId, optionId);
  } else {
    // User is voting for the first time
    success = vote(optionId);
  }
  
  // Handle failure (invalid option or no active poll)
  if (!success) {
    return NextResponse.json(
      { error: 'Invalid option or no active poll' },
      { status: 400 }
    );
  }
  
  // Vote recorded successfully
  return NextResponse.json({ success: true });
}
