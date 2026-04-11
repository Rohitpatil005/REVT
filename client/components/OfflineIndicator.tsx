import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { AlertCircle, Wifi } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <Alert className="fixed top-0 left-0 right-0 z-50 rounded-none border-b border-t-0 border-x-0 bg-amber-50 border-amber-200">
      <AlertCircle className="h-4 w-4 text-amber-600" />
      <AlertDescription className="text-amber-800 flex items-center gap-2">
        <Wifi className="h-4 w-4 stroke-1" />
        You are offline. Working with cached data. Changes will sync when you're back online.
      </AlertDescription>
    </Alert>
  );
}
