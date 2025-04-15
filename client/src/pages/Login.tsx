import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useToast } from "@/hooks/useToast"
import { LogIn } from "lucide-react"
import { login, signInWithGoogle } from "@/api/auth"
import { getAuth } from "firebase/auth"
import { ModernBackground } from "@/components/ModernBackground"
import { getUserProfile } from "@/api/settings"

type LoginForm = {
  email: string
  password: string
}

export function Login() {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const navigate = useNavigate()
  const auth = getAuth()
  const { register, handleSubmit } = useForm<LoginForm>()

  // If already logged in, check if onboarding is needed
  useEffect(() => {
    const checkUserStatus = async () => {
      if (auth.currentUser != null) {
        try {
          // Check if user has completed onboarding
          const { userProfile } = await getUserProfile();
          
          if (userProfile?.onboardingCompleted) {
            navigate('/dashboard');
          } else {
            // Redirect to onboarding if not completed
            navigate('/onboarding');
          }
        } catch (error) {
          console.error("Error checking user profile:", error);
          navigate('/dashboard'); // Default to dashboard on error
        }
      }
    };
    
    checkUserStatus();
  }, [auth, navigate])

  const onSubmit = async (data: LoginForm) => {
    try {
      console.log('Starting login attempt with email:', data.email);
      setLoading(true)
      const response = await login(data.email, data.password);
      console.log('Login API response:', response);
      // The user is already authenticated through Firebase at this point
      // No need to store token as Firebase handles the session

      if (response.success) {
        toast({
          title: "Success",
          description: "Logged in successfully",
        })
        
        try {
          // Check if user has completed onboarding
          const { userProfile } = await getUserProfile();
          
          if (userProfile?.onboardingCompleted) {
            navigate('/dashboard');
          } else {
            // Redirect to onboarding if not completed
            navigate('/onboarding');
          }
        } catch (error) {
          console.error("Error checking user profile after login:", error);
          navigate('/dashboard'); // Default to dashboard on error
        }
      } else {
        toast({
          title: "Error",
          description: response.error || "Login failed",
        })
      }
    } catch (error) {
      console.error('Login error details:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Login failed",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
      toast({
        title: "Success",
        description: "Logged in successfully with Google",
      });
      
      try {
        // Check if user has completed onboarding
        const { userProfile } = await getUserProfile();
        
        if (userProfile?.onboardingCompleted) {
          navigate('/dashboard');
        } else {
          // Redirect to onboarding if not completed
          navigate('/onboarding');
        }
      } catch (error) {
        console.error("Error checking user profile after Google login:", error);
        navigate('/dashboard'); // Default to dashboard on error
      }
    } catch (error) {
      console.error('Google login error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Google login failed",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModernBackground className="flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>Enter your credentials to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button 
              type="button" 
              variant="outline" 
              className="w-full" 
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              {loading ? (
                "Loading..."
              ) : (
                <>
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Continue with Google
                </>
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  {...register("email", { required: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  {...register("password", { required: true })}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  "Loading..."
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign In
                  </>
                )}
              </Button>
            </form>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button
            variant="link"
            className="text-sm text-muted-foreground"
            onClick={() => navigate("/register")}
          >
            Don't have an account? Register 
          </Button>
        </CardFooter>
      </Card>
    </ModernBackground>
  )
}
