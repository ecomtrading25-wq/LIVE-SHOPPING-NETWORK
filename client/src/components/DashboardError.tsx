import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

/**
 * Error boundary component for AI dashboards
 * Provides user-friendly error messages with retry functionality
 */

interface DashboardErrorProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function DashboardError({
  title = 'Failed to Load Dashboard',
  message = 'An error occurred while loading the dashboard data. Please try again.',
  onRetry
}: DashboardErrorProps) {
  return (
    <div className="min-h-screen bg-background p-6 flex items-center justify-center text-foreground">
      <Card className="p-8 max-w-md w-full text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold mb-2">{title}</h2>
        <p className="text-muted-foreground mb-6">{message}</p>
        {onRetry && (
          <Button onClick={onRetry} className="w-full">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        )}
      </Card>
    </div>
  );
}

export function DashboardErrorInline({
  message = 'Failed to load data',
  onRetry
}: Omit<DashboardErrorProps, 'title'>) {
  return (
    <Card className="p-6 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
      <div className="flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-red-900 dark:text-red-100">{message}</p>
        </div>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Retry
          </Button>
        )}
      </div>
    </Card>
  );
}
