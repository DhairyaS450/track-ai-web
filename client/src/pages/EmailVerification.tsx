import { verifyEmail } from "@/api/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { User } from "firebase/auth";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface EmailVerificationProps {
  user: User | null;
}

export const EmailVerification: React.FC<EmailVerificationProps> = ({
  user,
}) => {
  const navigate = useNavigate();
  useEffect(() => {
    if (user?.emailVerified) {
      navigate("/");
    }
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>
            Please verify your email {user?.email || ""} to continue. <br />
            If you did not receive the email, please check your spam folder.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={() => verifyEmail(user)}>
            Resend Verification Email
          </Button>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button className="w-full" onClick={() => window.location.reload()}>
            Reload
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
