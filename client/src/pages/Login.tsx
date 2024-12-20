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
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useToast } from "@/hooks/useToast"
import { LogIn } from "lucide-react"
import { login } from "@/api/auth"
import { getAuth } from "@firebase/auth"

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

  // If already logged in, direct them to home page
  console.log(auth.currentUser)
  useEffect(() => {
    if (auth.currentUser != null) {
      navigate('/')
    }
  }, [auth, navigate])

  const onSubmit = async (data: LoginForm) => {
    try {
      console.log('Starting login attempt with email:', data.email);
      setLoading(true)
      let response = await login(data.email, data.password);
      console.log('Login API response:', response);
      // The user is already authenticated through Firebase at this point
      // No need to store token as Firebase handles the session
      toast({
        title: "Success",
        description: "Logged in successfully",
      })
      navigate("/")
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>Enter your credentials to continue</CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  )
}