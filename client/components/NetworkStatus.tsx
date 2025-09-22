import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Wifi, WifiOff } from "lucide-react";

interface NetworkStatusProps {
  onRetry?: () => void;
}

export function NetworkStatus({ onRetry }: NetworkStatusProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Listen for fetch errors globally
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        if (!response.ok && response.status >= 500) {
          setHasError(true);
        }
        return response;
      } catch (error) {
        setHasError(true);
        throw error;
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  if (!isOnline) {
    return (
      <Alert className="border-destructive/50 text-destructive-foreground">
        <WifiOff className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>Pas de connexion internet</span>
        </AlertDescription>
      </Alert>
    );
  }

  if (hasError) {
    return (
      <Alert className="border-warning/50 text-warning-foreground">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>Problème de connexion au serveur</span>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setHasError(false)}
            >
              Ignorer
            </Button>
            {onRetry && (
              <Button 
                size="sm" 
                onClick={() => {
                  setHasError(false);
                  onRetry();
                }}
              >
                Réessayer
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
