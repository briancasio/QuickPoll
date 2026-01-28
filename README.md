# QuickPoll 🗳️

Real-time polling app for classrooms. Voice-enabled, optimized for iPhone.

## Requirements

- Node.js 18+
- [Vercel](https://vercel.com) account (free)

---

## Local Setup

```bash
# 1. Clone the repo
git clone https://github.com/briancasio/QuickPoll.git
cd QuickPoll

# 2. Install dependencies
npm install

# 3. Create .env.local file
echo "ADMIN_USER=admin" > .env.local
echo "ADMIN_PASS=yourpassword123" >> .env.local

# 4. Run the app
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploy to Vercel (Free)

1. Fork this repo on GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your fork
4. Add **Environment Variables**:
   - `ADMIN_USER` = `admin`
   - `ADMIN_PASS` = `yourpassword123`
5. Click **Deploy**

---

## Usage

| Page | URL | Description |
|------|-----|-------------|
| Students | `/` | Vote on polls |
| Admin | `/admin` | Create polls |

**Admin credentials:** The ones you set in `.env.local`

---

## Features

- Real-time polls
- Voice input for poll creation (desktop)
- Keyboard dictation (iPhone)
- QR code for students
- Rate limiting (1 vote/5s)
- Auto-cleanup (2 min idle)
- Max 100 concurrent students

---

## Project Structure

```
quickpoll/
├── app/
│   ├── page.js         # Student view
│   ├── admin/page.js   # Admin dashboard
│   └── api/            # API routes
├── lib/pollState.js    # Poll state management
└── .env.local          # Environment vars (don't commit)
```

---

## Troubleshooting

**"Unauthorized" on login:**  
→ Check that `.env.local` has `ADMIN_USER` and `ADMIN_PASS`

**No mic button on iPhone:**  
→ Expected. Use the 🎤 on your iOS keyboard

**Polls disappear:**  
→ They auto-clear 2 min after the last vote

---

## License

MIT
