import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Eye, EyeOff, Loader2, UserCheck, CheckCircle2, Mail, ArrowRight } from 'lucide-react';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from '../../components/editorial/ThemeToggle';

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'instructor';
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

function validate(f: FormData): FormErrors {
  const e: FormErrors = {};
  if (!f.name.trim()) e.name = 'Full name is required';
  else if (f.name.trim().length < 2) e.name = 'Name must be at least 2 characters';
  if (!f.email.trim()) e.email = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = 'Enter a valid email address';
  if (!f.password) e.password = 'Password is required';
  else if (f.password.length < 8) e.password = 'Password must be at least 8 characters';
  else if (!/[A-Z]/.test(f.password)) e.password = 'Include at least one uppercase letter';
  else if (!/[0-9]/.test(f.password)) e.password = 'Include at least one number';
  if (!f.confirmPassword) e.confirmPassword = 'Please confirm your password';
  else if (f.password !== f.confirmPassword) e.confirmPassword = 'Passwords do not match';
  return e;
}

const PASSWORD_RULES = [
  { label: '8+ characters',    test: (p: string) => p.length >= 8 },
  { label: 'Uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Number',           test: (p: string) => /[0-9]/.test(p) },
];

export default function Register() {
  usePageTitle('Instructor Registration | APES LMS Instructor Portal');
  const { register } = useAuth();
  const navigate      = useNavigate();

  const [form, setForm] = useState<FormData>({
    name: '', email: '', password: '', confirmPassword: '', role: 'instructor',
  });
  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors,      setErrors]      = useState<FormErrors>({});
  const [apiError,    setApiError]    = useState('');
  const [loading,     setLoading]     = useState(false);
  const [registered,  setRegistered]  = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const STUDENT_URL = import.meta.env.VITE_STUDENT_URL ?? 'https://apesudom.codagenz.com';

  const set = (key: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(p => ({ ...p, [key]: e.target.value }));
    setErrors(p => ({ ...p, [key]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setApiError('');
    setLoading(true);
    try {
      await register({
        name:                  form.name.trim(),
        email:                 form.email.trim(),
        password:              form.password,
        password_confirmation: form.confirmPassword,
        role:                  form.role,
      });
      setRegisteredEmail(form.email.trim());
      setRegistered(true);
    } catch (err: unknown) {
      const data = (err as { response?: { data?: Record<string, unknown> } })?.response?.data;
      if (data?.errors && typeof data.errors === 'object') {
        const firstMsg = Object.values(data.errors as Record<string, string[]>)[0]?.[0];
        setApiError(firstMsg ?? 'Registration failed. Please try again.');
      } else {
        setApiError((data?.message as string) ?? 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
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
      {/* ── Left editorial branding panel ── */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 p-4">
        <div className="relative flex h-full w-full flex-col justify-between overflow-hidden rounded-[18px] border border-line bg-paper-2 p-12">
          <div>
            <Link to="/" className="font-display ed-display text-step-4 leading-none text-ink">
              APES
            </Link>
            <p className="eyebrow mt-3">Instructor Portal</p>

            <h1 className="font-display ed-display text-step-6 text-ink mt-10">
              Start teaching<br />smarter today
            </h1>
            <p className="mt-4 max-w-xs text-step-2 text-ink-2">
              Join thousands of educators using AI to create better learning experiences.
            </p>

            <div className="mt-10 space-y-4">
              {[
                'Create and manage courses with ease',
                'AI-driven analytics for every student',
                'Automated at-risk learner detection',
                'Integrated gradebook & assessment tools',
              ].map(t => (
                <div key={t} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-clay flex-shrink-0" />
                  <p className="text-step-2 text-ink-2">{t}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="h-px bg-line mb-4" />
            <p className="eyebrow">© 2026 APES LMS · AI Analytics Pipeline</p>
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="relative flex flex-1 items-start justify-center overflow-y-auto bg-paper p-6 pt-16 sm:items-center sm:p-10 sm:pt-16">
        <div className="absolute right-5 top-5 z-10">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-md py-6">

          {registered ? (
            <div className="text-center">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="w-10 h-10 text-emerald-600" />
              </div>
              <h2 className="font-display ed-display text-step-5 text-ink mb-2">Verify your email</h2>
              <p className="text-step-2 text-ink-2 mb-6">
                We've sent a 6-digit verification code to <strong className="text-ink">{registeredEmail}</strong>.
                Please check your inbox and enter the code below to activate your account.
              </p>
              <Link
                to={`/verify-email?email=${encodeURIComponent(registeredEmail)}`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-ink text-paper font-semibold text-step-2 hover:bg-clay-deep transition-colors mb-6"
              >
                Enter Verification Code <ArrowRight className="w-4 h-4" />
              </Link>
              <div className="p-4 rounded-xl bg-paper-2 border border-line mb-6">
                <p className="text-step-1 text-ink-2">
                  Didn't receive the email? Check your spam folder or{' '}
                  <Link to="/login" className="font-semibold text-clay underline">try logging in</Link> to resend.
                </p>
              </div>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-line text-ink font-semibold text-step-2 hover:border-ink transition-colors"
              >
                Go to Login
              </Link>
            </div>
          ) : (
            <>
              <p className="eyebrow mb-3">Join APES</p>
              <h2 className="font-display ed-display text-step-5 text-ink mb-1">Create your account</h2>
              <p className="text-step-2 text-ink-2 mb-7">Join the APES LMS instructor community</p>

              {apiError && (
                <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-2">
                  <span className="mt-0.5 flex-shrink-0">⚠</span>
                  <span>{apiError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Full name */}
            <div>
              <label className="block text-step-1 font-medium text-ink-2 mb-1.5">Full name</label>
              <input
                type="text"
                autoComplete="name"
                value={form.name}
                onChange={set('name')}
                placeholder="Dr. Jane Smith"
                className={fieldCls(!!errors.name)}
              />
              {errors.name && <p className="mt-1.5 text-xs text-red-600">⚠ {errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-step-1 font-medium text-ink-2 mb-1.5">Email address</label>
              <input
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={set('email')}
                placeholder="instructor@university.edu"
                className={fieldCls(!!errors.email)}
              />
              {errors.email && <p className="mt-1.5 text-xs text-red-600">⚠ {errors.email}</p>}
            </div>

            {/* Role (read-only display) */}
            <div>
              <label className="block text-step-1 font-medium text-ink-2 mb-1.5">Account type</label>
              <div className="w-full px-4 py-3 rounded-md border border-line bg-paper-2 text-step-2 text-clay font-medium flex items-center gap-2">
                <UserCheck className="w-4 h-4" />
                Instructor
              </div>
              <p className="mt-1.5 text-xs text-ink-2">Admin accounts are created by system administrators.</p>
            </div>

            {/* Password */}
            <div>
              <label className="block text-step-1 font-medium text-ink-2 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={set('password')}
                  placeholder="••••••••"
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
              {/* Password strength indicators */}
              <div className="flex gap-2 mt-2">
                {PASSWORD_RULES.map(r => {
                  const ok = form.password.length > 0 && r.test(form.password);
                  return (
                    <span key={r.label} className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${ok ? 'bg-emerald-100 text-emerald-700' : 'bg-paper-2 text-ink-2'}`}>
                      {ok ? '✓' : '○'} {r.label}
                    </span>
                  );
                })}
              </div>
              {errors.password && <p className="mt-1.5 text-xs text-red-600">⚠ {errors.password}</p>}
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-step-1 font-medium text-ink-2 mb-1.5">Confirm password</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={set('confirmPassword')}
                  placeholder="••••••••"
                  className={fieldCls(!!errors.confirmPassword)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(p => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-2 hover:text-ink transition-colors"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1.5 text-xs text-red-600">⚠ {errors.confirmPassword}</p>
              )}
            </div>

            {/* Terms */}
            <p className="text-xs text-ink-2 leading-relaxed">
              By creating an account, you agree to our{' '}
              <span className="text-clay cursor-pointer hover:underline">Terms of Service</span>{' '}
              and{' '}
              <span className="text-clay cursor-pointer hover:underline">Privacy Policy</span>.
            </p>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-full bg-ink hover:bg-clay-deep text-paper font-semibold text-step-2 transition-colors duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account…</>
                : 'Create Account'
              }
            </button>
          </form>

          <div className="mt-6 space-y-3 text-center text-step-1 text-ink-2">
            <p>
              Already have an account?{' '}
              <Link to="/login" className="text-clay font-semibold hover:text-clay-deep transition-colors">
                Sign in
              </Link>
            </p>
            <p>
              Student?{' '}
              <a href={STUDENT_URL} className="text-clay font-semibold hover:text-clay-deep transition-colors">
                Go to student portal
              </a>
            </p>
          </div>
          </>
          )}
        </div>
      </div>
    </div>
  );
}
