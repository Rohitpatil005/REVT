# Offline Support Implementation

Your app now supports **offline-first functionality** with automatic caching. Here's what has been implemented:

## 🎯 What Changed

### 1. **Service Worker** (`public/sw.js`)
   - Caches assets (JS, CSS, images) for instant loads
   - Uses network-first strategy for API calls
   - Falls back to cached data when offline
   - Automatically cleans up old caches

### 2. **Offline Storage** (`client/lib/offlineStorage.ts`)
   - `setOfflineCache(key, data, ttl)` - Store data in browser localStorage
   - `getOfflineCache(key)` - Retrieve cached data
   - `clearOfflineCache(key)` - Remove specific cache
   - `cacheAuthUser()` - Automatically caches authenticated users
   - TTL (Time-to-Live) support for cache expiration

### 3. **Online Status Detection** (`client/hooks/useOnlineStatus.ts`)
   - Hook that detects when browser goes online/offline
   - Listens to `navigator.onLine` events
   - Updates UI components in real-time

### 4. **Offline Indicator** (`client/components/OfflineIndicator.tsx`)
   - Shows banner at top when offline
   - Alerts users they're working with cached data
   - Automatically disappears when back online

### 5. **API Client with Caching** (`client/lib/apiClient.ts`)
   - `apiFetch(url, options)` - Fetch with automatic caching
   - `apiGet(url)` - GET with caching
   - `apiPost(url, data)` - POST requests (no caching for mutations)

### 6. **Firebase Auth Caching**
   - User data is cached after successful login
   - Falls back to cached user if Firebase is unavailable
   - Cache is cleared on sign out

---

## 🚀 How to Use

### **For API Calls**

Replace direct `fetch()` calls with `apiFetch()`:

```typescript
import { apiGet, apiFetch } from '@/lib/apiClient';

// Simple GET with caching (24 hours)
const customers = await apiGet('/api/customers');

// With custom cache key and TTL (2 hours)
const data = await apiFetch('/api/data', {
  method: 'GET',
  cacheKey: 'my_data',
  cacheTTL: 2 * 60 * 60 * 1000, // 2 hours
});

// POST (not cached, since it's a mutation)
await apiPost('/api/invoices', { /* data */ });
```

### **For Custom Data Storage**

```typescript
import { setOfflineCache, getOfflineCache, clearOfflineCache } from '@/lib/offlineStorage';

// Store data
setOfflineCache('user_preferences', { theme: 'dark' }, 7 * 24 * 60 * 60 * 1000); // 7 days

// Retrieve data
const preferences = getOfflineCache('user_preferences');

// Clear cache
clearOfflineCache('user_preferences');
```

### **Detect Online Status in Components**

```typescript
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export function MyComponent() {
  const isOnline = useOnlineStatus();
  
  return (
    <div>
      Status: {isOnline ? '🟢 Online' : '🔴 Offline'}
    </div>
  );
}
```

---

## 📊 How It Works

### **Offline Authentication Flow**

1. **First Login (Online)**
   - User signs in with email/password
   - Firebase verifies credentials
   - User data is cached locally
   - User can access app

2. **Offline After Login**
   - Firebase can't be reached (network error)
   - Cached user data is automatically used
   - User stays logged in with cached profile
   - Offline indicator shows at top

3. **Back Online**
   - Browser detects connection
   - App syncs any pending changes
   - Everything works normally again

### **Data Caching Strategy**

| Request Type | Strategy | Behavior |
|-------------|----------|----------|
| **API Calls** | Network-first | Try network first, fallback to cache if offline |
| **Assets** | Cache-first | Load from cache, update in background |
| **Auth** | Cache + Timeout | Use cached auth if Firebase times out (5s) |

---

## ⚙️ Configuration

### **Service Worker Cache Versions**

Update `public/sw.js` if you need to force cache refresh:
```javascript
const CACHE_VERSION = 'v2'; // Increment to clear old caches
```

### **Auth Timeout**

Modify timeout in `client/hooks/FirebaseAuthProvider.tsx`:
```typescript
timeoutId = setTimeout(() => {
  // Use cached user if Firebase takes longer than 5 seconds
}, 5000) // Change this value
```

### **Cache TTL Defaults**

- **Auth User**: 7 days
- **API Data**: No expiration (until browser cache is cleared)
- **Custom**: Set via `cacheTTL` parameter

---

## 🧪 Testing Offline Mode

### **Browser DevTools**

1. Open Chrome DevTools (`F12`)
2. Go to **Application** → **Service Workers**
3. Check "Offline" checkbox
4. App should continue working with cached data

### **Testing Auth Offline**

1. **Sign in while online** (required to populate cache)
2. Open DevTools → **Application** → **Service Workers**
3. Enable **Offline** mode
4. Refresh page
5. You should still be logged in with cached user data

### **Clear Cache**

Go to **Application** → **Storage** → **Local Storage** → Delete entries starting with `app_cache_`

---

## 📝 Important Notes

- **First Login Required**: Offline mode only works after logging in once. The app caches user data after first login.
- **Data Syncing**: Mutations (POST, PUT, DELETE) don't cache. They fail offline but queue when back online (with React Query).
- **Service Worker**: Takes effect after first page load. Refresh after installing.
- **Cache Clearing**: Users can clear cache from browser settings, which removes offline access until they go online and visit again.

---

## 🔧 Troubleshooting

**Q: I'm offline but still can't see my data?**
- A: You need to login while online first. The app caches data after successful login.

**Q: Service worker not working?**
- A: Check `public/sw.js` exists and Firefox/Chrome allows it. Use DevTools → Application tab.

**Q: Cache is outdated?**
- A: Browser cache persists. Go online and refresh to update. Or clear LocalStorage in DevTools.

**Q: How do I see what's cached?**
- A: DevTools → Application → Local Storage → Look for `app_cache_*` keys

---

## 📚 References

- **Service Worker API**: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
- **navigator.onLine**: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/onLine
- **Cache API**: https://developer.mozilla.org/en-US/docs/Web/API/Cache
