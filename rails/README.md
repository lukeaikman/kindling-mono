# Kindling API

Rails 8.1.0 API backend for the Kindling estate planning application.

## Tech Stack

- **Ruby**: 3.4.7 (managed via mise)
- **Rails**: 8.1.0
- **Database**: PostgreSQL 14
- **Authentication**: Rails 8 native authentication
- **Admin UI**: Bootstrap 5 + Motor Admin

## Setup

### Prerequisites

- PostgreSQL 14 running (`brew services start postgresql@14`)
- mise installed (`brew install mise`)

### Installation

```bash
# Navigate to project directory
cd kindling-api

# Install Ruby (mise will use .mise.toml)
eval "$(mise activate zsh)"
mise install

# Install dependencies
bundle install

# Create and migrate database
rails db:create db:migrate

# Seed default admin user
rails db:seed

# Start server
rails server -p 3001
```

## Admin Interface

### Login

**URL**: http://localhost:3001

**Default Credentials**:
- Email: `admin@kindling.local`
- Password: `password123`

### Features

- **Dashboard**: Main landing page with quick stats
- **DB Viewer**: Motor Admin interface for database exploration (at `/motor_admin`)
- **Settings**: Update your profile (name, email, password)
- **About**: Application information

### Navigation

- Top menu: Dashboard | DB Viewer | About
- Avatar dropdown (top right): Settings | Log out

## API Endpoints

API endpoints will be available at `/api/v1/` (coming soon).

Currently configured CORS origins:
- `localhost:5173` (web-prototype Vite dev server)
- `localhost:3000`
- `localhost:8081` (React Native Expo)

## Database

PostgreSQL with the following tables:
- `users` - Admin users with authentication
- `sessions` - User sessions
- `motor_*` - Motor Admin tables for database viewer

## Development

### Running the Server

```bash
# Default port 3000
rails server

# Custom port (recommended if 3000 is in use)
rails server -p 3001
```

### Console

```bash
rails console
```

### Database Operations

```bash
# Reset database
rails db:reset

# Run migrations
rails db:migrate

# Rollback last migration
rails db:rollback
```

## Project Structure

```
kindling-api/
├── app/
│   ├── controllers/
│   │   ├── admin/          # Admin UI controllers
│   │   │   ├── dashboard_controller.rb
│   │   │   ├── settings_controller.rb
│   │   │   └── about_controller.rb
│   │   ├── api/v1/         # API controllers (future)
│   │   └── sessions_controller.rb
│   ├── models/
│   │   ├── user.rb
│   │   ├── session.rb
│   │   └── current.rb
│   └── views/
│       ├── admin/          # Admin UI views
│       ├── sessions/
│       └── layouts/
├── config/
│   ├── routes.rb
│   └── initializers/
│       └── cors.rb         # CORS configuration
└── db/
    ├── migrate/
    └── seeds.rb
```

## Configuration

### Environment Variables

Create a `.env` file for local configuration:

```
DATABASE_HOST=localhost
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=
RAILS_ENV=development
```

### CORS

CORS is pre-configured in `config/initializers/cors.rb` for:
- Web prototype (localhost:5173)
- Native app (localhost:8081)

## Security

- Password hashing via bcrypt
- Session-based authentication
- CSRF protection enabled
- Secure password reset flow
- User data scoped to authenticated user

## Next Steps

**⏸️ PAUSED**: Waiting for web-prototype data model finalization before implementing:

- Person model (executors, beneficiaries, guardians)
- Will model (will data, guardianship)
- Asset models (property, investments, pensions, etc.)
- Trust model
- Relationship model (kinship graph)
- BeneficiaryGroup model
- EstateRemainder model
- API controllers with user scoping
- JSON serializers

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 PID

# Or run on different port
rails server -p 3001
```

### Database Connection Issues

```bash
# Check PostgreSQL status
brew services list

# Start PostgreSQL
brew services start postgresql@14

# Create database if missing
rails db:create
```

### Ruby Version Issues

```bash
# Ensure mise is activated
eval "$(mise activate zsh)"

# Verify Ruby version
ruby -v
# Should show: ruby 3.4.7

# Reinstall if needed
mise install ruby@3.4.7
```

## License

Proprietary - Kindling Estate Planning Application
