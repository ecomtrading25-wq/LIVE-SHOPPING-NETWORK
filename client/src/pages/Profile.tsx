import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Lock,
  Trash2,
  Upload,
  Camera,
  Activity,
  ShoppingBag,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "+1 (555) 123-4567",
    bio: "Live shopping enthusiast",
    avatar: "",
  });

  const [passwordData, setPasswordData] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  const activityLog = [
    { id: 1, type: "login", description: "Logged in from Chrome", time: "2 hours ago" },
    { id: 2, type: "order", description: "Placed order #12345", time: "1 day ago" },
    { id: 3, type: "login", description: "Logged in from Safari", time: "3 days ago" },
    { id: 4, type: "order", description: "Placed order #12344", time: "5 days ago" },
  ];

  const handleSaveProfile = () => {
    toast.success("Profile updated successfully");
    setIsEditing(false);
  };

  const handleChangePassword = () => {
    if (passwordData.new !== passwordData.confirm) {
      toast.error("Passwords do not match");
      return;
    }
    toast.success("Password changed successfully");
    setPasswordData({ current: "", new: "", confirm: "" });
  };

  const handleDeleteAccount = () => {
    if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      toast.success("Account deletion request submitted");
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData({ ...profileData, avatar: reader.result as string });
        toast.success("Avatar uploaded successfully");
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-8">My Profile</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Card */}
            <div className="lg:col-span-2">
              <Card className="p-6 bg-background text-foreground/10 backdrop-blur-xl border-white/20">
                <div className="flex items-start justify-between mb-6">
                  <h2 className="text-2xl font-bold text-foreground">Profile Information</h2>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(!isEditing)}
                    className="border-white/20"
                  >
                    {isEditing ? "Cancel" : "Edit"}
                  </Button>
                </div>

                {/* Avatar Upload */}
                <div className="flex items-center gap-6 mb-6">
                  <div className="relative">
                    <div className="w-24 h-24 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center overflow-hidden">
                      {profileData.avatar ? (
                        <img
                          src={profileData.avatar}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-12 h-12 text-foreground" />
                      )}
                    </div>
                    {isEditing && (
                      <label
                        htmlFor="avatar-upload"
                        className="absolute bottom-0 right-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-purple-700 transition-colors"
                      >
                        <Camera className="w-4 h-4 text-foreground" />
                        <input
                          id="avatar-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">{profileData.name}</h3>
                    <p className="text-muted-foreground">{profileData.email}</p>
                    <Badge className="mt-2 bg-purple-600">Premium Member</Badge>
                  </div>
                </div>

                {/* Profile Fields */}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        value={profileData.name}
                        onChange={(e) =>
                          setProfileData({ ...profileData, name: e.target.value })
                        }
                        disabled={!isEditing}
                        className="pl-10 bg-background/10 border-white/20 text-foreground placeholder:text-gray-400 disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        value={profileData.email}
                        onChange={(e) =>
                          setProfileData({ ...profileData, email: e.target.value })
                        }
                        disabled={!isEditing}
                        className="pl-10 bg-background/10 border-white/20 text-foreground placeholder:text-gray-400 disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        value={profileData.phone}
                        onChange={(e) =>
                          setProfileData({ ...profileData, phone: e.target.value })
                        }
                        disabled={!isEditing}
                        className="pl-10 bg-background/10 border-white/20 text-foreground placeholder:text-gray-400 disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Bio</label>
                    <Input
                      value={profileData.bio}
                      onChange={(e) =>
                        setProfileData({ ...profileData, bio: e.target.value })
                      }
                      disabled={!isEditing}
                      className="bg-background/10 border-white/20 text-foreground placeholder:text-gray-400 disabled:opacity-50"
                    />
                  </div>

                  {isEditing && (
                    <Button
                      onClick={handleSaveProfile}
                      className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                    >
                      Save Changes
                    </Button>
                  )}
                </div>
              </Card>

              {/* Change Password */}
              <Card className="p-6 bg-background text-foreground/10 backdrop-blur-xl border-white/20 mt-6">
                <h2 className="text-2xl font-bold text-foreground mb-6">Change Password</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Current Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        type="password"
                        value={passwordData.current}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, current: e.target.value })
                        }
                        placeholder="••••••••"
                        className="pl-10 bg-background/10 border-white/20 text-foreground placeholder:text-gray-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        type="password"
                        value={passwordData.new}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, new: e.target.value })
                        }
                        placeholder="••••••••"
                        className="pl-10 bg-background/10 border-white/20 text-foreground placeholder:text-gray-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        type="password"
                        value={passwordData.confirm}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, confirm: e.target.value })
                        }
                        placeholder="••••••••"
                        className="pl-10 bg-background/10 border-white/20 text-foreground placeholder:text-gray-400"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleChangePassword}
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                  >
                    Change Password
                  </Button>
                </div>
              </Card>

              {/* Danger Zone */}
              <Card className="p-6 bg-red-500/10 backdrop-blur-xl border-red-500/20 mt-6">
                <h2 className="text-2xl font-bold text-red-400 mb-4">Danger Zone</h2>
                <p className="text-muted-foreground mb-4">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <Button
                  onClick={handleDeleteAccount}
                  variant="destructive"
                  className="w-full"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Account
                </Button>
              </Card>
            </div>

            {/* Activity Sidebar */}
            <div className="lg:col-span-1">
              <Card className="p-6 bg-background text-foreground/10 backdrop-blur-xl border-white/20">
                <h2 className="text-xl font-bold text-foreground mb-4">Recent Activity</h2>
                <div className="space-y-4">
                  {activityLog.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-purple-600/20 rounded-full flex items-center justify-center flex-shrink-0">
                        {activity.type === "login" ? (
                          <Activity className="w-5 h-5 text-purple-400" />
                        ) : (
                          <ShoppingBag className="w-5 h-5 text-purple-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-foreground text-sm">{activity.description}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <p className="text-xs text-gray-400">{activity.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
