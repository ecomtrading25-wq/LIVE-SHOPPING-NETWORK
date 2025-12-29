import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import {
  Upload,
  FileSpreadsheet,
  Package,
  Users,
  Warehouse,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
} from "lucide-react";
import { toast } from "sonner";

/**
 * Bulk Import Tools Page
 * CSV/Excel import for products, inventory, customers
 */

type ImportType = "products" | "inventory" | "customers" | "orders";

interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
}

export default function BulkImportPage() {
  const [selectedType, setSelectedType] = useState<ImportType>("products");
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const importMutation = trpc.admin.bulkImport.useMutation({
    onSuccess: (data) => {
      setResult(data);
      setImporting(false);
      if (data.failed === 0) {
        toast.success(`Successfully imported ${data.success} records!`);
      } else {
        toast.warning(
          `Imported ${data.success} records, ${data.failed} failed`
        );
      }
    },
    onError: (error) => {
      setImporting(false);
      toast.error(`Import failed: ${error.message}`);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const validTypes = [
        "text/csv",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ];
      if (!validTypes.includes(selectedFile.type)) {
        toast.error("Please upload a CSV or Excel file");
        return;
      }
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error("Please select a file first");
      return;
    }

    setImporting(true);

    // Read file content
    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      
      // Parse CSV (simple implementation, production would use a library like Papa Parse)
      const lines = content.split("\n");
      const headers = lines[0].split(",").map(h => h.trim());
      const rows = lines.slice(1).map(line => {
        const values = line.split(",").map(v => v.trim());
        return headers.reduce((obj, header, index) => {
          obj[header] = values[index];
          return obj;
        }, {} as Record<string, string>);
      });

      // Call import mutation
      importMutation.mutate({
        type: selectedType,
        data: rows,
      });
    };

    reader.readAsText(file);
  };

  const handleDownloadTemplate = (type: ImportType) => {
    const templates = {
      products: "SKU,Name,Description,Price,Compare At Price,Category,Status\nPROD001,Sample Product,Product description,29.99,39.99,Electronics,active",
      inventory: "SKU,Warehouse,Quantity,Reserved,Location\nPROD001,Main Warehouse,100,0,A1-B2",
      customers: "Email,First Name,Last Name,Phone,Address,City,State,Zip\njohn@example.com,John,Doe,555-0123,123 Main St,New York,NY,10001",
      orders: "Order Number,Customer Email,Product SKU,Quantity,Price,Status\nORD001,john@example.com,PROD001,2,29.99,pending",
    };

    const content = templates[type];
    const blob = new Blob([content], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${type}_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Template downloaded!");
  };

  const importTypes = [
    {
      id: "products" as ImportType,
      name: "Products",
      icon: Package,
      description: "Import product catalog with SKUs, prices, and descriptions",
      fields: ["SKU", "Name", "Description", "Price", "Category", "Status"],
    },
    {
      id: "inventory" as ImportType,
      name: "Inventory",
      icon: Warehouse,
      description: "Update stock levels across multiple warehouses",
      fields: ["SKU", "Warehouse", "Quantity", "Reserved", "Location"],
    },
    {
      id: "customers" as ImportType,
      name: "Customers",
      icon: Users,
      description: "Import customer data and contact information",
      fields: ["Email", "First Name", "Last Name", "Phone", "Address"],
    },
    {
      id: "orders" as ImportType,
      name: "Orders",
      icon: FileSpreadsheet,
      description: "Bulk import historical orders",
      fields: ["Order Number", "Customer Email", "Product SKU", "Quantity"],
    },
  ];

  const selectedImportType = importTypes.find((t) => t.id === selectedType);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Bulk Import Tools</h1>
        <p className="text-gray-400">
          Import large datasets via CSV or Excel files
        </p>
      </div>

      {/* Import Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {importTypes.map((type) => (
          <Card
            key={type.id}
            className={`p-6 cursor-pointer transition-all ${
              selectedType === type.id
                ? "bg-purple-600 border-purple-500"
                : "bg-background text-foreground/50 border-border hover:border-purple-500"
            }`}
            onClick={() => setSelectedType(type.id)}
          >
            <type.icon
              className={`w-8 h-8 mb-3 ${
                selectedType === type.id ? "text-foreground" : "text-purple-400"
              }`}
            />
            <h3
              className={`font-semibold mb-2 ${
                selectedType === type.id ? "text-foreground" : "text-foreground"
              }`}
            >
              {type.name}
            </h3>
            <p
              className={`text-sm ${
                selectedType === type.id ? "text-white/80" : "text-gray-400"
              }`}
            >
              {type.description}
            </p>
          </Card>
        ))}
      </div>

      {/* Import Section */}
      {selectedImportType && (
        <Card className="p-8 bg-background/50 border-border text-foreground">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Import {selectedImportType.name}
            </h2>
            <p className="text-gray-400">{selectedImportType.description}</p>
          </div>

          {/* Required Fields */}
          <div className="mb-6">
            <h3 className="font-semibold text-foreground mb-3">Required Fields:</h3>
            <div className="flex flex-wrap gap-2">
              {selectedImportType.fields.map((field) => (
                <Badge key={field} className="bg-purple-600">
                  {field}
                </Badge>
              ))}
            </div>
          </div>

          {/* Template Download */}
          <div className="mb-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-blue-300 font-medium mb-2">
                  First time importing? Download our template
                </p>
                <p className="text-blue-200/80 text-sm mb-3">
                  Use our CSV template to ensure your data is formatted correctly
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadTemplate(selectedType)}
                  className="border-blue-500 text-blue-300 hover:bg-blue-500/20"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </Button>
              </div>
            </div>
          </div>

          {/* File Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-muted-foreground mb-3">
              Upload CSV or Excel File
            </label>
            <div className="border-2 border-dashed border-zinc-700 rounded-lg p-8 text-center hover:border-purple-500 transition-colors">
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <Upload className="w-12 h-12 text-gray-400 mb-3" />
                {file ? (
                  <>
                    <p className="text-foreground font-medium mb-1">{file.name}</p>
                    <p className="text-sm text-gray-400">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-foreground font-medium mb-1">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-sm text-gray-400">CSV or Excel files only</p>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* Import Button */}
          <Button
            onClick={handleImport}
            disabled={!file || importing}
            className="w-full bg-purple-600 hover:bg-purple-700 h-12 text-lg"
          >
            {importing ? (
              <>Processing...</>
            ) : (
              <>
                <Upload className="w-5 h-5 mr-2" />
                Import {selectedImportType.name}
              </>
            )}
          </Button>
        </Card>
      )}

      {/* Import Results */}
      {result && (
        <Card className="p-8 bg-background/50 border-border text-foreground">
          <h2 className="text-2xl font-bold text-foreground mb-6">Import Results</h2>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="flex items-center gap-4 p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
              <CheckCircle className="w-8 h-8 text-green-400" />
              <div>
                <p className="text-sm text-green-300">Successfully Imported</p>
                <p className="text-3xl font-bold text-foreground">{result.success}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
              <XCircle className="w-8 h-8 text-red-400" />
              <div>
                <p className="text-sm text-red-300">Failed</p>
                <p className="text-3xl font-bold text-foreground">{result.failed}</p>
              </div>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div>
              <h3 className="font-semibold text-foreground mb-3">Errors:</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {result.errors.map((error, index) => (
                  <div
                    key={index}
                    className="p-3 bg-red-900/20 border border-red-500/30 rounded text-sm"
                  >
                    <span className="text-red-300 font-medium">
                      Row {error.row}:
                    </span>{" "}
                    <span className="text-red-200">{error.error}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
