import bcrypt from 'bcrypt';
import config from '../config/index.simple';

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, config.bcryptRounds);
};

export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

export const hashToken = async (token: string): Promise<string> => {
  return bcrypt.hash(token, 10);
};

export const compareToken = async (token: string, hashedToken: string): Promise<boolean> => {
  return bcrypt.compare(token, hashedToken);
};
