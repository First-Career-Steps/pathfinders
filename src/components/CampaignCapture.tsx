'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { captureCampaign } from '@/lib/acquisition';

export function CampaignCapture() {
  const pathname = usePathname();
  useEffect(() => { captureCampaign(); }, [pathname]);
  return null;
}
