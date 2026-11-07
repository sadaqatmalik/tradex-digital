import { supabase } from './supabaseClient';

export async function loginUser(identifier, password, captchaToken) {
    if (!captchaToken) {
        throw new Error('Please complete CAPTCHA verification.');
    }

    if (!identifier.trim() || !password) {
        throw new Error('Please enter your email and password.');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
        email: identifier.trim().toLowerCase(),
        password,
        options: {
            captchaToken: captchaToken
        }
    });

    if (error) throw error;

    return data;
}
export async function registerUser(
  username,
  email,
  password,
  captchaToken,
  inviteCode
) {
  if (!captchaToken) {
    throw new Error("Please complete CAPTCHA verification.");
  }

  if (!username.trim() || !email.trim() || !password) {
    throw new Error("Please fill in all required fields.");
  }

  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }

  if (!inviteCode || !inviteCode.trim()) {
    throw new Error("Please enter an invitation code.");
  }

  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      data: {
        username: username.trim(),
        invite_code: inviteCode.trim().toUpperCase()
      },
      captchaToken
    }
  });

  if (error) throw error;

  return data;
}