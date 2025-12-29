import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, MapPin, Edit, Trash2, Star, Home, Briefcase, Package } from "lucide-react";
import { toast } from "sonner";

/**
 * Account Addresses Page
 * Manage shipping and billing addresses
 */

interface Address {
  id: string;
  label: string;
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
  type: "shipping" | "billing" | "both";
}

export default function AccountAddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([
    {
      id: "1",
      label: "Home",
      fullName: "John Doe",
      addressLine1: "123 Main Street",
      addressLine2: "Apt 4B",
      city: "Los Angeles",
      state: "CA",
      zipCode: "90210",
      country: "United States",
      phone: "+1 (555) 123-4567",
      isDefault: true,
      type: "both",
    },
    {
      id: "2",
      label: "Work",
      fullName: "John Doe",
      addressLine1: "456 Business Ave",
      city: "San Francisco",
      state: "CA",
      zipCode: "94102",
      country: "United States",
      phone: "+1 (555) 987-6543",
      isDefault: false,
      type: "shipping",
    },
  ]);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [formData, setFormData] = useState<Partial<Address>>({
    label: "",
    fullName: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    zipCode: "",
    country: "United States",
    phone: "",
    type: "both",
  });

  const handleAddAddress = () => {
    const newAddress: Address = {
      id: Date.now().toString(),
      label: formData.label || "Address",
      fullName: formData.fullName || "",
      addressLine1: formData.addressLine1 || "",
      addressLine2: formData.addressLine2,
      city: formData.city || "",
      state: formData.state || "",
      zipCode: formData.zipCode || "",
      country: formData.country || "United States",
      phone: formData.phone || "",
      isDefault: addresses.length === 0,
      type: formData.type as "shipping" | "billing" | "both",
    };

    setAddresses([...addresses, newAddress]);
    setIsAddDialogOpen(false);
    resetForm();
    toast.success("Address added successfully");
  };

  const handleUpdateAddress = () => {
    if (!editingAddress) return;

    setAddresses(
      addresses.map((addr) =>
        addr.id === editingAddress.id ? { ...editingAddress, ...formData } : addr
      )
    );
    setEditingAddress(null);
    resetForm();
    toast.success("Address updated successfully");
  };

  const handleDeleteAddress = (id: string) => {
    const addressToDelete = addresses.find((addr) => addr.id === id);
    if (addressToDelete?.isDefault && addresses.length > 1) {
      toast.error("Cannot delete default address. Set another address as default first.");
      return;
    }

    setAddresses(addresses.filter((addr) => addr.id !== id));
    toast.success("Address deleted successfully");
  };

  const handleSetDefault = (id: string) => {
    setAddresses(
      addresses.map((addr) => ({
        ...addr,
        isDefault: addr.id === id,
      }))
    );
    toast.success("Default address updated");
  };

  const resetForm = () => {
    setFormData({
      label: "",
      fullName: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      zipCode: "",
      country: "United States",
      phone: "",
      type: "both",
    });
  };

  const openEditDialog = (address: Address) => {
    setEditingAddress(address);
    setFormData(address);
  };

  const getLabelIcon = (label: string) => {
    switch (label.toLowerCase()) {
      case "home":
        return <Home className="w-5 h-5" />;
      case "work":
        return <Briefcase className="w-5 h-5" />;
      default:
        return <Package className="w-5 h-5" />;
    }
  };

  const AddressForm = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="label">Address Label</Label>
        <Input
          id="label"
          placeholder="Home, Work, etc."
          value={formData.label}
          onChange={(e) => setFormData({ ...formData, label: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="fullName">Full Name</Label>
        <Input
          id="fullName"
          placeholder="John Doe"
          value={formData.fullName}
          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="addressLine1">Address Line 1</Label>
        <Input
          id="addressLine1"
          placeholder="123 Main Street"
          value={formData.addressLine1}
          onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
        <Input
          id="addressLine2"
          placeholder="Apt 4B"
          value={formData.addressLine2}
          onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            placeholder="Los Angeles"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="state">State</Label>
          <Input
            id="state"
            placeholder="CA"
            value={formData.state}
            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="zipCode">ZIP Code</Label>
          <Input
            id="zipCode"
            placeholder="90210"
            value={formData.zipCode}
            onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="country">Country</Label>
          <Select
            value={formData.country}
            onValueChange={(value) => setFormData({ ...formData, country: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="United States">United States</SelectItem>
              <SelectItem value="Canada">Canada</SelectItem>
              <SelectItem value="United Kingdom">United Kingdom</SelectItem>
              <SelectItem value="Australia">Australia</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          placeholder="+1 (555) 123-4567"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="type">Address Type</Label>
        <Select
          value={formData.type}
          onValueChange={(value) => setFormData({ ...formData, type: value as any })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="both">Shipping & Billing</SelectItem>
            <SelectItem value="shipping">Shipping Only</SelectItem>
            <SelectItem value="billing">Billing Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button
        onClick={editingAddress ? handleUpdateAddress : handleAddAddress}
        className="w-full"
      >
        {editingAddress ? "Update Address" : "Add Address"}
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Addresses</h1>
          <p className="text-gray-400 mt-2">Manage your shipping and billing addresses</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Add New Address
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Address</DialogTitle>
            </DialogHeader>
            <AddressForm />
          </DialogContent>
        </Dialog>
      </div>

      {/* Addresses Grid */}
      {addresses.length === 0 ? (
        <Card className="p-12 bg-background text-foreground/5 border-white/10 text-center">
          <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400 text-lg mb-6">No addresses saved yet</p>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Address
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {addresses.map((address) => (
            <Card
              key={address.id}
              className={`p-6 bg-background text-foreground/5 border-white/10 hover:bg-background text-foreground/10 transition-colors relative ${
                address.isDefault ? "ring-2 ring-red-500" : ""
              }`}
            >
              {/* Default Badge */}
              {address.isDefault && (
                <div className="absolute top-4 right-4">
                  <div className="flex items-center gap-1 bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-medium">
                    <Star className="w-3 h-3 fill-current" />
                    Default
                  </div>
                </div>
              )}

              {/* Address Label */}
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-500/20 rounded-lg text-red-400">
                  {getLabelIcon(address.label)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">{address.label}</h3>
                  <p className="text-sm text-gray-400 capitalize">{address.type.replace("_", " & ")}</p>
                </div>
              </div>

              {/* Address Details */}
              <div className="space-y-2 mb-6">
                <p className="text-foreground font-medium">{address.fullName}</p>
                <p className="text-muted-foreground">{address.addressLine1}</p>
                {address.addressLine2 && <p className="text-muted-foreground">{address.addressLine2}</p>}
                <p className="text-muted-foreground">
                  {address.city}, {address.state} {address.zipCode}
                </p>
                <p className="text-muted-foreground">{address.country}</p>
                <p className="text-gray-400 text-sm">{address.phone}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {!address.isDefault && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSetDefault(address.id)}
                    className="flex-1"
                  >
                    <Star className="w-4 h-4 mr-2" />
                    Set as Default
                  </Button>
                )}
                <Dialog
                  open={editingAddress?.id === address.id}
                  onOpenChange={(open) => {
                    if (!open) {
                      setEditingAddress(null);
                      resetForm();
                    }
                  }}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(address)}
                      className={address.isDefault ? "flex-1" : ""}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Edit Address</DialogTitle>
                    </DialogHeader>
                    <AddressForm />
                  </DialogContent>
                </Dialog>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteAddress(address.id)}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
