import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ComparisonModeProps {
  currentValue: number;
  previousValue: number;
  label: string;
  format?: 'number' | 'currency' | 'percentage';
}

export function ComparisonIndicator({ currentValue, previousValue, label, format = 'number' }: ComparisonModeProps) {
  const change = currentValue - previousValue;
  const percentChange = previousValue !== 0 ? (change / previousValue) * 100 : 0;
  const isPositive = change > 0;
  const isNegative = change < 0;

  const formatValue = (value: number) => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(value);
      case 'percentage':
        return `${value.toFixed(1)}%`;
      default:
        return value.toLocaleString();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">{label}:</span>
      <span className="font-semibold">{formatValue(currentValue)}</span>
      {change !== 0 && (
        <Badge
          variant={isPositive ? 'default' : isNegative ? 'destructive' : 'secondary'}
          className="flex items-center gap-1"
        >
          {isPositive && <TrendingUp className="w-3 h-3" />}
          {isNegative && <TrendingDown className="w-3 h-3" />}
          {!isPositive && !isNegative && <Minus className="w-3 h-3" />}
          {Math.abs(percentChange).toFixed(1)}%
        </Badge>
      )}
    </div>
  );
}

interface ComparisonPanelProps {
  enabled: boolean;
  onToggle: () => void;
  period: 'day' | 'week' | 'month' | 'quarter';
  onPeriodChange: (period: 'day' | 'week' | 'month' | 'quarter') => void;
}

export function ComparisonPanel({ enabled, onToggle, period, onPeriodChange }: ComparisonPanelProps) {
  return (
    <Card className="p-4 bg-muted/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant={enabled ? 'default' : 'outline'}
            size="sm"
            onClick={onToggle}
          >
            {enabled ? 'Disable' : 'Enable'} Comparison
          </Button>
          {enabled && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Compare to previous:</span>
              <Select value={period} onValueChange={(v: any) => onPeriodChange(v)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                  <SelectItem value="quarter">Quarter</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        {enabled && (
          <Badge variant="secondary">
            Comparing to previous {period}
          </Badge>
        )}
      </div>
    </Card>
  );
}
