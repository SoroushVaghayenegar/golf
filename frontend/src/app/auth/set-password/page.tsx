'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

export default function SetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [pwd, setPwd] = useState('');
  const [pwd2, setPwd2] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Require session
  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        // No session — send them back through callback so we can exchange code
        router.replace('/auth/callback');
        return;
      }
      setReady(true);
    };
    check();
  }, [router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (pwd.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (pwd !== pwd2) {
      setError('Passwords do not match.');
      return;
    }

    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pwd });
    setBusy(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.replace('/');
  };

  if (!ready) return <div className="p-8">Loading…</div>;

  return (
    <div className="max-w-md mx-auto p-8">
      <h1 className="text-2xl font-semibold">Set your password</h1>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <input
          type="password"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          placeholder="New password"
          className="w-full border rounded p-2"
          autoComplete="new-password"
          required
        />
        <input
          type="password"
          value={pwd2}
          onChange={(e) => setPwd2(e.target.value)}
          placeholder="Confirm password"
          className="w-full border rounded p-2"
          autoComplete="new-password"
          required
        />
        {error && <p className="text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="rounded px-4 py-2 border"
        >
          {busy ? 'Saving…' : 'Save password'}
        </button>
      </form>
    </div>
  );
}
