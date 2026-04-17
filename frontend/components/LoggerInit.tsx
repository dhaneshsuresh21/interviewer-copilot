'use client';

import { useEffect } from 'react';
import { installFrontendLogger } from '../lib/fileLogger';

export default function LoggerInit() {
  useEffect(() => {
    installFrontendLogger();
  }, []);
  return null;
}
