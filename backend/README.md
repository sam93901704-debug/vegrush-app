# Backend

Node.js backend project with TypeScript.

## Setup

**Note: Set environment variables before running any commands. Copy `.env.example` to `.env` and fill in the required values.**

### Quick Setup (Recommended)

Use the bootstrap script to set up everything automatically:

```bash
chmod +x scripts/bootstrap.sh
./scripts/bootstrap.sh
```

Or from the backend directory:
```bash
bash scripts/bootstrap.sh
```

### Manual Setup

1. **Install dependencies:**
   ```bash
   npm i
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` and fill in all required values.

3. **Generate Prisma client:**
   ```bash
   npm run prisma:generate
   ```
   Generates the Prisma Client based on your schema. Run this after schema changes.

4. **Run migrations:**
   ```bash
   npm run prisma:migrate
   ```
   Creates and applies database migrations. Use `--name <migration_name>` to name your migration.

5. **Seed the database (optional):**
   ```bash
   npm run seed
   ```
   Populates the database with initial data (products, admin user, delivery boys, sample user).

### Available NPM Scripts

- `npm run prisma:generate` - Generate Prisma Client from schema
- `npm run prisma:migrate` - Create and apply database migrations (development)
- `npm run seed` - Seed database with initial data
- `npm run dev` - Start development server with hot-reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server

## Development

Run the development server:
```bash
npm run dev
```

## Build

Build the project:
```bash
npm run build
```

## Start

Start the production server:
```bash
npm start
```

## Docker

Build and run with Docker:
```bash
docker build -t backend .
docker run -p 4000:4000 --env-file .env backend
```

## Deployment

### Railway Deployment

This project includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that automatically deploys to Railway on push to main/master branch.

#### Setup Railway Deployment:

1. **Create Railway Project:**
   - Go to [Railway](https://railway.app)
   - Create a new project
   - Connect your GitHub repository

2. **Enable Railway GitHub Integration:**
   - In Railway project settings, go to "GitHub" section
   - Connect your GitHub repository
   - Enable automatic deployments
   - Railway will automatically deploy on push to main/master branch
   
   **Note:** The GitHub Actions workflow runs tests before deployment. Railway's native GitHub integration handles the actual deployment automatically.

3. **Set Environment Variables in Railway:**
   Configure the following environment variables in your Railway project:
   
   **Required:**
   - `DATABASE_URL` - PostgreSQL connection string
   - `JWT_SECRET` - Secret key for JWT token signing (use a long random string)
   - `GOOGLE_CLIENT_ID` - Google OAuth client ID
   - `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
   - `SUPABASE_URL` - Supabase project URL
   - `SUPABASE_KEY` - Supabase service role key
   - `PORT` - Server port (default: 4000)
   - `NODE_ENV` - Set to `production`
   
   **Optional:**
   - `LOG_LEVEL` - Logging level (default: `info` in production)

4. **Database Setup:**
   - Railway will provide a PostgreSQL database
   - Use the connection string as `DATABASE_URL`
   - Run migrations: Railway will run `prisma migrate deploy` automatically, or you can run it manually

5. **Deploy:**
   - Push to `main` or `master` branch to trigger automatic deployment
   - Or use `workflow_dispatch` in GitHub Actions to deploy manually

#### Manual Railway Deployment:

If you prefer to deploy manually:
```bash
railway login
railway link
railway up
```

### Environment Variables for Production

Ensure all environment variables from `.env.example` are set in your deployment platform:

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Long random string for JWT signing
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_KEY` - Supabase service role key
- `PORT` - Server port (default: 4000)
- `NODE_ENV` - Set to `production` for production deployments

