export function validatePhone(phone: string): boolean {
  // Basic phone validation for Indian numbers
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone);
}

export function validateName(name: string): boolean {
  // Name should be at least 2 characters, only letters, spaces, and some special characters
  const nameRegex = /^[a-zA-Z]+(([',. -][a-zA-Z ])?[a-zA-Z]*)*$/;
  return name.length >= 2 && nameRegex.test(name);
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export const ValidationErrors = {
  INVALID_PHONE: 'Please enter a valid 10-digit phone number',
  INVALID_NAME: 'Please enter a valid name (minimum 2 characters)',
  INVALID_EMAIL: 'Please enter a valid email address',
  REQUIRED_FIELD: 'This field is required'
} as const;