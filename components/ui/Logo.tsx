import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
  withLink?: boolean;
}

export function Logo({ className = '', width = 160, height = 48, withLink = false }: LogoProps) {
  const content = (
    <div className={`flex items-center justify-center ${className}`}>
      <Image
        src="/images/logo-v6.png"
        alt="Flavio Celulares Logo"
        width={width}
        height={height}
        className="object-contain"
        priority
      />
    </div>
  );

  if (withLink) {
    return (
      <Link href="/dashboard" className="transition-opacity hover:opacity-90">
        {content}
      </Link>
    );
  }

  return content;
}
