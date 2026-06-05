import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/axios';
import { motion } from 'framer-motion';
import { Loader2, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resetToken, setResetToken] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');
    setResetToken('');

    try {
      const response = await api.post('/auth/forgot-password', { email });
      setSuccess('Reset link generated successfully! (Logged to server console)');
      if (response.data?.token) {
        setResetToken(response.data.token);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to request password reset');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <div className="space-y-2 text-center lg:text-left">
        <div className="flex items-center gap-2 mb-2 justify-center lg:justify-start">
          <Link to="/login" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft size={18} />
          </Link>
          <span className="text-sm text-muted-foreground">Back to Sign In</span>
        </div>
        <h2 className="text-3xl font-bold tracking-tight">Forgot Password</h2>
        <p className="text-muted-foreground text-sm">
          Enter your email and we'll generate a secure password reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-xl border border-destructive/20">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 text-sm text-emerald-500 bg-emerald-500/10 rounded-xl border border-emerald-500/20 space-y-2">
            <div>{success}</div>
            {resetToken && (
              <div className="pt-2 border-t border-emerald-500/20">
                <span className="font-semibold block mb-1">Local Testing Link:</span>
                <Link
                  to={`/reset-password/${resetToken}`}
                  className="text-purple-500 hover:text-purple-400 font-bold underline break-all text-xs"
                >
                  Click here to Reset Password directly
                </Link>
              </div>
            )}
          </div>
        )}

        {!success && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 focus:border-purple-500"
                placeholder="name@example.com"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 w-full"
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Send Reset Link'}
            </button>
          </div>
        )}
      </form>
    </motion.div>
  );
}
