import { NextResponse } from 'next/server';
import { getPoll, createPoll, endPoll } from '@/lib/pollState';

// Check admin credentials from Authorization header (Basic auth)
function isAuthorized(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Basic ')) return false;
  
  const base64 = authHeader.slice(6);
  const decoded = Buffer.from(base64, 'base64').toString('utf-8');
  const [user, pass] = decoded.split(':');
  
  return user === process.env.ADMIN_USER && pass === process.env.ADMIN_PASS;
}

// GET: Fetch current poll
export async function GET() {
  const poll = getPoll();
  return NextResponse.json({ poll });
}

// POST: Create new poll (admin only)
export async function POST(request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { question, options } = await request.json();
  
  if (!question || !options || !Array.isArray(options) || options.length < 2) {
    return NextResponse.json(
      { error: 'Question and at least 2 options required' },
      { status: 400 }
    );
  }
  
  const poll = createPoll(question, options);
  return NextResponse.json({ poll });
}

// DELETE: End current poll (admin only)
export async function DELETE(request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  endPoll();
  return NextResponse.json({ success: true });
}
