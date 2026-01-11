import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuthContext } from "@/hooks/FirebaseAuthProvider";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function StorageTest() {
  const [params] = useSearchParams();
  const { user } = useAuthContext();

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <h2 className="text-xl font-semibold text-amber-900">Cloud Storage Disabled</h2>
        <p className="text-sm text-amber-800 mt-2">
          Cloud storage functionality has been disabled. The app now uses Firebase Authentication and Firestore Database only.
        </p>
        <p className="text-sm text-amber-800 mt-2">
          Signed in as: <strong>{user?.email ?? "unknown"}</strong>
        </p>
      </div>
    </div>
  );
}
