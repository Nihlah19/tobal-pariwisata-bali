/**
 * Auth Helper — Tour Penjelajah Bali
 * Wrapper Supabase Auth untuk multi-page vanilla JS.
 */
import { supabase } from './supabaseClient.js';

/**
 * Dapatkan user aktif saat ini.
 */
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;
    return user;
  } catch (err) {
    console.error('[Auth] Error getting user:', err);
    return null;
  }
}

/**
 * Dapatkan session aktif saat ini (termasuk access_token).
 */
export async function getSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) return null;
    return session;
  } catch (err) {
    console.error('[Auth] Error getting session:', err);
    return null;
  }
}

/**
 * Dapatkan profil pengguna dari database.
 */
export async function getUserProfile(userId) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('[Auth] Error getting profile:', err);
    return null;
  }
}

/**
 * Lindungi halaman yang butuh login.
 * Jika belum login, redirect ke halaman masuk dengan parameter returnTo.
 */
export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    const currentPath = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `/src/pages/masuk.html?returnTo=${currentPath}`;
    return null;
  }
  return session;
}

/**
 * Registrasi pengguna baru.
 */
export async function signUpUser(email, password, fullName) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        display_name: fullName
      }
    }
  });

  if (error) throw error;
  return data;
}

/**
 * Masuk akun pengguna.
 */
export async function signInUser(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;
  return data;
}

/**
 * Keluar dari akun.
 */
export async function signOutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  window.location.href = '/';
}
