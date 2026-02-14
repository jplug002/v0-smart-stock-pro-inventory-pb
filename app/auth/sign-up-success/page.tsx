import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-slate-900">SmartStocks Pro</h1>
            <p className="text-sm text-slate-600 mt-1">Inventory Management System</p>
          </div>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">Check Your Email</CardTitle>
              <CardDescription>We&apos;ve sent you a confirmation link</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="text-sm text-slate-600">
                Please check your email and click the confirmation link to activate your account. After confirming, you
                can log in to access the dashboard.
              </p>
              <Link href="/auth/login">
                <Button className="w-full">Back to Login</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
