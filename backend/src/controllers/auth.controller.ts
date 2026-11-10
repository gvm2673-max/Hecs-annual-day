import { Request, Response } from 'express';
import crypto from 'crypto';
import { AdminUserModel } from '../models/adminUser.model.js';

function hashPassword(pwd: string): string {
  return crypto.createHash('sha256').update(pwd).digest('hex');
}

export async function loginAdmin(req: Request, res: Response) {
  try {
    const { username, password } = req.body;
    if (!password) {
      return res.status(400).json({ success: false, error: 'ValidationError', message: 'Password is required' });
    }

    const defaultAdminUser = process.env.ADMIN_USERNAME || 'admin';
    let admin = await AdminUserModel.findOne();
    if (!admin) {
      admin = await AdminUserModel.create({
        username: defaultAdminUser,
        passwordHash: hashPassword(process.env.ADMIN_PASSWORD || 'admin123'),
        tokens: []
      });
    }

    const validUsername = admin.username || defaultAdminUser;
    if (username && username.trim().toLowerCase() !== validUsername.toLowerCase()) {
      return res.status(401).json({ success: false, error: 'AuthError', message: 'Invalid administrator username or credentials' });
    }

    if (hashPassword(password) === admin.passwordHash) {
      const token = crypto.randomBytes(32).toString('hex');
      admin.tokens.push(token);
      await admin.save();
      return res.json({ success: true, token, username: validUsername });
    } else {
      return res.status(401).json({ success: false, error: 'AuthError', message: 'Invalid administrator password' });
    }
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'ServerError', message: 'Server error during authentication' });
  }
}

export async function verifyAdmin(req: Request, res: Response) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.json({ authenticated: false });
    }
    const token = authHeader.split(' ')[1];
    const admin = await AdminUserModel.findOne({ tokens: token });
    return res.json({
      authenticated: !!admin,
      username: admin ? admin.username : undefined
    });
  } catch (err) {
    return res.json({ authenticated: false });
  }
}

export async function logoutAdmin(req: Request, res: Response) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      await AdminUserModel.updateMany({ tokens: token }, { $pull: { tokens: token } });
    }
    return res.json({ success: true });
  } catch (err) {
    return res.json({ success: true });
  }
}

export async function changePassword(req: Request, res: Response) {
  try {
    const { currentPassword, newUsername, newPassword } = req.body;
    if (!currentPassword) {
      return res.status(400).json({ success: false, error: 'ValidationError', message: 'Current password is required' });
    }
    const admin = (req as any).adminUser;
    if (hashPassword(currentPassword) !== admin.passwordHash) {
      return res.status(400).json({ success: false, error: 'AuthError', message: 'Current password is incorrect' });
    }
    if (newUsername && newUsername.trim()) {
      admin.username = newUsername.trim();
    }
    if (newPassword && newPassword.trim()) {
      admin.passwordHash = hashPassword(newPassword.trim());
    }
    await admin.save();
    return res.json({
      success: true,
      message: 'Administrator credentials updated successfully',
      username: admin.username
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'ServerError', message: 'Failed to update credentials' });
  }
}
