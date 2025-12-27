import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { getLoginUrl } from "@/const";
import { UserPlus, Mail, Lock, User, Chrome, Check, X } from "lucide-react";

export default function SignupPage() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const passwordStrength = calculatePasswordStrength(formData.password);
  const passwordsMatch = formData.password && formData.password === formData.confirmPassword;

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!acceptTerms) {
      alert("Please accept the terms and conditions");
      return;
    }

    if (!passwordsMatch) {
      alert("Passwords do not match");
      return;
    }

    setIsLoading(true);
    
    // Simulate signup - replace with actual auth logic
    setTimeout(() => {
      setIsLoading(false);
      setLocation("/");
    }, 1500);
  };

  const handleOAuthSignup = () => {
    window.location.href = getLoginUrl();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 bg-white/10 backdrop-blur-xl border-white/20">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-gray-300">Join Live Shopping Network today</p>
        </div>

        {/* OAuth Signup */}
        <Button
          onClick={handleOAuthSignup}
          variant="outline"
          className="w-full mb-6 bg-white hover:bg-gray-100 text-black border-0"
          size="lg"
        >
          <Chrome className="w-5 h-5 mr-2" />
          Continue with Manus OAuth
        </Button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/20"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-transparent text-gray-400">Or sign up with email</span>
          </div>
        </div>

        {/* Email Signup Form */}
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-white mb-2 block">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-white mb-2 block">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="you@example.com"
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-white mb-2 block">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                required
              />
            </div>
            {formData.password && (
              <div className="mt-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
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
                  <span className="text-xs text-gray-300 capitalize">{passwordStrength}</span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-white mb-2 block">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="••••••••"
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                required
              />
              {formData.confirmPassword && (
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

          <div className="flex items-start gap-2">
            <Checkbox
              id="terms"
              checked={acceptTerms}
              onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
              className="mt-1"
            />
            <label htmlFor="terms" className="text-sm text-gray-300 cursor-pointer">
              I agree to the{" "}
              <Link href="/terms">
                <a className="text-purple-400 hover:text-purple-300">Terms of Service</a>
              </Link>{" "}
              and{" "}
              <Link href="/privacy">
                <a className="text-purple-400 hover:text-purple-300">Privacy Policy</a>
              </Link>
            </label>
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
            size="lg"
            disabled={isLoading || !acceptTerms}
          >
            {isLoading ? "Creating account..." : "Create Account"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-300">
            Already have an account?{" "}
            <Link href="/login">
              <a className="text-purple-400 hover:text-purple-300 font-medium">
                Sign in
              </a>
            </Link>
          </p>
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
  
  const strength = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length;
  
  if (strength >= 3) return "strong";
  if (strength >= 2) return "medium";
  return "weak";
}
