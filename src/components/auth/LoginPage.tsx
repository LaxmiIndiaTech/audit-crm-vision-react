import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Building2, Phone, Send, ShieldCheck, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { validateMobileNumber, formatMobileNumber } from '@/lib/api';
import secureLocalStorage from 'react-secure-storage';

const LoginPage = () => {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [sentOtp, setSentOtp] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { requestOtp, loginWithOtp } = useAuth();

  // If token exists and not expired, redirect to dashboard
  useEffect(() => {
    try {
      const token = secureLocalStorage.getItem('crm_token');
      const expiry = secureLocalStorage.getItem('crm_token_expiry') as string | null;
      const expiryMs = expiry ? parseInt(expiry, 10) : 0;
      const now = Date.now();
      if (token && expiryMs && expiryMs > now) {
        navigate('/dashboard', { replace: true });
      }
    } catch {
      // ignore
    }
  }, [navigate]);

  const handleRequestOtp = async () => {
    setIsRequesting(true);
    setError('');
    setSuccessMessage('');
    
    try {
      const trimmedPhone = phone.trim();
      
      // Client-side validation
      if (!trimmedPhone) {
        throw new Error('Please enter your mobile number');
      }
      
      if (!validateMobileNumber(trimmedPhone)) {
        throw new Error('Please enter a valid 10-digit mobile number');
      }
      
      // Format phone number for display
      const formattedPhone = formatMobileNumber(trimmedPhone);
      
      const code = await requestOtp(formattedPhone);
      setSentOtp(code);
      
      // Set success message for better UX
      setSuccessMessage(`OTP has been sent to ${formattedPhone}`);
      
      toast({ 
        title: 'OTP Sent Successfully', 
        description: `We've sent a 6-digit code to ${formattedPhone}. For demo purposes, the code is also shown above.` 
      });
      
      setStep('otp');
    } catch (e: any) {
      console.error('OTP Request Error:', e);
      setError(e.message || 'Failed to send OTP. Please try again.');
      toast({
        variant: "destructive",
        title: "Error",
        description: e.message || 'Failed to send OTP. Please try again.'
      });
    } finally {
      setIsRequesting(false);
    }
  };

  const handleVerifyOtp = async () => {
    setIsVerifying(true);
    setError('');
    
    try {
      if (!otp.trim()) {
        throw new Error('Please enter the OTP');
      }
      
      if (otp.length < 6) {
        throw new Error('Please enter the complete 6-digit OTP');
      }
      
      const formattedPhone = formatMobileNumber(phone.trim());
      await loginWithOtp({ phone: formattedPhone, otp: otp.trim() });
      
      toast({ 
        title: 'Login Successful', 
        description: 'Welcome back! Redirecting to dashboard...' 
      });
      
      navigate('/dashboard');
    } catch (e: any) {
      console.error('OTP Verification Error:', e);
      setError(e.message || 'OTP verification failed. Please try again.');
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: e.message || 'OTP verification failed. Please try again.'
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-primary rounded-xl flex items-center justify-center">
              <Building2 className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">Audit CRM</h1>
          <p className="text-muted-foreground">Sign in to access your dashboard</p>
        </div>

        {/* Phone + OTP Sign In */}
        <Card className="crm-card">
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              {step === 'phone' ? 'Enter your mobile number to receive OTP' : 'Enter the OTP sent to your phone'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {successMessage && (
              <Alert>
                <Phone className="h-4 w-4" />
                <AlertTitle>OTP Sent</AlertTitle>
                <AlertDescription>{successMessage}</AlertDescription>
              </Alert>
            )}
            {step === 'otp' && sentOtp && (
              <Alert>
                <ShieldCheck className="h-4 w-4" />
                <AlertTitle>OTP Code (Demo Mode)</AlertTitle>
                <AlertDescription>
                  Use this code to sign in: <span className="font-mono font-semibold text-primary">{sentOtp}</span>
                  <br />
                  <span className="text-xs text-muted-foreground">Note: In production, this code would be sent via SMS only.</span>
                </AlertDescription>
              </Alert>
            )}
            {step === 'phone' && (
              <div className="space-y-2">
                <Label htmlFor="phone">Mobile Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter 10-digit mobile number"
                  value={phone}
                  onChange={e => {
                    // Allow only numbers and basic formatting characters
                    const cleaned = e.target.value.replace(/[^\d+\-\s()]/g, '');
                    setPhone(cleaned);
                  }}
                  disabled={isRequesting}
                  className={!validateMobileNumber(phone) && phone.length > 0 ? 'border-destructive' : ''}
                />
                {phone.length > 0 && !validateMobileNumber(phone) && (
                  <p className="text-sm text-destructive">Please enter a valid 10-digit mobile number</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Enter your registered mobile number to receive OTP
                </p>
              </div>
            )}
            {step === 'otp' && (
              <div className="space-y-2">
                <Label htmlFor="otp">Enter OTP</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={e => {
                    const numericValue = e.target.value.replace(/[^0-9]/g, '');
                    setOtp(numericValue);
                  }}
                  maxLength={6}
                  disabled={isVerifying}
                  className="text-center text-lg tracking-widest"
                />
                <div className="flex justify-between items-center">
                  <p className="text-xs text-muted-foreground">
                    Enter the 6-digit code sent to {formatMobileNumber(phone)}
                  </p>
                  {otp.length > 0 && otp.length < 6 && (
                    <p className="text-xs text-destructive">{6 - otp.length} more digits</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-3">
            {step === 'phone' && (
              <Button
                onClick={handleRequestOtp}
                className="w-full crm-button-primary"
                disabled={isRequesting || !phone.trim() || !validateMobileNumber(phone)}
              >
                {isRequesting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  <>
                    <Phone className="mr-2 h-4 w-4" />
                    Send OTP
                  </>
                )}
              </Button>
            )}
            {step === 'otp' && (
              <>
                <Button
                  onClick={handleVerifyOtp}
                  className="w-full crm-button-primary"
                  disabled={isVerifying || otp.length < 6}
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      Verify & Sign In
                    </>
                  )}
                </Button>
                <Button variant="outline" className="w-full" disabled={isVerifying} onClick={() => { 
                  setStep('phone'); 
                  setOtp(''); 
                  setSentOtp(null); 
                  setError(''); 
                  setSuccessMessage(''); 
                }}>
                  <Send className="mr-2 h-4 w-4" /> Resend / Change Number
                </Button>
              </>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;