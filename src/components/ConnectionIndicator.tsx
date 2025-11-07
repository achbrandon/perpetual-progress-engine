import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConnectionIndicatorProps {
  status: 'connected' | 'connecting' | 'disconnected';
  onReconnect?: () => void;
  showReconnectButton?: boolean;
  lastConnected?: Date | null;
  className?: string;
}

export function ConnectionIndicator({
  status,
  onReconnect,
  showReconnectButton = true,
  lastConnected,
  className
}: ConnectionIndicatorProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          icon: Wifi,
          label: 'Connected',
          variant: 'default' as const,
          className: 'bg-green-600 hover:bg-green-700 text-white',
          iconClassName: 'animate-pulse'
        };
      case 'connecting':
        return {
          icon: RefreshCw,
          label: 'Connecting...',
          variant: 'secondary' as const,
          className: 'bg-yellow-600 hover:bg-yellow-700 text-white',
          iconClassName: 'animate-spin'
        };
      case 'disconnected':
        return {
          icon: WifiOff,
          label: 'Disconnected',
          variant: 'destructive' as const,
          className: 'bg-red-600 hover:bg-red-700 text-white',
          iconClassName: ''
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  const formatLastConnected = () => {
    if (!lastConnected) return null;
    
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastConnected.getTime()) / 1000);
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return lastConnected.toLocaleTimeString();
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Badge variant={config.variant} className={cn("flex items-center gap-1.5 px-2 py-1", config.className)}>
        <Icon className={cn("h-3 w-3", config.iconClassName)} />
        <span className="text-xs font-medium">{config.label}</span>
      </Badge>
      
      {status === 'disconnected' && showReconnectButton && onReconnect && (
        <Button
          variant="outline"
          size="sm"
          onClick={onReconnect}
          className="h-7 px-2 text-xs"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Reconnect
        </Button>
      )}
      
      {lastConnected && status === 'connected' && (
        <span className="text-xs text-muted-foreground">
          {formatLastConnected()}
        </span>
      )}
    </div>
  );
}
