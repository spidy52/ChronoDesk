import {
  Request,
  Response,
} from 'express';

import bcrypt from 'bcrypt';

import jwt from 'jsonwebtoken';

import User from '../../models/User';

const JWT_SECRET =
  process.env.JWT_SECRET ||
  'super-secret-chrono-key-change-me';

/* ================= REGISTER ================= */

export const register =
  async (
    req: Request,
    res: Response
  ) => {

    try {

      const {
        email,
        password,
        name,
        username,
      } = req.body;

      /* ================= VALIDATION ================= */

      if (
        !email ||
        !password ||
        !username
      ) {

        return res.status(400).json({
          error:
            'Email, username and password are required',
        });
      }

      /* ================= USERNAME VALIDATION ================= */

      const usernameRegex =
        /^[a-zA-Z0-9_]+$/;

      if (
        !usernameRegex.test(
          username
        )
      ) {

        return res.status(400).json({
          error:
            'Username can only contain letters, numbers and underscores',
        });
      }

      if (
        username.length < 4
      ) {

        return res.status(400).json({
          error:
            'Username must be at least 4 characters',
        });
      }

      /* ================= EMAIL CHECK ================= */

      const existingEmail =
        await User.findOne({
          email,
        });

      if (existingEmail) {

        return res.status(400).json({
          error:
            'Email already exists',
        });
      }

      /* ================= USERNAME CHECK ================= */

      const existingUsername =
        await User.findOne({
          username:
            username.toLowerCase(),
        });

      if (
        existingUsername
      ) {

        return res.status(400).json({
          error:
            'Username already taken',
        });
      }

      /* ================= HASH PASSWORD ================= */

      const saltRounds = 10;

      const passwordHash =
        await bcrypt.hash(
          password,
          saltRounds
        );

      /* ================= CREATE USER ================= */

      const user =
        await User.create({

          email,

          passwordHash,

          name,

          username:
            username.toLowerCase(),
        });

      /* ================= JWT ================= */

      const token = jwt.sign(
        {
          userId: user.id,

          email:
            user.email,

          username:
            user.username,
        },

        JWT_SECRET,

        {
          expiresIn: '7d',
        }
      );

      /* ================= RESPONSE ================= */

      res.status(201).json({

        message:
          'User registered successfully',

        token,

        user: {

          id: user.id,

          email:
            user.email,

          name:
            user.name,

          username:
            user.username,
        },
      });

    } catch (error) {

      console.error(
        'Registration error:',
        error
      );

      res.status(500).json({
        error:
          'Internal server error',
      });
    }
  };

/* ================= LOGIN ================= */

export const login =
  async (
    req: Request,
    res: Response
  ) => {

    try {

      const {
        email,
        password,
      } = req.body;

      /* ================= VALIDATION ================= */

      if (
        !email ||
        !password
      ) {

        return res.status(400).json({
          error:
            'Email/Username and password are required',
        });
      }

      /* ================= FIND USER ================= */

      const user =
        await User.findOne({

          $or: [

            {
              email,
            },

            {
              username:
                email.toLowerCase(),
            },
          ],
        });

      if (!user) {

        return res.status(401).json({
          error:
            'Invalid credentials',
        });
      }

      /* ================= PASSWORD CHECK ================= */

      const isValidPassword =
        await bcrypt.compare(
          password,
          user.passwordHash
        );

      if (
        !isValidPassword
      ) {

        return res.status(401).json({
          error:
            'Invalid credentials',
        });
      }

      /* ================= JWT ================= */

      const token = jwt.sign(
        {
          userId: user.id,

          email:
            user.email,

          username:
            user.username,
        },

        JWT_SECRET,

        {
          expiresIn: '7d',
        }
      );

      /* ================= RESPONSE ================= */

      res.json({

        message:
          'Login successful',

        token,

        user: {

          id: user.id,

          email:
            user.email,

          name:
            user.name,

          username:
            user.username,
        },
      });

    } catch (error) {

      console.error(
        'Login error:',
        error
      );

      res.status(500).json({
        error:
          'Internal server error',
      });
    }
  };