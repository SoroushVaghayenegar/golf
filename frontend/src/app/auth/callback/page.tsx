'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

function parseHash(hash: string) {
  // hash like: #access_token=...&refresh_token=...&type=invite&expires_in=3600
  const out: Record<string, string> = {};
  const trimmed = hash.replace(/^#/, '');
  for (const p of trimmed.split('&')) {
    const [k, v] = p.split('=');
    if (k) out[decodeURIComponent(k)] = decodeURIComponent(v ?? '');
  }
  return out;
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const qp = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        // 1) Prefer PKCE/code if present
        const code = qp.get('code');
        let flowType = qp.get('type') ?? undefined;

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else {
          // 2) Fallback: implicit/hash tokens
          const hashData = parseHash(window.location.hash || '');
          if (hashData.error_description) {
            throw new Error(hashData.error_description);
          }
          if (hashData.access_token && hashData.refresh_token) {
            const { error } = await supabase.auth.setSession({
              access_token: hashData.access_token,
              refresh_token: hashData.refresh_token,
            });
            if (error) throw error;
            // If type wasn't in query, take it from hash
            flowType = flowType ?? hashData.type;
          } else {
            throw new Error('No code or tokens found in callback URL.');
          }
        }

        // 3) Route by flow type
        if (flowType === 'invite') {
          router.replace('/auth/finish-invite');
        } else if (flowType === 'recovery') {
          router.replace('/auth/set-password');
        } else {
          router.replace('/app');
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Authentication failed.');
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-semibold">Authentication Error</h1>
        <p className="mt-2">{error}</p>
        <Link className="underline mt-4 inline-block" href="/">Go home</Link>
      </div>
    );
  }

  return <div className="p-8">Signing you in…</div>;
}
