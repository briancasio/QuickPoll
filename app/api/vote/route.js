import { NextResponse } from 'next/server';
import { vote, changeVote } from '@/lib/pollState';

// POST: Cast a vote or change vote
export async function POST(request) {
  const { optionId, previousOptionId } = await request.json();
  
  if (optionId === undefined) {
    return NextResponse.json({ error: 'optionId required' }, { status: 400 });
  }
  
  let success;
  if (previousOptionId !== null && previousOptionId !== undefined) {
    // Changing vote
    success = changeVote(previousOptionId, optionId);
  } else {
    // New vote
    success = vote(optionId);
  }
  
  if (!success) {
    return NextResponse.json(
      { error: 'Invalid option or no active poll' },
      { status: 400 }
    );
  }
  
  return NextResponse.json({ success: true });
}
