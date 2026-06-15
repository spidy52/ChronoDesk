import {
  Request,
  Response,
} from 'express';

import bcrypt from 'bcrypt';

import jwt from 'jsonwebtoken';

import User from '../../models/User';
import { StorageEngine } from '../../utils/storage';
import { sendMail, getResetPasswordHtml } from '../../utils/mailer';

const JWT_SECRET =
  process.env.JWT_SECRET ||
  'super-secret-chrono-key-change-me';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const ALLOWED_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'outlook.com',
  'hotmail.com',
  'icloud.com',
  'protonmail.com',
  'proton.me',
  'aol.com',
  'zoho.com',
  'gmx.com',
  'yandex.com',
  'mail.com',
  'example.com'
];

const isValidEmail = (email: string): boolean => {
  if (!email) return false;
  const trimmed = email.trim();
  if (!EMAIL_REGEX.test(trimmed)) return false;
  const parts = trimmed.split('@');
  if (parts.length !== 2) return false;
  return ALLOWED_DOMAINS.includes(parts[1].toLowerCase());
};

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

      if (!isValidEmail(email)) {
        return res.status(400).json({
          error: 'Please enter a valid email address with an allowed domain (e.g., @gmail.com, @yahoo.com)',
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

      if (email.includes('@') && !isValidEmail(email)) {
        return res.status(400).json({
          error: 'Please enter a valid email address with an allowed domain',
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

/* ================= PASSWORD RESET & SECURITY ================= */

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address with an allowed domain' });
    }
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: 'User with this email does not exist' });
    }
    
    // Generate a temporary 1h reset token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
    const frontendBaseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendBaseUrl}/reset-password/${token}`;
    
    // Send email using Nodemailer utility
    const html = getResetPasswordHtml(resetUrl);
    const { previewUrl } = await sendMail({
      to: user.email,
      subject: 'Reset Your ChronoDesk Password',
      html,
    });
    
    console.log(`[PASSWORD RESET] Token generated for user ${user.email}: ${token}`);
    console.log(`[PASSWORD RESET] Link: ${resetUrl}`);
    if (previewUrl) {
      console.log(`[PASSWORD RESET] Preview URL (Ethereal): ${previewUrl}`);
    }

    res.json({
      message: 'Password reset link sent successfully',
    });
  } catch (error) {
    console.error('ForgotPassword error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }
    
    // Verify JWT token
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid or expired password reset token' });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Hash the new password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    user.passwordHash = passwordHash;
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('ResetPassword error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const changePassword = async (req: any, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Validate current password
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return res.status(400).json({ error: 'Incorrect current password' });
    }

    // Hash new password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    user.passwordHash = passwordHash;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('ChangePassword error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/* ================= PROFILE UPDATES & USER SEARCH ================= */

export const updateProfile = async (req: any, res: Response) => {
  try {
    const { name, username, email, bio, avatar } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if email is being updated and is already taken
    if (email && email.toLowerCase() !== user.email) {
      if (!isValidEmail(email)) {
        return res.status(400).json({ error: 'Please enter a valid email address with an allowed domain' });
      }
      const existingEmail = await User.findOne({ email: email.toLowerCase() });
      if (existingEmail) {
        return res.status(400).json({ error: 'Email address already in use' });
      }
      user.email = email.toLowerCase();
    }

    // Check if username is being updated and is already taken
    if (username && username.toLowerCase() !== user.username) {
      const existingUsername = await User.findOne({ username: username.toLowerCase() });
      if (existingUsername) {
        return res.status(400).json({ error: 'Username already taken' });
      }
      
      const usernameRegex = /^[a-zA-Z0-9_]+$/;
      if (!usernameRegex.test(username)) {
        return res.status(400).json({ error: 'Username can only contain letters, numbers and underscores' });
      }
      if (username.length < 4) {
        return res.status(400).json({ error: 'Username must be at least 4 characters' });
      }
      user.username = username.toLowerCase();
    }

    if (name !== undefined) user.name = name;
    if (bio !== undefined) user.bio = bio;

    // If avatar is base64 string, save it
    if (avatar && avatar.startsWith('data:image')) {
      const matches = avatar.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const buffer = Buffer.from(matches[2], 'base64');
        const fileExtension = matches[1].split('/')[1] || 'png';
        const filename = `avatar_${user.id}_${Date.now()}.${fileExtension}`;
        
        const avatarUrl = await StorageEngine.saveFile('avatars', filename, buffer);
        user.avatar = avatarUrl;
      }
    }

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
        avatar: user.avatar,
        bio: user.bio,
      }
    });
  } catch (error) {
    console.error('UpdateProfile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const searchUsers = async (req: any, res: Response) => {
  try {
    const query = req.query.q as string;
    if (!query) {
      return res.json([]);
    }

    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { name: { $regex: query, $options: 'i' } },
      ],
    })
    .select('name username email avatar bio createdAt')
    .limit(10);

    res.json(users);
  } catch (error) {
    console.error('SearchUsers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};