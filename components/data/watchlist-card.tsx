import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Bell, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { WatchlistItem } from '@/types/api';

interface WatchlistCardProps {
  item: WatchlistItem;
  onRemove: (id: string) => void;
  onToggleNotifications: (id: string, value: boolean) => void;
}

export function WatchlistCard({
  item,
  onRemove,
  onToggleNotifications,
}: WatchlistCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">
            <Link href={`/product/${item.product.id}`} className="hover:text-primary">
              {item.product.name}
            </Link>
          </h3>
          <p className="text-sm text-muted-foreground">
            HTS: {item.product.hts_code}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemove(item.id)}
          className="text-destructive hover:text-destructive/80"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Notifications</span>
        </div>
        <Switch
          checked={item.notify_changes}
          onCheckedChange={(checked) => onToggleNotifications(item.id, checked)}
        />
      </div>
    </Card>
  );
}