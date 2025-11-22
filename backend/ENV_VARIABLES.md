# Environment Variables Documentation

This document lists all environment variables required for the backend application.

## Required Variables

### Database Configuration
```env
DATABASE_URL="postgresql://<user>:<password>@<host>:<port>/<database>?schema=public"
```
- **Required**: Yes
- **Description**: PostgreSQL database connection string
- **Example**: `postgresql://postgres:password@localhost:5432/mydb?schema=public`

### JWT Configuration
```env
JWT_SECRET="your-secret-jwt-key-change-in-production"
```
- **Required**: Yes
- **Description**: Secret key for signing JWT tokens
- **Note**: Must be changed from default value in production
- **Security**: Use a strong, random string (at least 32 characters)

### Google OAuth Configuration
```env
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
```
- **Required**: Yes
- **Description**: Google OAuth2 client ID for user authentication
- **How to get**: [Google Cloud Console](https://console.cloud.google.com/)

## Optional Variables

### Server Configuration
```env
PORT=4000
NODE_ENV="development"
```
- **Required**: No
- **Default**: `PORT=4000`, `NODE_ENV=development`
- **Description**: Server port and environment mode

### Supabase Storage Configuration
```env
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_KEY="your-supabase-anon-key"
```
- **Required**: No (only if using image uploads)
- **Description**: Supabase project URL and anonymous key for storage
- **Used for**: Product image uploads

### FCM Push Notification Configuration
```env
FCM_SERVER_KEY="your-fcm-server-key-from-firebase-console"
```
- **Required**: No (recommended for production)
- **Description**: Firebase Cloud Messaging server key for push notifications
- **How to get**: [Firebase Console](https://console.firebase.google.com/) → Project Settings → Cloud Messaging
- **Used for**: Sending push notifications to users and delivery boys
- **Fallback**: If not configured, SMS notifications will be attempted

### MSG91 SMS Configuration
```env
MSG91_AUTH_KEY="your-msg91-auth-key"
MSG91_SENDER_ID="ORDERS"
SMS_ENABLED="false"
```
- **Required**: No
- **Description**: MSG91 API credentials for SMS notifications
- **MSG91_AUTH_KEY**: Your MSG91 API authentication key
- **MSG91_SENDER_ID**: Sender ID shown on SMS (default: "ORDERS")
- **SMS_ENABLED**: Set to `"true"` or `"1"` to enable SMS notifications
- **Note**: `MSG91_AUTH_KEY` can also be referenced as `MSG91_API_KEY` in some contexts
- **Used for**: SMS fallback when FCM push notifications fail or FCM is not configured

### Webhook Configuration
```env
WEBHOOK_URL="https://your-webhook-endpoint.com/webhooks"
WEBHOOK_SECRET="your-webhook-secret-key-for-signature-verification"
WEBHOOK_ENABLED="false"
WEBHOOK_TIMEOUT_MS="5000"
```
- **Required**: No
- **Description**: Configuration for sending webhooks to external systems
- **WEBHOOK_URL**: Endpoint URL where webhooks will be sent
- **WEBHOOK_SECRET**: Secret key for HMAC-SHA256 signature verification
- **WEBHOOK_ENABLED**: Set to `"true"` or `"1"` to enable webhooks
- **WEBHOOK_TIMEOUT_MS**: Request timeout in milliseconds (default: 5000)
- **Used for**: Order assignment and status change notifications to external systems

### Delivery Assignment Configuration
```env
DELIVERY_AUTO_ASSIGN="false"
ASSIGNMENT_STRATEGY="manual"
```
- **Required**: No
- **Description**: Controls automatic assignment behavior
- **DELIVERY_AUTO_ASSIGN**: 
  - `"true"` or `"1"`: Enable automatic assignment when orders are created
  - `"false"`: Require manual assignment by admin (default)
- **ASSIGNMENT_STRATEGY**: 
  - `"manual"`: Admin must manually assign orders (default)
  - `"round_robin"`: Automatically assign to delivery boys in round-robin fashion
  - `"nearest"`: Automatically assign to nearest delivery boy (requires location data - not yet implemented)

### Frontend URL
```env
FRONTEND_URL="http://localhost:3000"
```
- **Required**: No
- **Description**: Frontend application URL
- **Used for**: Generating tracking links in notifications

## Creating .env File

1. Copy the example file:
   ```bash
   cp backend/.env.example backend/.env
   ```

2. Fill in all required variables:
   ```bash
   # Edit with your favorite editor
   nano backend/.env
   # or
   code backend/.env
   ```

3. For production, ensure all secrets are strong and unique:
   - Use a secure password generator for `JWT_SECRET`
   - Never commit `.env` file to version control
   - Use environment-specific values for different environments

## Environment-Specific Examples

### Development
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/myapp_dev"
JWT_SECRET="dev-secret-key-change-in-production"
GOOGLE_CLIENT_ID="dev-client-id.apps.googleusercontent.com"
FCM_SERVER_KEY=""
SMS_ENABLED="false"
WEBHOOK_ENABLED="false"
DELIVERY_AUTO_ASSIGN="false"
```

### Production
```env
DATABASE_URL="postgresql://user:password@prod-db.example.com:5432/myapp_prod"
JWT_SECRET="<strong-random-secret-32-chars-min>"
GOOGLE_CLIENT_ID="prod-client-id.apps.googleusercontent.com"
FCM_SERVER_KEY="<prod-fcm-server-key>"
SMS_ENABLED="true"
WEBHOOK_ENABLED="true"
WEBHOOK_SECRET="<strong-webhook-secret>"
DELIVERY_AUTO_ASSIGN="true"
ASSIGNMENT_STRATEGY="round_robin"
```

## Validation

The application will validate required environment variables on startup:
- Missing required variables will cause the server to fail to start
- Optional variables will use defaults or disable features
- Warnings will be logged for missing optional variables that affect functionality

## Security Notes

1. **Never commit `.env` files** to version control
2. **Use different secrets** for each environment (dev, staging, production)
3. **Rotate secrets regularly** in production
4. **Use secure key management** services in production (AWS Secrets Manager, HashiCorp Vault, etc.)
5. **Restrict access** to environment variables to authorized personnel only

