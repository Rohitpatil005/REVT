import { useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/hooks/SupabaseAuthProvider";

const orgDisplay = (org: string | null) =>
  org === "vighneshwar"
    ? "Vighneshwar Traders"
    : org === "rohit"
      ? "Rohit Enterprises"
      : "Your Business";

export default function Auth() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const org = useMemo(() => params.get("org"), [params]);
  const { signInWithPassword, signInWithMagicLink, signUpWithPassword } =
    useAuthContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const go = () => navigate(`/dashboard?org=${org ?? "rohit"}`);

  async function handleSignIn() {
    try {
      const res = await signInWithPassword(email, password);
      if (res.error) throw res.error;
      go();
    } catch (e: any) {
      alert(e.message || "Sign in failed");
    }
  }

  async function handleMagicLink() {
    try {
      const res = await signInWithMagicLink(email);
      if (res.error) throw res.error;
      alert("Check your email for a magic link");
    } catch (e: any) {
      alert(e.message || "Failed to send magic link");
    }
  }

  return (
    <div className="mx-auto grid max-w-3xl grid-cols-1 gap-6 md:grid-cols-2">
      <Card className="md:col-span-2 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardHeader>
          <CardTitle className="text-2xl">Sign in</CardTitle>
          <CardDescription>
            Choose your business and sign in to manage invoices and reports.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-3">
            <label className="text-sm font-medium">Business</label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={org === "rohit" || !org ? "default" : "outline"}
                onClick={() => navigate("/auth?org=rohit")}
              >
                Rohit Enterprises
              </Button>
              <Button
                variant={org === "vighneshwar" ? "default" : "outline"}
                onClick={() => navigate("/auth?org=vighneshwar")}
              >
                Vighneshwar Traders
              </Button>
            </div>
          </div>
          <div className="grid gap-3">
            <label className="text-sm font-medium">Email</label>
            <Input
              placeholder="you@example.com"
              type="email"
              value={email}
              onChange={(e) => setEmail((e.target as HTMLInputElement).value)}
            />
          </div>
          <div className="grid gap-3">
            <label className="text-sm font-medium">Password</label>
            <Input
              placeholder="••••••••"
              type="password"
              value={password}
              onChange={(e) =>
                setPassword((e.target as HTMLInputElement).value)
              }
            />
          </div>
          <div className="flex items-end flex-col md:flex-row md:items-end md:gap-2">
            <div className="w-full md:w-auto md:flex-1">
              <Button className="w-full" onClick={handleSignIn}>
                Sign in to {orgDisplay(org)}
              </Button>
            </div>
            <div className="w-full md:w-auto mt-2 md:mt-0">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleMagicLink}
              >
                Send magic link
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
