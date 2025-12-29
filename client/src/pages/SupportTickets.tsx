import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Ticket,
  MessageCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  Upload,
} from "lucide-react";

export default function SupportTicketsPage() {
  const [showNewTicket, setShowNewTicket] = useState(false);

  const tickets = [
    {
      id: "TICK-001",
      subject: "Order not received",
      category: "Order Issues",
      status: "open",
      priority: "high",
      createdAt: "2025-12-27T10:00:00Z",
      lastUpdate: "2025-12-27T14:30:00Z",
      messages: 3,
    },
    {
      id: "TICK-002",
      subject: "Product question",
      category: "Product Questions",
      status: "resolved",
      priority: "low",
      createdAt: "2025-12-25T09:00:00Z",
      lastUpdate: "2025-12-26T11:00:00Z",
      messages: 5,
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b bg-card text-card-foreground">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Support Tickets</h1>
              <p className="text-muted-foreground">
                Get help from our support team
              </p>
            </div>
            <Button onClick={() => setShowNewTicket(!showNewTicket)} size="lg">
              <Ticket className="w-5 h-5 mr-2" />
              New Ticket
            </Button>
          </div>
        </div>
      </div>

      <div className="container py-8">
        {showNewTicket && (
          <Card className="p-6 mb-6">
            <h2 className="text-2xl font-bold mb-6">Create Support Ticket</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Subject *</label>
                <Input placeholder="Brief description of your issue" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description *</label>
                <Textarea placeholder="Provide details..." rows={6} />
              </div>
              <Button>Submit Ticket</Button>
            </div>
          </Card>
        )}

        <div className="space-y-4">
          {tickets.map((ticket) => (
            <Card key={ticket.id} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-lg">{ticket.subject}</h3>
                    <Badge
                      className={
                        ticket.status === "resolved"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-orange-500/20 text-orange-400"
                      }
                    >
                      {ticket.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {ticket.id} • {ticket.category} • {ticket.messages} messages
                  </p>
                </div>
                <Button variant="outline">View Details</Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
