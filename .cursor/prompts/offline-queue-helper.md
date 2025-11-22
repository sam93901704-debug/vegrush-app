# Offline Queue Helper - Cursor Prompt

## Context
We need a simple offline queue helper for a React/Next.js delivery app. When network requests fail due to connectivity issues, we want to queue them locally and retry automatically when the network reconnects.

## Requirements

Create an offline queue system with the following features:

1. **Storage**: Use IndexedDB with localStorage fallback for persisting failed requests
2. **Queue Management**: Store failed API requests with metadata (URL, method, body, headers)
3. **Auto-Retry**: Automatically retry queued requests when network reconnects
4. **Manual Retry**: Allow manual retry via function call
5. **Retry Limits**: Limit retry attempts (e.g., max 3 retries per request)
6. **React Hook**: Provide a React hook for easy integration
7. **UI Badge**: Create a component showing pending sync count with manual retry button

## Technical Specifications

### Core Service (`utils/offlineQueue.ts`)
- Singleton pattern for queue management
- Methods:
  - `queueRequest(request)`: Add failed request to queue
  - `retryAll()`: Retry all queued requests
  - `retryRequestById(id)`: Retry specific request
  - `getPendingCount()`: Get count of pending requests
  - `getPendingRequests()`: Get all pending requests
  - `removeRequest(id)`: Remove request from queue
  - `clear()`: Clear all queued requests
  - `subscribe(callback)`: Subscribe to queue changes

### React Hook (`hooks/useOfflineQueue.ts`)
- Returns:
  - `pendingCount`: Number of pending requests
  - `pendingRequests`: Array of pending requests
  - `isRetrying`: Boolean indicating if retry is in progress
  - `isOnline`: Boolean indicating network status
  - `retryAll()`: Function to manually retry all
  - `retryRequest(id)`: Function to retry specific request

### UI Component (`components/PendingSyncBadge.tsx`)
- Shows badge with pending count
- Displays "Syncing..." when retrying
- Shows "Offline" indicator when network is down
- Manual retry button (when online and not retrying)
- Optional details dropdown showing pending requests

## Implementation Details

1. **Storage Strategy**:
   - Primary: IndexedDB for better performance and larger storage
   - Fallback: localStorage if IndexedDB not available
   - Store: Request metadata (id, url, method, body, headers, timestamp, retryCount)

2. **Network Detection**:
   - Listen to `online`/`offline` browser events
   - Use `navigator.onLine` for status check
   - Auto-trigger retry when coming online

3. **Retry Logic**:
   - Exponential backoff or fixed delay between retries
   - Remove request from queue after max retries exceeded
   - Update retry count on each attempt

4. **Integration**:
   - Wrap failed fetch calls with queue logic
   - Detect network errors (TypeError with fetch)
   - Optimistically update UI while queued

## Example Usage

```typescript
// In a component
import { offlineQueue } from '@/utils/offlineQueue';

try {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error('Request failed');
} catch (error) {
  if (isNetworkError(error)) {
    await offlineQueue.queueRequest({
      url,
      method: 'PATCH',
      body: { status: 'delivered' },
      headers: { 'Authorization': `Bearer ${token}` }
    });
  }
}
```

## Expected Output

1. `utils/offlineQueue.ts`: Core queue service
2. `hooks/useOfflineQueue.ts`: React hook
3. `components/PendingSyncBadge.tsx`: UI badge component

All files should be TypeScript, well-typed, and include error handling.

