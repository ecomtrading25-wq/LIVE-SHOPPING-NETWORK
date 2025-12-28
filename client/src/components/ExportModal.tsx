import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, FileText, FileSpreadsheet, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { exportToCSV, exportToPDF, ExportColumn } from '@/lib/exportUtils';

export interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  data: any[];
  columns?: ExportColumn[];
  defaultFormat?: 'csv' | 'pdf';
  onExport?: (format: 'csv' | 'pdf', dateRange?: { from: Date; to: Date }) => void;
}

export function ExportModal({
  open,
  onOpenChange,
  title,
  data,
  columns,
  defaultFormat = 'csv',
  onExport
}: ExportModalProps) {
  const [format, setFormat] = useState<'csv' | 'pdf'>(defaultFormat);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeMetrics, setIncludeMetrics] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);

    try {
      if (onExport && dateRange.from && dateRange.to) {
        // Custom export handler with date range
        await onExport(format, { from: dateRange.from, to: dateRange.to });
      } else {
        // Default export
        const filename = `${title.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
        
        if (format === 'csv') {
          exportToCSV({
            filename,
            format: 'csv',
            data,
            columns,
            title
          });
        } else {
          await exportToPDF({
            filename,
            format: 'pdf',
            data,
            columns,
            title,
            subtitle: `Generated on ${new Date().toLocaleString()}`
          });
        }
      }

      // Close modal after successful export
      setTimeout(() => {
        onOpenChange(false);
        setIsExporting(false);
      }, 500);
    } catch (error) {
      console.error('[Export] Failed:', error);
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Export {title}</DialogTitle>
          <DialogDescription>
            Choose export format and options for your data
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label>Export Format</Label>
            <RadioGroup value={format} onValueChange={(value) => setFormat(value as 'csv' | 'pdf')}>
              <div className="flex items-center space-x-2 rounded-lg border p-4 cursor-pointer hover:bg-accent">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="w-5 h-5 text-green-600" />
                    <div>
                      <div className="font-medium">CSV (Spreadsheet)</div>
                      <div className="text-sm text-muted-foreground">
                        Best for data analysis in Excel or Google Sheets
                      </div>
                    </div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 rounded-lg border p-4 cursor-pointer hover:bg-accent">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label htmlFor="pdf" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-red-600" />
                    <div>
                      <div className="font-medium">PDF (Document)</div>
                      <div className="text-sm text-muted-foreground">
                        Best for reports and presentations
                      </div>
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Date Range */}
          <div className="space-y-3">
            <Label>Date Range (Optional)</Label>
            <div className="grid grid-cols-2 gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !dateRange.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? format(dateRange.from, "MMM dd, yyyy") : "From date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateRange.from}
                    onSelect={(date) => setDateRange(prev => ({ ...prev, from: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !dateRange.to && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.to ? format(dateRange.to, "MMM dd, yyyy") : "To date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateRange.to}
                    onSelect={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                    initialFocus
                    disabled={(date) => dateRange.from ? date < dateRange.from : false}
                  />
                </PopoverContent>
              </Popover>
            </div>
            {dateRange.from && dateRange.to && (
              <p className="text-sm text-muted-foreground">
                Exporting data from {format(dateRange.from, "MMM dd")} to {format(dateRange.to, "MMM dd, yyyy")}
              </p>
            )}
          </div>

          {/* Export Options */}
          {format === 'pdf' && (
            <div className="space-y-3">
              <Label>Include in Export</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="charts"
                    checked={includeCharts}
                    onCheckedChange={(checked) => setIncludeCharts(checked as boolean)}
                  />
                  <Label
                    htmlFor="charts"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Include charts and visualizations
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="metrics"
                    checked={includeMetrics}
                    onCheckedChange={(checked) => setIncludeMetrics(checked as boolean)}
                  />
                  <Label
                    htmlFor="metrics"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Include key metrics summary
                  </Label>
                </div>
              </div>
            </div>
          )}

          {/* Data Preview */}
          <div className="space-y-2">
            <Label>Data Preview</Label>
            <div className="rounded-lg border p-3 bg-muted/50">
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Records:</span>
                  <span className="font-medium">{data.length.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Format:</span>
                  <span className="font-medium uppercase">{format}</span>
                </div>
                {columns && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Columns:</span>
                    <span className="font-medium">{columns.length}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isExporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting || data.length === 0}>
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export {format.toUpperCase()}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
