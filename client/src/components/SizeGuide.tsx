import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Ruler, TrendingUp, Users } from "lucide-react";

interface SizeGuideProps {
  isOpen: boolean;
  onClose: () => void;
  productCategory?: string;
}

export function SizeGuide({ isOpen, onClose, productCategory = "clothing" }: SizeGuideProps) {
  const [selectedUnit, setSelectedUnit] = useState<"in" | "cm">("in");

  if (!isOpen) return null;

  const sizeCharts = {
    clothing: {
      headers: ["Size", "Chest", "Waist", "Hips", "Length"],
      rows: [
        { size: "XS", chest: "32-34", waist: "24-26", hips: "34-36", length: "27" },
        { size: "S", chest: "34-36", waist: "26-28", hips: "36-38", length: "28" },
        { size: "M", chest: "36-38", waist: "28-30", hips: "38-40", length: "29" },
        { size: "L", chest: "38-40", waist: "30-32", hips: "40-42", length: "30" },
        { size: "XL", chest: "40-42", waist: "32-34", hips: "42-44", length: "31" },
        { size: "XXL", chest: "42-44", waist: "34-36", hips: "44-46", length: "32" },
      ],
    },
  };

  const fitRecommendations = [
    { size: "S", percentage: 15, label: "Runs small" },
    { size: "M", percentage: 70, label: "True to size" },
    { size: "L", percentage: 15, label: "Runs large" },
  ];

  const chart = sizeCharts[productCategory as keyof typeof sizeCharts] || sizeCharts.clothing;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto bg-gradient-to-br from-purple-900/95 via-black/95 to-pink-900/95 backdrop-blur-xl border-white/20">
        <div className="sticky top-0 bg-gradient-to-r from-purple-900 to-pink-900 p-6 border-b border-white/20 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Ruler className="w-6 h-6 text-purple-400" />
            Size Guide
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-8">
          {/* Unit Toggle */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Measurements</h3>
            <div className="flex gap-2">
              <Button
                variant={selectedUnit === "in" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedUnit("in")}
                className={
                  selectedUnit === "in"
                    ? "bg-gradient-to-r from-pink-500 to-purple-600"
                    : "border-white/20 text-white hover:bg-white/10"
                }
              >
                Inches
              </Button>
              <Button
                variant={selectedUnit === "cm" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedUnit("cm")}
                className={
                  selectedUnit === "cm"
                    ? "bg-gradient-to-r from-pink-500 to-purple-600"
                    : "border-white/20 text-white hover:bg-white/10"
                }
              >
                Centimeters
              </Button>
            </div>
          </div>

          {/* Size Chart Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/20">
                  {chart.headers.map((header) => (
                    <th
                      key={header}
                      className="text-left py-3 px-4 text-white font-semibold"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {chart.rows.map((row, index) => (
                  <tr
                    key={index}
                    className="border-b border-white/10 hover:bg-white/5 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <Badge className="bg-purple-600">{row.size}</Badge>
                    </td>
                    <td className="py-3 px-4 text-gray-300">
                      {row.chest} {selectedUnit}
                    </td>
                    <td className="py-3 px-4 text-gray-300">
                      {row.waist} {selectedUnit}
                    </td>
                    <td className="py-3 px-4 text-gray-300">
                      {row.hips} {selectedUnit}
                    </td>
                    <td className="py-3 px-4 text-gray-300">
                      {row.length} {selectedUnit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Fit Recommendations */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              Fit Recommendations
            </h3>
            <Card className="p-4 bg-white/5 border-white/10">
              <p className="text-gray-300 mb-4 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Based on 1,234 customer reviews
              </p>
              <div className="space-y-3">
                {fitRecommendations.map((rec) => (
                  <div key={rec.size}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white font-semibold">{rec.label}</span>
                      <span className="text-gray-400 text-sm">{rec.percentage}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-pink-500 to-purple-600 h-2 rounded-full transition-all"
                        style={{ width: `${rec.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* How to Measure */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">How to Measure</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4 bg-white/5 border-white/10">
                <h4 className="text-white font-semibold mb-2">Chest</h4>
                <p className="text-gray-300 text-sm">
                  Measure around the fullest part of your chest, keeping the tape horizontal.
                </p>
              </Card>
              <Card className="p-4 bg-white/5 border-white/10">
                <h4 className="text-white font-semibold mb-2">Waist</h4>
                <p className="text-gray-300 text-sm">
                  Measure around your natural waistline, keeping the tape comfortably loose.
                </p>
              </Card>
              <Card className="p-4 bg-white/5 border-white/10">
                <h4 className="text-white font-semibold mb-2">Hips</h4>
                <p className="text-gray-300 text-sm">
                  Measure around the fullest part of your hips, keeping the tape horizontal.
                </p>
              </Card>
              <Card className="p-4 bg-white/5 border-white/10">
                <h4 className="text-white font-semibold mb-2">Length</h4>
                <p className="text-gray-300 text-sm">
                  Measure from the highest point of your shoulder to the desired length.
                </p>
              </Card>
            </div>
          </div>

          {/* Tips */}
          <Card className="p-4 bg-purple-600/20 border-purple-500/30">
            <h4 className="text-white font-semibold mb-2">💡 Pro Tips</h4>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li>• Measure over your undergarments for the most accurate fit</li>
              <li>• If you're between sizes, we recommend sizing up for comfort</li>
              <li>• Check the product description for specific fit notes</li>
              <li>• Still unsure? Contact our customer service for personalized help</li>
            </ul>
          </Card>
        </div>
      </Card>
    </div>
  );
}
