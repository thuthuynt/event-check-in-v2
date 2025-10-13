# Event Check-in System

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cloudflare/templates/tree/main/event-checkin-template)

![Event Check-in System](https://imagedelivery.net/wSMYJvS3Xw-n339CbDyDIA/52b88668-0144-489c-dd02-fe620270ba00/public)

<!-- dash-content-start -->

A professional event check-in system built with Astro, React, and Cloudflare's developer stack. Perfect for running events, marathons, conferences, and any event requiring participant check-in with photo capture and digital signatures.

## Features

- 🎨 Modern UI built with Astro and React
- 📸 Photo capture using device camera
- ✍️ Digital signature pad with touch support
- 🔍 Real-time participant search
- 📊 Live check-in statistics
- 🚀 Deploy to Cloudflare Workers
- 📦 Powered by Cloudflare D1 database
- 🗄️ R2 storage for photos and signatures
- ✨ Clean, responsive interface
- 📱 Mobile-optimized for tablets and phones
- 🔐 Token-based API authentication

## Tech Stack

- Frontend: [Astro](https://astro.build) + [React](https://react.dev)
- UI Components: [Shadcn UI](https://ui.shadcn.com)
- Database: [Cloudflare D1](https://developers.cloudflare.com/d1)
- Storage: [Cloudflare R2](https://developers.cloudflare.com/r2)
- Deployment: [Cloudflare Workers](https://workers.cloudflare.com)
- Styling: [Tailwind CSS](https://tailwindcss.com)

<!-- dash-content-end -->

## Setup Steps

1. Install dependencies:

```bash
npm install
```

2. Set up your environment variables:

```bash
# Create a .dev.vars file for local development
cp .dev.vars.example .dev.vars
```

Add your API token:

```
API_TOKEN=your_token_here
```

_An API token is required to authenticate requests to the API. You should generate this before trying to run the project locally or deploying it._

3. Create a [D1 database](https://developers.cloudflare.com/d1/get-started/) with the name "event-checkin-db":

```bash
npx wrangler d1 create event-checkin-db
```

...and update the `database_id` field in `wrangler.jsonc` with the new database ID.

4. Create an [R2 bucket](https://developers.cloudflare.com/r2/get-started/) for storing photos and signatures:

```bash
npx wrangler r2 bucket create runner-images
```

5. Run the database migrations locally:

```bash
npm run db:migrate
```

Run the development server:

```bash
npm run dev
```

6. Build the application:

```bash
npm run build
```

7. Deploy to Cloudflare Workers:

```bash
npm run deploy
```

8. Set your production API token:

```bash
npx wrangler secret put API_TOKEN
```

## Usage

This project includes a complete event check-in system with the following features:

### Event Management
- Create and manage events
- View participant statistics
- Track check-in progress

### Check-in Process
1. **Search Participants** - Find participants by bib number, name, phone, or email
2. **Photo Capture** - Take a clear photo of the participant
3. **Digital Signature** - Capture participant's signature on touch devices
4. **Confirmation** - Review and complete the check-in process

### Real-time Statistics
- Total participants
- Checked-in count
- Remaining participants
- Progress percentage

### Mobile Optimized
- Touch-friendly interface
- Responsive design for tablets and phones
- Camera integration for photo capture
- Signature pad optimized for touch input

## API Endpoints

- `POST /api/auth/login` - Authenticate users
- `GET /api/events` - List all events
- `POST /api/events` - Create new event
- `GET /api/events/:id` - Get event details
- `GET /api/participants/search` - Search participants
- `GET /api/participants/:id` - Get participant details
- `POST /api/checkin` - Complete check-in process
- `GET /api/stats` - Get check-in statistics

## Database Schema

The system uses the following tables:
- `users` - Staff authentication
- `events` - Event information
- `participants` - Participant data and check-in records

## R2 Storage

Photos and signatures are stored in Cloudflare R2 with the following structure:
- `checkins/{participant_id}/photo_{timestamp}.jpg`
- `checkins/{participant_id}/signature_{timestamp}.png`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.