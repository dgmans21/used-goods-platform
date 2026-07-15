'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

/** 로그인 필수 페이지 */
const PROTECTED_PAGES = ['/sell', '/mypage'];
/** 로그인된 유저가 접근하면 메인으로 보낼 페이지 */
const AUTH_PAGES = ['/login', '/signup'];

function isProtectedPath(pathname: string) {
  return PROTECTED_PAGES.some(
    (page) => pathname === page || pathname.startsWith(`${page}/`),
  );
}

function isAuthPath(pathname: string) {
  return AUTH_PAGES.includes(pathname);
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const currentUser = useAuthStore((state) => state.currentUser);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    if (!currentUser && isProtectedPath(pathname)) {
      router.replace('/login');
    } else if (currentUser && isAuthPath(pathname)) {
      router.replace('/');
    }
  }, [currentUser, isHydrated, pathname, router]);

  if (!isHydrated) return null;

  if (!currentUser && isProtectedPath(pathname)) return null;

  return <>{children}</>;
}
