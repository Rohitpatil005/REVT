import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const STORAGE_KEY = "customer_addresses";

function loadAddresses(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function saveAddresses(list: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(new Set(list))));
}

export default function AutoFillDemo() {
  const [query, setQuery] = useState("");
  const [store, setStore] = useState<string[]>([]);

  useEffect(() => {
    setStore(loadAddresses());
  }, []);

  const suggestions = useMemo(() => {
    const seed = [
      "Shop No. 12, MG Road, Pune",
      "MIDC Industrial Area, Bhosari",
      "Plot 45, Hinjawadi Phase 2, Pune",
      "Ganesh Nagar, PCMC",
    ];
    const hay = [...seed, ...store];
    return hay
      .filter((addr) => addr.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 5);
  }, [query, store]);

  const save = () => {
    if (!query.trim()) return;
    const next = Array.from(new Set([query.trim(), ...store]));
    setStore(next);
    saveAddresses(next);
    setQuery("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer memory</CardTitle>
        <CardDescription>Type an address to see suggestions from history</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Start typing an address..."
          />
          <Button onClick={save}>Save</Button>
        </div>
        {query && (
          <ul className="rounded-md border divide-y">
            {suggestions.length === 0 && (
              <li className="p-3 text-sm text-muted-foreground">No suggestions</li>
            )}
            {suggestions.map((s) => (
              <li key={s}>
                <button
                  className="w-full text-left p-3 hover:bg-accent hover:text-accent-foreground"
                  onClick={() => setQuery(s)}
                >
                  {s}
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
