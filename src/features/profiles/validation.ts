/** Validación de registro — sin dependencias, mensajes en español. */

export const NICKNAME_RE = /^[a-z0-9_]{3,20}$/;

export function validateNickname(nickname: string): string | null {
  if (!NICKNAME_RE.test(nickname)) {
    return "El nickname debe tener 3 a 20 caracteres: letras minúsculas, números o guion bajo.";
  }
  return null;
}

export function validatePassword(password: string, confirm: string): string | null {
  if (password.length < 8) return "La contraseña necesita al menos 8 caracteres.";
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return "La contraseña necesita al menos una letra y un número.";
  }
  if (password !== confirm) return "Las contraseñas no coinciden.";
  return null;
}

export function validateEmail(email: string): string | null {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Ingresá un correo válido.";
  return null;
}
