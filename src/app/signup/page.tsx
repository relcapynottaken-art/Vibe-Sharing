import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { signupAction } from "@/app/actions/auth";
import { getCurrentUser } from "@/lib/auth";

export default async function SignupPage() {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "admin" ? "/admin" : "/dashboard");
  return <AuthForm action={signupAction} mode="signup" />;
}
