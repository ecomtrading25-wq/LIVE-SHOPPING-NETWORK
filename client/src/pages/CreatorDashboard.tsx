import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Users, DollarSign, TrendingUp, Calendar, Play, Pause, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

import AdminProtectedRoute from "@/components/AdminProtectedRoute";
export default function CreatorDashboard() {
  return (
    <AdminProtectedRoute>
      <CreatorDashboardContent />
    </AdminProtectedRoute>
  );
}

function CreatorDashboardContent() {
  const [onboardingForm, setOnboardingForm] = useState({
    userId: 0,
    stageName: "",
    bio: "",
    socialMedia: {
      tiktok: "",
      instagram: "",
      youtube: "",
      twitter: "",
    },
    niches: [] as string[],
    languages: ["en"],
    timezone: "America/New_York",
    availableHours: {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: [],
    },
    equipment: {
      camera: "",
      microphone: "",
      lighting: "",
      internet: "",
    },
  });

  const [scheduleForm, setScheduleForm] = useState({
    creatorId: 0,
    startTime: "",
    endTime: "",
    title: "",
    description: "",
    productIds: [] as number[],
    targetRevenue: 0,
    isRecurring: false,
    recurrencePattern: "weekly" as "daily" | "weekly" | "biweekly" | "monthly",
  });

  const onboardCreatorMutation = trpc.lsnCreatorEconomy.onboardCreator.useMutation();
  const createScheduleMutation = trpc.lsnCreatorEconomy.createBroadcastSchedule.useMutation();
  const generateScheduleMutation = trpc.lsnCreatorEconomy.generateOptimal24x7Schedule.useMutation();

  const handleOnboardCreator = async () => {
    try {
      await onboardCreatorMutation.mutateAsync(onboardingForm);
      toast.success("Creator onboarded successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to onboard creator");
    }
  };

  const handleCreateSchedule = async () => {
    try {
      await createScheduleMutation.mutateAsync(scheduleForm);
      toast.success("Broadcast scheduled successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to create schedule");
    }
  };

  const handleGenerateSchedule = async () => {
    try {
      const result = await generateScheduleMutation.mutateAsync({
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });
      toast.success(`Generated ${result.schedulesCreated} broadcast slots`);
    } catch (error: any) {
      toast.error(error.message || "Failed to generate schedule");
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Creator Economy Platform</h1>
          <p className="text-muted-foreground">Manage creators, schedules, and payouts</p>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Onboard Creator
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Onboard New Creator</DialogTitle>
                <DialogDescription>Add a new creator to your network</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="stageName">Stage Name</Label>
                    <Input
                      id="stageName"
                      value={onboardingForm.stageName}
                      onChange={(e) => setOnboardingForm({ ...onboardingForm, stageName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="userId">User ID</Label>
                    <Input
                      id="userId"
                      type="number"
                      value={onboardingForm.userId}
                      onChange={(e) => setOnboardingForm({ ...onboardingForm, userId: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={onboardingForm.bio}
                    onChange={(e) => setOnboardingForm({ ...onboardingForm, bio: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tiktok">TikTok Handle</Label>
                    <Input
                      id="tiktok"
                      value={onboardingForm.socialMedia.tiktok}
                      onChange={(e) =>
                        setOnboardingForm({
                          ...onboardingForm,
                          socialMedia: { ...onboardingForm.socialMedia, tiktok: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instagram">Instagram Handle</Label>
                    <Input
                      id="instagram"
                      value={onboardingForm.socialMedia.instagram}
                      onChange={(e) =>
                        setOnboardingForm({
                          ...onboardingForm,
                          socialMedia: { ...onboardingForm.socialMedia, instagram: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="camera">Camera Equipment</Label>
                    <Input
                      id="camera"
                      value={onboardingForm.equipment.camera}
                      onChange={(e) =>
                        setOnboardingForm({
                          ...onboardingForm,
                          equipment: { ...onboardingForm.equipment, camera: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="microphone">Microphone</Label>
                    <Input
                      id="microphone"
                      value={onboardingForm.equipment.microphone}
                      onChange={(e) =>
                        setOnboardingForm({
                          ...onboardingForm,
                          equipment: { ...onboardingForm.equipment, microphone: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleOnboardCreator} disabled={onboardCreatorMutation.isPending}>
                  Onboard Creator
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={handleGenerateSchedule} disabled={generateScheduleMutation.isPending}>
            <Calendar className="mr-2 h-4 w-4" />
            Generate 24/7 Schedule
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Creators</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">+3 this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payouts</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$45,231</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Revenue/Creator</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$1,885</div>
            <p className="text-xs text-muted-foreground">+12% vs last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Live Shows</CardTitle>
            <Play className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Currently streaming</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="schedule" className="space-y-4">
        <TabsList>
          <TabsTrigger value="schedule">24/7 Schedule</TabsTrigger>
          <TabsTrigger value="creators">Creators</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Broadcast Schedule</CardTitle>
                  <CardDescription>24/7 live shopping schedule grid</CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Show
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Schedule Broadcast</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Show Title</Label>
                        <Input
                          id="title"
                          value={scheduleForm.title}
                          onChange={(e) => setScheduleForm({ ...scheduleForm, title: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="startTime">Start Time</Label>
                          <Input
                            id="startTime"
                            type="datetime-local"
                            value={scheduleForm.startTime}
                            onChange={(e) => setScheduleForm({ ...scheduleForm, startTime: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="endTime">End Time</Label>
                          <Input
                            id="endTime"
                            type="datetime-local"
                            value={scheduleForm.endTime}
                            onChange={(e) => setScheduleForm({ ...scheduleForm, endTime: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="targetRevenue">Target Revenue</Label>
                        <Input
                          id="targetRevenue"
                          type="number"
                          value={scheduleForm.targetRevenue}
                          onChange={(e) => setScheduleForm({ ...scheduleForm, targetRevenue: parseFloat(e.target.value) })}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleCreateSchedule} disabled={createScheduleMutation.isPending}>
                        Schedule Show
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-8 gap-2 text-xs font-medium text-center">
                  <div>Time</div>
                  <div>Mon</div>
                  <div>Tue</div>
                  <div>Wed</div>
                  <div>Thu</div>
                  <div>Fri</div>
                  <div>Sat</div>
                  <div>Sun</div>
                </div>
                {[0, 6, 12, 18].map((hour) => (
                  <div key={hour} className="grid grid-cols-8 gap-2">
                    <div className="text-sm font-medium">{hour}:00</div>
                    {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                      <div
                        key={day}
                        className="h-16 rounded border border-border bg-muted/20 hover:bg-muted/40 cursor-pointer flex items-center justify-center text-xs"
                      >
                        {Math.random() > 0.5 && (
                          <div className="text-center">
                            <div className="font-medium">Creator {Math.floor(Math.random() * 10) + 1}</div>
                            <Badge variant="outline" className="text-xs">
                              Live
                            </Badge>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="creators" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Creator Directory</CardTitle>
              <CardDescription>All creators in your network</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Creator</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Shows</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Avg Viewers</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { name: "Sarah Chen", tier: "Diamond", shows: 45, revenue: 12500, viewers: 850, status: "active" },
                    { name: "Mike Johnson", tier: "Gold", shows: 32, revenue: 8200, viewers: 620, status: "active" },
                    { name: "Emma Davis", tier: "Silver", shows: 28, revenue: 5400, viewers: 480, status: "active" },
                    { name: "Alex Kim", tier: "Bronze", shows: 15, revenue: 2100, viewers: 320, status: "active" },
                  ].map((creator, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{creator.name}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            creator.tier === "Diamond"
                              ? "default"
                              : creator.tier === "Gold"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {creator.tier}
                        </Badge>
                      </TableCell>
                      <TableCell>{creator.shows}</TableCell>
                      <TableCell>${creator.revenue.toLocaleString()}</TableCell>
                      <TableCell>{creator.viewers}</TableCell>
                      <TableCell>
                        <Badge variant="default">{creator.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Pending Payouts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">$12,450</div>
                <p className="text-sm text-muted-foreground">8 creators</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Processed This Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">$45,231</div>
                <p className="text-sm text-muted-foreground">24 creators</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Avg Payout</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">$1,885</div>
                <p className="text-sm text-muted-foreground">Per creator</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Payouts</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Creator</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { name: "Sarah Chen", amount: 3200, period: "Dec 1-15", status: "paid" },
                    { name: "Mike Johnson", amount: 2100, period: "Dec 1-15", status: "paid" },
                    { name: "Emma Davis", amount: 1850, period: "Dec 1-15", status: "pending" },
                  ].map((payout, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{payout.name}</TableCell>
                      <TableCell>${payout.amount.toLocaleString()}</TableCell>
                      <TableCell>{payout.period}</TableCell>
                      <TableCell>
                        <Badge variant={payout.status === "paid" ? "default" : "secondary"}>{payout.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Performers</CardTitle>
                <CardDescription>By revenue this month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: "Sarah Chen", revenue: 12500, growth: 15 },
                    { name: "Mike Johnson", revenue: 8200, growth: 8 },
                    { name: "Emma Davis", revenue: 5400, growth: -2 },
                  ].map((creator, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{creator.name}</p>
                        <p className="text-sm text-muted-foreground">${creator.revenue.toLocaleString()}</p>
                      </div>
                      <Badge variant={creator.growth >= 0 ? "default" : "secondary"}>
                        {creator.growth >= 0 ? "+" : ""}
                        {creator.growth}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tier Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Diamond</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div className="bg-purple-500 h-2 rounded-full" style={{ width: "20%" }} />
                      </div>
                      <span className="font-medium">5</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Gold</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div className="bg-yellow-500 h-2 rounded-full" style={{ width: "30%" }} />
                      </div>
                      <span className="font-medium">7</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Silver</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div className="bg-gray-400 h-2 rounded-full" style={{ width: "35%" }} />
                      </div>
                      <span className="font-medium">8</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Bronze</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div className="bg-orange-500 h-2 rounded-full" style={{ width: "15%" }} />
                      </div>
                      <span className="font-medium">4</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
