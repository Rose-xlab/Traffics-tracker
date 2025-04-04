import { Card } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { formatDate } from '@/lib/utils/date-formatter';
import type { TradeUpdate } from '@/types/api';

interface UpdateCardProps {
  update: TradeUpdate;
}

export function UpdateCard({ update }: UpdateCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <h2 className="text-xl font-semibold">{update.title}</h2>
        <span className="text-sm text-muted-foreground flex items-center gap-1">
          <Calendar className="h-4 w-4" />
          {formatDate(update.published_date)}
        </span>
      </div>
      <p className="text-muted-foreground mb-4">{update.description}</p>
      <div className="flex items-center justify-between">
        <span className={`text-sm px-3 py-1 rounded-full ${
          update.impact === 'high' 
            ? 'bg-destructive/10 text-destructive' 
            : update.impact === 'medium'
            ? 'bg-warning/10 text-warning'
            : 'bg-success/10 text-success'
        }`}>
          {update.impact.charAt(0).toUpperCase() + update.impact.slice(1)} Impact
        </span>
        {update.source_url && (
          <a
            href={update.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline"
          >
            View Source
          </a>
        )}
      </div>
    </Card>
  );
}