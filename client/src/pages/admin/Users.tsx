import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Users as UsersIcon,
  UserPlus,
  Search,
  Shield,
  Edit,
  Trash2,
  Mail,
  Calendar,
  Activity,
} from "lucide-react";

/**
 * Admin User Management Page
 * Create, edit, delete admin users with role assignment
 */

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    role: "viewer" as "founder" | "admin" | "ops" | "viewer",
    password: "",
  });

  const utils = trpc.useUtils();

  // Queries
  const { data: users, isLoading } = trpc.admin.listUsers.useQuery();

  // Mutations
  const createUser = trpc.admin.createUser.useMutation({
    onSuccess: () => {
      toast.success("User created successfully");
      setIsCreateDialogOpen(false);
      resetForm();
      utils.admin.listUsers.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create user");
    },
  });

  const updateUser = trpc.admin.updateUser.useMutation({
    onSuccess: () => {
      toast.success("User updated successfully");
      setEditingUser(null);
      resetForm();
      utils.admin.listUsers.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update user");
    },
  });

  const deleteUser = trpc.admin.deleteUser.useMutation({
    onSuccess: () => {
      toast.success("User deleted successfully");
      utils.admin.listUsers.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete user");
    },
  });

  const resetForm = () => {
    setFormData({
      email: "",
      name: "",
      role: "viewer",
      password: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingUser) {
      updateUser.mutate({
        id: editingUser.id,
        ...formData,
      });
    } else {
      createUser.mutate(formData);
    }
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      name: user.name,
      role: user.role,
      password: "",
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = (userId: string) => {
    if (confirm("Are you sure you want to delete this user?")) {
      deleteUser.mutate({ id: userId });
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "founder":
        return "bg-red-600 text-foreground";
      case "admin":
        return "bg-blue-600 text-foreground";
      case "ops":
        return "bg-green-600 text-foreground";
      case "viewer":
        return "bg-zinc-600 text-foreground";
      default:
        return "bg-zinc-600 text-foreground";
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "founder":
      case "admin":
        return Shield;
      case "ops":
        return Activity;
      default:
        return UsersIcon;
    }
  };

  // Filter users
  const filteredUsers = users?.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === "all" || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  // Role stats
  const roleStats = users?.reduce(
    (acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-foreground">
            User Management
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">
            Manage admin users and their permissions
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                setEditingUser(null);
                resetForm();
              }}
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingUser ? "Edit User" : "Create New User"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-zinc-900 dark:text-foreground mb-2 block">
                  Email
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="user@example.com"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-900 dark:text-foreground mb-2 block">
                  Name
                </label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-900 dark:text-foreground mb-2 block">
                  Role
                </label>
                <Select
                  value={formData.role}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="founder">Founder (Full Access)</SelectItem>
                    <SelectItem value="admin">Admin (Management)</SelectItem>
                    <SelectItem value="ops">Operations (Daily Tasks)</SelectItem>
                    <SelectItem value="viewer">Viewer (Read Only)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-900 dark:text-foreground mb-2 block">
                  Password {editingUser && "(leave blank to keep current)"}
                </label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="••••••••"
                  required={!editingUser}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  disabled={createUser.isPending || updateUser.isPending}
                >
                  {editingUser ? "Update User" : "Create User"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    setEditingUser(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Role Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-foreground">
                {roleStats?.founder || 0}
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Founders</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-foreground">
                {roleStats?.admin || 0}
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Admins</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-foreground">
                {roleStats?.ops || 0}
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Operations</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-zinc-100 dark:bg-card rounded-xl flex items-center justify-center text-card-foreground">
              <UsersIcon className="w-6 h-6 text-zinc-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-foreground">
                {roleStats?.viewer || 0}
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Viewers</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="founder">Founder</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="ops">Operations</SelectItem>
              <SelectItem value="viewer">Viewer</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Users Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background dark:bg-background border-b border-zinc-200 dark:border-border text-foreground">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900 dark:text-foreground">
                  User
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900 dark:text-foreground">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900 dark:text-foreground">
                  Created
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-zinc-900 dark:text-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredUsers?.map((user) => {
                const RoleIcon = getRoleIcon(user.role);
                return (
                  <tr
                    key={user.id}
                    className="hover:bg-background dark:hover:bg-background/50 text-foreground"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center">
                          <UsersIcon className="w-5 h-5 text-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-zinc-900 dark:text-foreground">
                            {user.name}
                          </p>
                          <p className="text-sm text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={getRoleBadgeColor(user.role)}>
                        <RoleIcon className="w-3 h-3 mr-1" />
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                        <Calendar className="w-4 h-4" />
                        {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(user)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(user.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredUsers?.length === 0 && (
            <div className="text-center py-12">
              <UsersIcon className="w-12 h-12 text-zinc-400 mx-auto mb-4" />
              <p className="text-zinc-600 dark:text-zinc-400">No users found</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
