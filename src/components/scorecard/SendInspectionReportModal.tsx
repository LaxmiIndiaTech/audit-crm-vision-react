import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { adminApi, ApiError } from '@/lib/api';
import { X } from 'lucide-react';

interface SendInspectionReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId: string;
  branchName: string;
  date: string;
}

interface SendInspectionReportModalState {
  emails: string[];
  emailInput: string;
  sending: boolean;
}

const SendInspectionReportModal: React.FC<SendInspectionReportModalProps> = ({
  open,
  onOpenChange,
  branchId,
  branchName,
  date,
}) => {
  const { toast } = useToast();
  const [state, setState] = useState<SendInspectionReportModalState>({
    emails: [],
    emailInput: '',
    sending: false,
  });

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleAddEmail = () => {
    const trimmedEmail = state.emailInput.trim();
    
    if (!trimmedEmail) {
      toast({
        title: 'Error',
        description: 'Please enter an email address',
        variant: 'destructive',
      });
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      toast({
        title: 'Error',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      });
      return;
    }

    if (state.emails.includes(trimmedEmail)) {
      toast({
        title: 'Error',
        description: 'This email is already added',
        variant: 'destructive',
      });
      return;
    }

    setState({
      ...state,
      emails: [...state.emails, trimmedEmail],
      emailInput: '',
    });
  };

  const handleRemoveEmail = (email: string) => {
    setState({
      ...state,
      emails: state.emails.filter(e => e !== email),
    });
  };

  const handleSend = async () => {
    if (state.emails.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one email address',
        variant: 'destructive',
      });
      return;
    }

    try {
      setState({ ...state, sending: true });

      await adminApi.sendInspectionReport(branchId, {
        email: state.emails,
        date: date,
      });

      toast({
        title: 'Success',
        description: `Inspection report sent to ${state.emails.length} email(s)`,
      });

      // Reset and close
      setState({
        emails: [],
        emailInput: '',
        sending: false,
      });
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to send inspection report';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setState(prev => ({ ...prev, sending: false }));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddEmail();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Send Inspection Report</DialogTitle>
          <DialogDescription>
            Send the inspection report PDF to specified email addresses
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Branch and Date Info */}
          <div className="grid grid-cols-2 gap-4 text-sm p-3 bg-muted/20 rounded-lg">
            <div>
              <p className="text-muted-foreground">Branch</p>
              <p className="font-medium">{branchName}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Date</p>
              <p className="font-medium">{date}</p>
            </div>
          </div>

          {/* Email Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Email Addresses</label>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="Enter email address"
                value={state.emailInput}
                onChange={(e) => setState({ ...state, emailInput: e.target.value })}
                onKeyPress={handleKeyPress}
                disabled={state.sending}
                className="flex-1"
              />
              <Button
                onClick={handleAddEmail}
                disabled={state.sending || !state.emailInput.trim()}
                variant="outline"
              >
                Add
              </Button>
            </div>
          </div>

          {/* Email List */}
          {state.emails.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Recipients ({state.emails.length})</p>
              <div className="flex flex-wrap gap-2">
                {state.emails.map((email) => (
                  <Badge key={email} variant="secondary" className="flex items-center gap-1">
                    {email}
                    <button
                      onClick={() => handleRemoveEmail(email)}
                      disabled={state.sending}
                      className="ml-1 hover:text-destructive disabled:opacity-50"
                      aria-label={`Remove ${email}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={state.sending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={state.sending || state.emails.length === 0}
          >
            {state.sending ? 'Sending...' : 'Send Report'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SendInspectionReportModal;
