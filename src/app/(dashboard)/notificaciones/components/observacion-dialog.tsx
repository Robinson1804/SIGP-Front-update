"use client";

import { MessageSquare } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ObservacionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  observacion?: string;
}

export function ObservacionDialog({ open, onOpenChange, title, observacion }: ObservacionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            Observaciones
          </DialogTitle>
          <DialogDescription>
            {title}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <div className="p-4 bg-gray-50 rounded-lg border">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {observacion || 'Sin observaciones'}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
