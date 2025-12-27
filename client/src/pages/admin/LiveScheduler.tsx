import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Calendar,
  Clock,
  Plus,
  Edit,
  Trash2,
  Video,
  Users,
  Package,
  ChevronLeft,
  ChevronRight,
  Copy,
  Play,
} from "lucide-react";
import { toast } from "sonner";

/**
 * Live Shopping Session Scheduler
 * Calendar view, recurring shows, and creator assignments
 */

interface LiveSession {
  id: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  duration: number; // minutes
  creatorId: string;
  creatorName: string;
  streamUrl: string;
  products: string[];
  recurring: boolean;
  recurringPattern?: "daily" | "weekly" | "biweekly" | "monthly";
  status: "scheduled" | "live" | "completed" | "cancelled";
  expectedViewers: number;
}

export default function LiveSchedulerPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<LiveSession | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    startTime: "",
    duration: 60,
    creatorId: "",
    streamUrl: "",
    products: [] as string[],
    recurring: false,
    recurringPattern: "weekly" as "daily" | "weekly" | "biweekly" | "monthly",
  });

  // Mock sessions data
  const [sessions, setSessions] = useState<LiveSession[]>([
    {
      id: "1",
      title: "Tech Tuesday - Latest Gadgets",
      description: "Showcasing the hottest tech products of the week",
      date: "2025-12-30",
      startTime: "18:00",
      duration: 90,
      creatorId: "creator1",
      creatorName: "Sarah Tech",
      streamUrl: "https://stream.example.com/tech-tuesday",
      products: ["product1", "product2", "product3"],
      recurring: true,
      recurringPattern: "weekly",
      status: "scheduled",
      expectedViewers: 5000,
    },
    {
      id: "2",
      title: "Fashion Friday Flash Sale",
      description: "Exclusive fashion deals with limited quantities",
      date: "2026-01-03",
      startTime: "19:00",
      duration: 60,
      creatorId: "creator2",
      creatorName: "Emma Style",
      streamUrl: "https://stream.example.com/fashion-friday",
      products: ["product4", "product5"],
      recurring: true,
      recurringPattern: "weekly",
      status: "scheduled",
      expectedViewers: 3000,
    },
    {
      id: "3",
      title: "Holiday Special Event",
      description: "Year-end mega sale with celebrity guest",
      date: "2025-12-31",
      startTime: "20:00",
      duration: 120,
      creatorId: "creator3",
      creatorName: "Mike Deals",
      streamUrl: "https://stream.example.com/holiday-special",
      products: ["product6", "product7", "product8", "product9"],
      recurring: false,
      status: "scheduled",
      expectedViewers: 10000,
    },
  ]);

  const creators = [
    { id: "creator1", name: "Sarah Tech", specialty: "Technology" },
    { id: "creator2", name: "Emma Style", specialty: "Fashion" },
    { id: "creator3", name: "Mike Deals", specialty: "General" },
    { id: "creator4", name: "Lisa Beauty", specialty: "Beauty & Cosmetics" },
  ];

  const handleCreateSession = () => {
    const newSession: LiveSession = {
      id: Date.now().toString(),
      title: formData.title,
      description: formData.description,
      date: formData.date,
      startTime: formData.startTime,
      duration: formData.duration,
      creatorId: formData.creatorId,
      creatorName: creators.find((c) => c.id === formData.creatorId)?.name || "",
      streamUrl: formData.streamUrl,
      products: formData.products,
      recurring: formData.recurring,
      recurringPattern: formData.recurringPattern,
      status: "scheduled",
      expectedViewers: 0,
    };

    setSessions([...sessions, newSession]);
    setIsCreateDialogOpen(false);
    resetForm();
    toast.success("Live session scheduled successfully");
  };

  const handleUpdateSession = () => {
    if (!editingSession) return;

    setSessions(
      sessions.map((session) =>
        session.id === editingSession.id
          ? {
              ...session,
              ...formData,
              creatorName: creators.find((c) => c.id === formData.creatorId)?.name || "",
            }
          : session
      )
    );
    setEditingSession(null);
    resetForm();
    toast.success("Live session updated successfully");
  };

  const handleDeleteSession = (id: string) => {
    setSessions(sessions.filter((s) => s.id !== id));
    toast.success("Live session deleted");
  };

  const handleDuplicateSession = (session: LiveSession) => {
    const newSession: LiveSession = {
      ...session,
      id: Date.now().toString(),
      title: `${session.title} (Copy)`,
      status: "scheduled",
    };
    setSessions([...sessions, newSession]);
    toast.success("Session duplicated");
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      date: "",
      startTime: "",
      duration: 60,
      creatorId: "",
      streamUrl: "",
      products: [],
      recurring: false,
      recurringPattern: "weekly",
    });
  };

  const openEditDialog = (session: LiveSession) => {
    setEditingSession(session);
    setFormData({
      title: session.title,
      description: session.description,
      date: session.date,
      startTime: session.startTime,
      duration: session.duration,
      creatorId: session.creatorId,
      streamUrl: session.streamUrl,
      products: session.products,
      recurring: session.recurring,
      recurringPattern: session.recurringPattern || "weekly",
    });
  };

  const getSessionsForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return sessions.filter((s) => s.date === dateStr);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === "next" ? 1 : -1));
      return newDate;
    });
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      scheduled: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      live: "bg-green-500/20 text-green-400 border-green-500/30",
      completed: "bg-gray-500/20 text-gray-400 border-gray-500/30",
      cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
    };
    return styles[status as keyof typeof styles] || styles.scheduled;
  };

  const SessionForm = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="title">Session Title</Label>
        <Input
          id="title"
          placeholder="Tech Tuesday - Latest Gadgets"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Describe what products and deals will be featured..."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="startTime">Start Time</Label>
          <Input
            id="startTime"
            type="time"
            value={formData.startTime}
            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="duration">Duration (minutes)</Label>
        <Select
          value={formData.duration.toString()}
          onValueChange={(value) => setFormData({ ...formData, duration: parseInt(value) })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30">30 minutes</SelectItem>
            <SelectItem value="60">60 minutes</SelectItem>
            <SelectItem value="90">90 minutes</SelectItem>
            <SelectItem value="120">120 minutes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="creator">Creator</Label>
        <Select value={formData.creatorId} onValueChange={(value) => setFormData({ ...formData, creatorId: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select creator" />
          </SelectTrigger>
          <SelectContent>
            {creators.map((creator) => (
              <SelectItem key={creator.id} value={creator.id}>
                {creator.name} - {creator.specialty}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="streamUrl">Stream URL</Label>
        <Input
          id="streamUrl"
          placeholder="https://stream.example.com/your-stream"
          value={formData.streamUrl}
          onChange={(e) => setFormData({ ...formData, streamUrl: e.target.value })}
        />
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="recurring"
          checked={formData.recurring}
          onCheckedChange={(checked) => setFormData({ ...formData, recurring: checked as boolean })}
        />
        <Label htmlFor="recurring">Recurring Session</Label>
      </div>

      {formData.recurring && (
        <div>
          <Label htmlFor="recurringPattern">Recurring Pattern</Label>
          <Select
            value={formData.recurringPattern}
            onValueChange={(value: any) => setFormData({ ...formData, recurringPattern: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="biweekly">Bi-weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <Button onClick={editingSession ? handleUpdateSession : handleCreateSession} className="w-full">
        {editingSession ? "Update Session" : "Schedule Session"}
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Live Shopping Scheduler</h1>
          <p className="text-gray-400 mt-2">Plan and manage live shopping sessions</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Schedule New Session
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Schedule Live Session</DialogTitle>
            </DialogHeader>
            <SessionForm />
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 bg-white/5 border-white/10">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-sm">Total Sessions</p>
            <Calendar className="w-5 h-5 text-purple-400" />
          </div>
          <p className="text-3xl font-bold text-white">{sessions.length}</p>
        </Card>
        <Card className="p-6 bg-white/5 border-white/10">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-sm">Scheduled</p>
            <Clock className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-3xl font-bold text-white">{sessions.filter((s) => s.status === "scheduled").length}</p>
        </Card>
        <Card className="p-6 bg-white/5 border-white/10">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-sm">Active Creators</p>
            <Users className="w-5 h-5 text-green-400" />
          </div>
          <p className="text-3xl font-bold text-white">{creators.length}</p>
        </Card>
        <Card className="p-6 bg-white/5 border-white/10">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-sm">Recurring Shows</p>
            <Video className="w-5 h-5 text-yellow-400" />
          </div>
          <p className="text-3xl font-bold text-white">{sessions.filter((s) => s.recurring).length}</p>
        </Card>
      </div>

      {/* Calendar Navigation */}
      <Card className="p-6 bg-white/5 border-white/10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h2 className="text-2xl font-bold text-white">
              {currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </h2>
            <Button variant="outline" size="sm" onClick={() => navigateMonth("next")}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
            Today
          </Button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="text-center text-gray-400 font-medium py-2">
              {day}
            </div>
          ))}
          {getDaysInMonth(currentDate).map((day, index) => {
            const daySessions = day ? getSessionsForDate(day) : [];
            return (
              <div
                key={index}
                className={`min-h-24 p-2 border border-white/10 rounded-lg ${
                  day ? "bg-white/5 hover:bg-white/10" : "bg-transparent"
                } ${
                  day && day.toDateString() === new Date().toDateString()
                    ? "ring-2 ring-purple-500"
                    : ""
                }`}
              >
                {day && (
                  <>
                    <p className="text-white font-medium mb-1">{day.getDate()}</p>
                    <div className="space-y-1">
                      {daySessions.map((session) => (
                        <div
                          key={session.id}
                          className="text-xs p-1 bg-purple-500/20 text-purple-400 rounded cursor-pointer hover:bg-purple-500/30"
                          onClick={() => openEditDialog(session)}
                        >
                          <p className="font-medium truncate">{session.startTime}</p>
                          <p className="truncate">{session.title}</p>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Upcoming Sessions List */}
      <Card className="bg-white/5 border-white/10">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold text-white">Upcoming Sessions</h2>
        </div>
        <div className="divide-y divide-white/10">
          {sessions
            .filter((s) => s.status === "scheduled")
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map((session) => (
              <div key={session.id} className="p-6 hover:bg-white/5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-white">{session.title}</h3>
                      <div
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(
                          session.status
                        )}`}
                      >
                        {session.status === "live" && <Play className="w-3 h-3" />}
                        <span className="capitalize">{session.status}</span>
                      </div>
                      {session.recurring && (
                        <div className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs">
                          <Clock className="w-3 h-3" />
                          {session.recurringPattern}
                        </div>
                      )}
                    </div>
                    <p className="text-gray-400 mb-3">{session.description}</p>
                    <div className="flex items-center gap-6 text-sm text-gray-400">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {session.date}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {session.startTime} ({session.duration} min)
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        {session.creatorName}
                      </div>
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        {session.products.length} products
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleDuplicateSession(session)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Dialog
                      open={editingSession?.id === session.id}
                      onOpenChange={(open) => {
                        if (!open) {
                          setEditingSession(null);
                          resetForm();
                        }
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" onClick={() => openEditDialog(session)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Edit Live Session</DialogTitle>
                        </DialogHeader>
                        <SessionForm />
                      </DialogContent>
                    </Dialog>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteSession(session.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </Card>
    </div>
  );
}
