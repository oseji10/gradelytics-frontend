'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  LockClosedIcon,
  // EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Link from 'next/link';
import Image from 'next/image';
import Icon from "@/components/Icons";
import { EyeCloseIcon, EyeIcon } from '@/icons';

export default function SetupPasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });

  // useEffect(() => {
  //   const email = localStorage.getItem('pending_user_email');
  //   if (!email) {
  //     router.push('/signup'); // Redirect to your signup page
  //     return;
  //   }
  //   setUserEmail(email);
  // }, [router]);

//   useEffect(() => {
//   const email = localStorage.getItem("pending_user_email");
//   if (!email) {
//     router.push("/signin");
//   }
// }, []);


useEffect(() => {
  const email = localStorage.getItem("pending_user_email");
  if (!email) {
    router.push("/signin");
    return; // ← good practice
  }

  setUserEmail(email);           // ← this line was missing!
}, [router]);                    // ← router is stable, but it's fine to include


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const passwordStrength = () => {
    if (formData.password.length === 0) return '';
    if (formData.password.length < 6) return 'weak';
    if (formData.password.length < 8) return 'medium';
    return 'strong';
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      // Step 1: Set password
      const setupResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/setup-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail,
          password: formData.password,
          password_confirmation: formData.confirmPassword,
        }),
      });

      const setupData = await setupResponse.json().catch(() => ({}));

      if (!setupResponse.ok || setupData.status !== 'success') {
        setError(setupData.message || 'Failed to set password');
        setIsLoading(false);
        return;
      }

      setSuccess('Password set successfully! Logging you in...');

      // Step 2: Auto-login
      const loginResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // For setting JWT cookies
        body: JSON.stringify({
          username: userEmail,
          password: formData.password,
        }),
      });

      const loginData = await loginResponse.json().catch(() => ({}));

      if (loginResponse.ok) {
        // Store user data (adjust based on your actual response)
        const userData = {
          email: loginData.email, // If your backend returns token in body
          firstName: loginData.firstName,
          lastName: loginData.lastName,
          phoneNumber: loginData.phoneNumber,
          role: loginData.role,
        };
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.removeItem('pending_user_email');
        localStorage.setItem("currentSchoolId", String(loginData.schoolId)); // ✅

        setSuccess('Setup successful! Login you in and redirecting to dashboard...');
        setTimeout(() => router.push('/dashboard'), 1500);
      } else {
        setError(loginData.message || 'Auto-login failed. Please sign in manually.');
        localStorage.removeItem('pending_user_email');
        setTimeout(() => router.push('/signin'), 2500);
      }
    } catch (err) {
      console.error('Password setup error:', err);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!userEmail) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <ArrowPathIcon className="w-12 h-12 animate-spin text-brand-500 mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
     
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          {/* Logo - Visible ONLY on mobile (hidden on lg and larger) */}
          <div className="block lg:hidden mb-8 text-center">
            <Link href="/" className="inline-block">
              <Image
                width={231}
                height={48}
                src="/images/logo/logo.svg"
                alt="Logo"
                priority // Optional: faster load on initial view
              />
            </Link>
          </div>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
              Set Your Password
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Create a secure password for <strong>{userEmail}</strong>
            </p>
          </div>
          <div>

            {success && (
            <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              {/* <CheckCircleIcon className="w-5 h-5" /> */}
              {/* <Icon src={CheckCircleIcon} className="w-5 h-5" /> */}
              {success}
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
              {error}
            </div>
          )}
  
            <form onSubmit={handleSubmit} className="space-y-6">
            {/* Password */}
            <div>
              <Label>Password</Label>
              <div className="relative mt-1">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Create a secure password (6+ characters)"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400"
                >
                  {showPassword ? (
                    // <EyeSlashIcon className="w-5 h-5" />
                    <Icon src={EyeCloseIcon} className="fill-gray-500 dark:fill-gray-400"/>
                  ) : (
                    // <EyeIcon className="w-5 h-5" />
                    <Icon src={EyeIcon} className="fill-gray-500 dark:fill-gray-400"/>
                  )}
                </button>

                
              </div>

              {formData.password && (
                <div className="mt-2 text-sm">
                  <div className="flex justify-between text-xs mb-1 text-gray-600 dark:text-gray-400">
                    <span>Password strength:</span>
                    <span className={`font-medium ${
                      passwordStrength() === 'weak' ? 'text-error-500' :
                      passwordStrength() === 'medium' ? 'text-yellow-500' :
                      passwordStrength() === 'strong' ? 'text-success-500' : ''
                    }`}>
                      {passwordStrength() ? passwordStrength().charAt(0).toUpperCase() + passwordStrength().slice(1) : ''}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className={`h-2 rounded-full transition-all duration-300 ${
                      passwordStrength() === 'weak' ? 'w-1/3 bg-error-500' :
                      passwordStrength() === 'medium' ? 'w-2/3 bg-yellow-500' :
                      passwordStrength() === 'strong' ? 'w-full bg-success-500' : 'w-0'
                    }`} />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <Label>Confirm Password</Label>
              <div className="relative mt-1">
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400"
                >
                  {showConfirmPassword ? (
                    // <EyeSlashIcon className="w-5 h-5" />
                    <Icon src={EyeSlashIcon} className="w-5 h-5" />
                  ) : (
                    // <EyeIcon className="w-5 h-5" />
                    <Icon src={EyeIcon} className="w-5 h-5" />
                  )}
                </button>
              </div>

              {formData.confirmPassword && (
                <p className={`mt-2 text-sm ${
                  formData.password === formData.confirmPassword
                    ? 'text-success-500'
                    : 'text-error-500'
                }`}>
                  {formData.password === formData.confirmPassword
                    ? '✓ Passwords match'
                    : '✗ Passwords do not match'}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-[#1F6F43] hover:bg-brand-600 disabled:opacity-50 shadow-theme-xs"
            >
              {isLoading ? (
                <>
                  {/* <ArrowPathIcon className="w-5 h-5 animate-spin mr-2" /> */}
                  {/* <Icon src={ArrowPathIcon} className="w-5 h-5 animate-spin mr-2"/> */}
                  <ArrowPathIcon className="w-5 h-5 animate-spin mr-2" />
                  Setting up...
                </>
              ) : (
                'Complete Setup & Sign In'
              )}
            </button>
          </form>
            <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                Don&apos;t have an account? {""}
                <Link
                  href="/signup"
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Sign Up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
