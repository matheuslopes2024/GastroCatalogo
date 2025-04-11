import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: ReactNode;
  className?: string;
}

interface LayoutHeaderProps {
  children: ReactNode;
  className?: string;
}

interface LayoutBodyProps {
  children: ReactNode;
  className?: string;
}

interface LayoutAsideProps {
  children: ReactNode;
  className?: string;
}

interface LayoutContentProps {
  children: ReactNode;
  className?: string;
}

export function Layout({ children, className }: LayoutProps) {
  return (
    <div className={cn('flex flex-col min-h-screen', className)}>
      {children}
    </div>
  );
}

export function LayoutHeader({ children, className }: LayoutHeaderProps) {
  return (
    <header className={cn('fixed top-0 left-0 right-0 z-30', className)}>
      {children}
    </header>
  );
}

export function LayoutBody({ children, className }: LayoutBodyProps) {
  return (
    <div className={cn('flex flex-1', className)}>
      {children}
    </div>
  );
}

export function LayoutAside({ children, className }: LayoutAsideProps) {
  return (
    <aside className={cn('overflow-hidden', className)}>
      {children}
    </aside>
  );
}

export function LayoutContent({ children, className }: LayoutContentProps) {
  return (
    <main className={cn('flex-1', className)}>
      {children}
    </main>
  );
}