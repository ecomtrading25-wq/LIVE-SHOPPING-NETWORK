import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Lock, CheckCircle, Check, X } from "lucide-react";

export default function ResetPasswordPage() {
  const [, setLocation] = useLocation();
  const [passwordData, setPasswordData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const passwordStrength = calculatePasswordStrength(passwordData.password);
  const passwordsMatch =
    passwordData.password && passwordData.password === passwordData.confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordsMatch) {
      alert("Passwords do not match");
      return;
    }

    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        setLocation("/login");
      }, 2000);
    }, 1500);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 bg-background text-foreground/10 backdrop-blur-xl border-white/20 text-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Password Reset!</h1>
          <p className="text-muted-foreground mb-6">
            Your password has been successfully reset. You can now log in with your new
            password.
          </p>
          <p className="text-sm text-gray-400">Redirecting to login...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 bg-background text-foreground/10 backdrop-blur-xl border-white/20">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Reset Password</h1>
          <p className="text-muted-foreground">Enter your new password below</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="password"
                value={passwordData.password}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, password: e.target.value })
                }
                placeholder="••••••••"
                className="pl-10 bg-background/10 border-white/20 text-foreground placeholder:text-gray-400"
                required
              />
            </div>
            {passwordData.password && (
              <div className="mt-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex-1 h-2 bg-background text-foreground/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        passwordStrength === "weak"
                          ? "w-1/3 bg-red-500"
                          : passwordStrength === "medium"
                          ? "w-2/3 bg-yellow-500"
                          : "w-full bg-green-500"
                      }`}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground capitalize">{passwordStrength}</span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                }
                placeholder="••••••••"
                className="pl-10 bg-background/10 border-white/20 text-foreground placeholder:text-gray-400"
                required
              />
              {passwordData.confirmPassword && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {passwordsMatch ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : (
                    <X className="w-5 h-5 text-red-500" />
                  )}
                </div>
              )}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
            size="lg"
            disabled={isLoading || !passwordsMatch}
          >
            {isLoading ? "Resetting..." : "Reset Password"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/login">
            <a className="text-purple-400 hover:text-purple-300 font-medium">
              Back to Login
            </a>
          </Link>
        </div>
      </Card>
    </div>
  );
}

function calculatePasswordStrength(password: string): "weak" | "medium" | "strong" {
  if (password.length < 6) return "weak";
  if (password.length < 10) return "medium";

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const strength = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(
    Boolean
  ).length;

  if (strength >= 3) return "strong";
  if (strength >= 2) return "medium";
  return "weak";
}
