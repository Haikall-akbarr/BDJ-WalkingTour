
'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { useToast } from '@/hooks/use-toast';

export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handlePermissionError = (error: any) => {
      // In development, the error listener helps surface security rule issues
      // without cluttering the business logic with try/catches.
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: error.message,
      });

      // Keep the app running in dev/prod; Firestore permission issues should surface as UI feedback only.
      console.warn("Firestore permission error", error);
    };

    errorEmitter.on('permission-error', handlePermissionError);
    return () => {
      errorEmitter.removeListener('permission-error', handlePermissionError);
    };
  }, [toast]);

  return null;
}
