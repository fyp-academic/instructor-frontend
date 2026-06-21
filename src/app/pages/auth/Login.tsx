import React, { useState } from 'react';
import instructorImage from '../../../assets/Instructor image.jfif';
import { Link, useNavigate } from 'react-router';
import { Eye, EyeOff, Loader2, Mail, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../services/api';
import ThemeToggle from '../../components/editorial/ThemeToggle';

function validate(email: string, password: string) {
  const e: Record<string, string> = {};
  if (!email.trim()) e.email = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email address';
  if (!password) e.password = 'Password is required';
  else if (password.length < 6) e.password = 'Password must be at least 6 characters';
  return e;
}

/* Social icons (Twitter/X and Instagram) using simple SVGs */
function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
    </svg>
  );
}

export default function Login() {
  const { login, logout } = useAuth();
  const navigate   = useNavigate();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [errors,   setErrors]   = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [wrongRole, setWrongRole] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const STUDENT_URL = import.meta.env.VITE_STUDENT_URL ?? 'https://apesudom.codagenz.com';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(email, password);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setApiError('');
    setWrongRole(false);
    setNeedsVerification(false);
    setResendSuccess(false);
    setLoading(true);
    try {
      await login(email, password);
      const stored = localStorage.getItem('auth_user');
      const user   = stored ? JSON.parse(stored) : null;
      const role   = String(user?.role ?? '');
      if (role === 'student') {
        await logout();
        setWrongRole(true);
      } else {
        navigate('/');
      }
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { message?: string; requires_verification?: boolean; email?: string } } })?.response?.data;
      if (data?.requires_verification) {
        setNeedsVerification(true);
        setUnverifiedEmail(data?.email ?? email);
      } else {
        setApiError(data?.message ?? 'Invalid credentials. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResending(true);
    setResendSuccess(false);
    try {
      await authApi.resendVerification(unverifiedEmail);
      setResendSuccess(true);
    } catch {
      setApiError('Failed to resend verification code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const fieldCls = (hasErr: boolean) =>
    `w-full px-4 py-3 rounded-md border text-step-2 text-ink outline-none transition-all placeholder:text-ink-2/60 ${
      hasErr
        ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-100'
        : 'border-line bg-paper focus:border-clay focus:ring-1 focus:ring-clay'
    }`;

  return (
    <div
      className="min-h-screen flex bg-paper text-ink"
      style={{ fontFamily: '"Inter Variable", Inter, system-ui, sans-serif' }}
    >
      {/* Left panel — framed image */}
      <div className="hidden lg:block lg:w-[48%] p-4">
        <div className="relative h-full overflow-hidden rounded-[18px] bg-paper-2">
          <img
            src={instructorImage}
            alt="Instructor teaching"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/20 to-transparent" />

          <div className="absolute left-8 top-8">
            <Link to="/" className="font-display ed-display text-step-5 leading-none text-paper">
              APES
            </Link>
            <p className="eyebrow mt-3 !text-paper/80">Instructor Portal</p>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-8">
            <p className="max-w-sm font-display ed-display text-step-3 text-paper">
              Teach smarter with AI-powered insight.
            </p>
            <div className="mt-6 flex items-center gap-5 text-paper/80">
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span className="text-step-1 font-medium">Facebook</span>
              </span>
              <span className="flex items-center gap-2">
                <InstagramIcon className="h-4 w-4" />
                <span className="text-step-1 font-medium">Instagram</span>
              </span>
              <span className="flex items-center gap-2">
                <TwitterIcon className="h-4 w-4" />
                <span className="text-step-1 font-medium">Twitter (X)</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="relative flex w-full flex-col bg-paper lg:w-[52%]">
        <div className="absolute right-5 top-5 z-10">
          <ThemeToggle />
        </div>
        <div className="flex flex-1 items-start justify-center px-8 pt-16 sm:px-12 lg:px-16 lg:pt-20 xl:px-24">
          <div className="w-full max-w-sm">
            <p className="eyebrow mb-4">Welcome back</p>
            <h1 className="font-display ed-display text-step-7 text-ink mb-9">
              Sign in to<br />APES
            </h1>

            {/* Wrong-role banner */}
            {wrongRole && (
              <div className="mb-5 p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm">
                <p className="font-semibold text-amber-800 mb-1">Student account detected</p>
                <p className="text-amber-700">
                  This portal is for instructors &amp; admins. Please use the{' '}
                  <a href={STUDENT_URL} className="text-clay font-semibold hover:underline">
                    student portal →
                  </a>
                </p>
              </div>
            )}

            {/* API error */}
            {apiError && (
              <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-2">
                <span className="mt-0.5 flex-shrink-0">⚠</span>
                <span>{apiError}</span>
              </div>
            )}

            {/* Email verification required */}
            {needsVerification && (
              <div className="mb-5 p-4 rounded-xl bg-amber-50 border border-amber-200">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-amber-800 mb-1">Email not verified</p>
                    <p className="text-sm text-amber-700 mb-3">
                      Please verify <strong>{unverifiedEmail}</strong> before logging in.
                      Check your inbox for the 6-digit verification code.
                    </p>
                    <div className="flex items-center gap-3 mb-3">
                      <Link
                        to={`/verify-email?email=${encodeURIComponent(unverifiedEmail)}`}
                        className="text-sm text-clay font-semibold hover:text-clay-deep inline-flex items-center gap-1"
                      >
                        <ArrowRight className="w-3 h-3" /> Enter verification code
                      </Link>
                    </div>
                    {resendSuccess ? (
                      <p className="text-sm text-emerald-700 font-medium">
                        ✓ Verification code sent! Check your inbox.
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendVerification}
                        disabled={resending}
                        className="text-sm text-clay font-semibold hover:text-clay-deep disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1"
                      >
                        {resending ? (
                          <><Loader2 className="w-3 h-3 animate-spin" /> Sending…</>
                        ) : (
                          <><ArrowRight className="w-3 h-3" /> Resend verification code</>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {/* Email */}
              <div>
                <label className="block text-step-1 font-medium text-ink-2 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })); }}
                  placeholder="Enter your email"
                  className={fieldCls(!!errors.email)}
                />
                {errors.email && (
                  <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                    <span>⚠</span> {errors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-step-1 font-medium text-ink-2 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: '' })); }}
                    placeholder="Enter your password"
                    className={fieldCls(!!errors.password)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(p => !p)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-2 hover:text-ink transition-colors"
                    tabIndex={-1}
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                    <span>⚠</span> {errors.password}
                  </p>
                )}
              </div>

              {/* Remember + Forgot */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-step-1 text-ink-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-line accent-clay"
                  />
                  Remember me
                </label>
                <Link
                  to="/forgot-password"
                  className="text-step-1 text-ink hover:text-clay font-medium transition-colors"
                >
                  Forgot Password
                </Link>
              </div>

              {/* Sign in */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-full bg-ink hover:bg-clay-deep text-paper font-semibold text-step-2 transition-colors duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</>
                  : 'Sign in'
                }
              </button>

              {/* Divider */}
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-line" />
                </div>
                <span className="relative bg-paper px-3 text-step-1 text-ink-2"></span>
              </div>
            </form>

            {/* Create account */}
            <p className="mt-8 text-center text-step-1 text-ink-2">
              Instructor accounts are created by administrators.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
