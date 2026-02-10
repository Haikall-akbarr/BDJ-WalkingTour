
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Lock, Mail, ArrowLeft, Info } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

const DEMO_CREDENTIALS = [
  { email: "admin@jelajahborneoku.com", password: "admin123", role: "admin" },
  { email: "owner@jelajahborneoku.com", password: "owner123", role: "owner" },
  { email: "guide@jelajahborneoku.com", password: "guide123", role: "guide" },
];

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = (role: string) => {
    setLoading(true);
    setTimeout(() => {
      router.push(`/dashboard/${role}`);
    }, 1000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Mock validation
    const user = DEMO_CREDENTIALS.find(u => u.email === email && u.password === password);

    setTimeout(() => {
      if (user) {
        router.push(`/dashboard/${user.role}`);
      } else {
        setLoading(false);
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: "Invalid email or password. Please use the demo credentials provided below.",
        });
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 font-bold text-3xl tracking-tight text-primary-foreground mb-4">
            <MapPin className="h-8 w-8 text-primary" />
            <span className="font-headline">JelajahBorneoKu</span>
          </Link>
          <h2 className="text-2xl font-bold">Welcome Back</h2>
          <p className="text-muted-foreground">Sign in to manage your walking tours.</p>
        </div>

        <Card className="border-none shadow-xl">
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>Enter your credentials to access the dashboard.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="email" 
                    type="email"
                    placeholder="staff@jelajahborneoku.com" 
                    className="pl-10" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password">Password</Label>
                  <Button variant="link" type="button" className="px-0 h-auto text-xs text-primary">Forgot password?</Button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="password" 
                    type="password" 
                    className="pl-10" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="bg-primary/5 p-3 rounded-lg flex gap-3 items-start border border-primary/10">
                <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div className="text-[11px] text-muted-foreground space-y-1">
                  <p className="font-bold text-primary-foreground">Demo Credentials:</p>
                  <p>• Admin: admin@jelajahborneoku.com / admin123</p>
                  <p>• Owner: owner@jelajahborneoku.com / owner123</p>
                  <p>• Guide: guide@jelajahborneoku.com / guide123</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
              
              <div className="relative w-full">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t"></span></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Quick Access</span></div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 w-full">
                <Button variant="outline" size="sm" type="button" onClick={() => handleLogin('admin')}>Admin</Button>
                <Button variant="outline" size="sm" type="button" onClick={() => handleLogin('owner')}>Owner</Button>
                <Button variant="outline" size="sm" type="button" onClick={() => handleLogin('guide')}>Guide</Button>
              </div>
            </CardFooter>
          </form>
        </Card>
        
        <Link href="/" className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Homepage
        </Link>
      </div>
    </div>
  )
}
