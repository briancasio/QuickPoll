# QuickPoll 

## Hi Daniel!!

I'm Brian Casio! I'm in your Computer Organization class with Dr. Moore.

Something you said during our first lab really stuck with me! You mentioned that asking questions to the group can be a bad habit and that you're trying to avoid it. I don't really see it as a bad habit, since it's a quick way to see what the class understands, but I totally get that answering out loud can feel intimidating for some people.

Over the past few days I've been working on a small app on my own time that lets students answer questions anonymously and in real time. The idea is to keep that quick feedback without putting anyone on the spot :)

If you want to try it, it works best on Chrome:  
**https://quickpoll.briancasio.com**

**Login:** admin  
**Password:** password123

No expectations at all that you'll use it!! This is a proof of concept, you can do whatever you want with it, I just wanted to show you the idea :)

Thanks!!  
Brian

---

## Requirements to deploy your own version

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

## Deploy online with Vercel (Free)

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
