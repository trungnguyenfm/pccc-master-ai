import { NextResponse } from 'next/server';
import { createSupabaseBrowser } from '@/lib/supabase-browser';

// Route xử lý callback sau khi Google xác thực xong
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') || '/consult';

  if (code) {
    const supabase = createSupabaseBrowser();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Nếu lỗi thì quay về trang login
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
