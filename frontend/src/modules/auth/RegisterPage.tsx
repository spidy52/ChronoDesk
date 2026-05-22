import { useState } from 'react';

import {
  Link,
  useNavigate,
} from 'react-router-dom';

import { useAuthStore } from './store';

import { api } from '../../lib/axios';

import { motion } from 'framer-motion';

import {
  Loader2,
  AtSign,
} from 'lucide-react';

export default function RegisterPage() {

  const [name, setName] =
    useState('');

  const [username, setUsername] =
    useState('');

  const [email, setEmail] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [error, setError] =
    useState('');

  const [isLoading, setIsLoading] =
    useState(false);

  const setAuth =
    useAuthStore(
      (state) =>
        state.setAuth
    );

  const navigate =
    useNavigate();

  /* ================= SUBMIT ================= */

  const handleSubmit =
    async (
      e: React.FormEvent
    ) => {

      e.preventDefault();

      setIsLoading(true);

      setError('');

      /* ================= USERNAME VALIDATION ================= */

      const usernameRegex =
        /^[a-zA-Z0-9_]+$/;

      if (
        !usernameRegex.test(
          username
        )
      ) {

        setError(
          'Username can only contain letters, numbers and underscores'
        );

        setIsLoading(false);

        return;
      }

      if (
        username.length < 4
      ) {

        setError(
          'Username must be at least 4 characters'
        );

        setIsLoading(false);

        return;
      }

      try {

        const response =
          await api.post(
            '/auth/register',
            {
              name,
              username,
              email,
              password,
            }
          );

        setAuth(
          response.data.user,
          response.data.token
        );

        navigate(
          '/dashboard'
        );

      } catch (err: any) {

        setError(
          err.response?.data
            ?.error ||
            'Failed to register'
        );

      } finally {

        setIsLoading(false);
      }
    };

  return (
    <motion.div
      initial={{
        opacity: 0,
        x: -20,
      }}
      animate={{
        opacity: 1,
        x: 0,
      }}
      transition={{
        duration: 0.5,
      }}
      className="space-y-8"
    >

      {/* ================= HEADER ================= */}

      <div className="space-y-2 text-center lg:text-left">

        <h2 className="text-3xl font-bold tracking-tight">

          Create an account
        </h2>

        <p className="text-muted-foreground">

          Start rewinding your work today.
        </p>
      </div>

      {/* ================= FORM ================= */}

      <form
        onSubmit={
          handleSubmit
        }
        className="space-y-6"
      >

        {/* ERROR */}

        {error && (

          <div
            className="
              p-3
              text-sm
              text-destructive
              bg-destructive/10
              rounded-md
            "
          >

            {error}
          </div>
        )}

        <div className="space-y-4">

          {/* NAME */}

          <div className="space-y-2">

            <label
              className="
                text-sm
                font-medium
                leading-none
              "
              htmlFor="name"
            >

              Full Name
            </label>

            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) =>
                setName(
                  e.target.value
                )
              }
              className="
                flex
                h-11
                w-full
                rounded-xl
                border
                border-input
                bg-transparent
                px-4
                py-2
                text-sm
                placeholder:text-muted-foreground
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-ring
                transition-all
              "
              placeholder="John Doe"
              required
            />
          </div>

          {/* USERNAME */}

          <div className="space-y-2">

            <label
              className="
                text-sm
                font-medium
                leading-none
              "
              htmlFor="username"
            >

              Username
            </label>

            <div className="relative">

              <AtSign
                size={16}
                className="
                  absolute
                  left-4
                  top-1/2
                  -translate-y-1/2
                  text-muted-foreground
                "
              />

              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) =>
                  setUsername(
                    e.target.value
                      .toLowerCase()
                  )
                }
                className="
                  flex
                  h-11
                  w-full
                  rounded-xl
                  border
                  border-input
                  bg-transparent
                  pl-11
                  pr-4
                  py-2
                  text-sm
                  placeholder:text-muted-foreground
                  focus-visible:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-ring
                  transition-all
                "
                placeholder="john_dev"
                required
              />
            </div>

            <p
              className="
                text-xs
                text-muted-foreground
              "
            >

              Unique username used for
              collaborations, chat and
              invitations.
            </p>
          </div>

          {/* EMAIL */}

          <div className="space-y-2">

            <label
              className="
                text-sm
                font-medium
                leading-none
              "
              htmlFor="email"
            >

              Email
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(
                  e.target.value
                )
              }
              className="
                flex
                h-11
                w-full
                rounded-xl
                border
                border-input
                bg-transparent
                px-4
                py-2
                text-sm
                placeholder:text-muted-foreground
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-ring
                transition-all
              "
              placeholder="name@example.com"
              required
            />
          </div>

          {/* PASSWORD */}

          <div className="space-y-2">

            <label
              className="
                text-sm
                font-medium
                leading-none
              "
              htmlFor="password"
            >

              Password
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }
              className="
                flex
                h-11
                w-full
                rounded-xl
                border
                border-input
                bg-transparent
                px-4
                py-2
                text-sm
                placeholder:text-muted-foreground
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-ring
                transition-all
              "
              placeholder="Enter password"
              required
            />
          </div>
        </div>

        {/* BUTTON */}

        <button
          type="submit"
          disabled={isLoading}
          className="
            inline-flex
            items-center
            justify-center
            rounded-xl
            text-sm
            font-medium
            transition-all
            disabled:pointer-events-none
            disabled:opacity-50
            bg-primary
            text-primary-foreground
            hover:bg-primary/90
            h-11
            w-full
          "
        >

          {isLoading ? (

            <Loader2
              className="
                mr-2
                h-4
                w-4
                animate-spin
              "
            />

          ) : (

            'Create Account'
          )}
        </button>
      </form>

      {/* LOGIN */}

      <div
        className="
          text-center
          text-sm
          text-muted-foreground
        "
      >

        Already have an account?{' '}

        <Link
          to="/login"
          className="
            font-medium
            text-purple-500
            hover:text-purple-400
          "
        >

          Sign in instead
        </Link>
      </div>
    </motion.div>
  );
}