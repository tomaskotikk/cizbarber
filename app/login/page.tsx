import { Suspense } from "react";
import LoginForm from "@/app/login/login-form";

export default function LoginPage() {
  return (
    <main className="login-page">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
