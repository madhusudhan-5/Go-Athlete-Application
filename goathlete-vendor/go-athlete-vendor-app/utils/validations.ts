import * as Yup from 'yup';

export const legalDetailsValidation = Yup.object().shape({
  business_name: Yup.string()
    .required('Business name is required')
    .min(2, 'Business name must be at least 2 characters'),
  registration_number: Yup.string()
    .required('Registration number is required'),
  tax_id: Yup.string()
    .required('Tax ID is required'),
  business_address: Yup.string()
    .required('Business address is required'),
  city: Yup.string()
    .required('City is required'),
  state: Yup.string()
    .required('State is required'),
  country: Yup.string()
    .required('Country is required'),
  postal_code: Yup.string()
    .required('Postal code is required')
    .matches(/^[0-9]+$/, 'Must be only digits'),
  contact_person: Yup.string()
    .required('Contact person name is required'),
  contact_email: Yup.string()
    .email('Invalid email')
    .required('Contact email is required'),
  contact_phone: Yup.string()
    .required('Contact phone is required')
    .matches(/^[0-9]+$/, 'Must be only digits')
    .min(10, 'Phone number must be at least 10 digits'),
  website: Yup.string()
    .url('Invalid URL format')
});

export const bankDetailsValidation = Yup.object().shape({
  account_name: Yup.string()
    .required('Account name is required'),
  account_number: Yup.string()
    .required('Account number is required')
    .matches(/^[0-9]+$/, 'Must be only digits'),
  bank_name: Yup.string()
    .required('Bank name is required'),
  branch_name: Yup.string()
    .required('Branch name is required'),
  ifsc_code: Yup.string()
    .required('IFSC code is required')
    .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code format'),
});

export const sportsFacilityValidation = Yup.object().shape({
  facility_type: Yup.array()
    .of(Yup.string())
    .min(1, 'At least one facility type is required'),
  total_courts: Yup.number()
    .required('Total courts is required')
    .min(1, 'Must have at least one court'),
  operating_hours: Yup.object()
    .required('Operating hours are required'),
});

export const courtValidation = Yup.object().shape({
  name: Yup.string()
    .required('Court name is required'),
  sport_type: Yup.string()
    .required('Sport type is required'),
  hourly_rate: Yup.number()
    .required('Hourly rate is required')
    .min(0, 'Rate cannot be negative'),
  capacity: Yup.number()
    .required('Capacity is required')
    .min(1, 'Capacity must be at least 1'),
  surface_type: Yup.string()
    .required('Surface type is required'),
});

export const coachProfileValidation = Yup.object().shape({
  sports: Yup.array()
    .of(Yup.string())
    .min(1, 'At least one sport is required'),
  experience_years: Yup.number()
    .required('Years of experience is required')
    .min(0, 'Experience cannot be negative'),
  qualifications: Yup.array()
    .of(Yup.string()),
  certifications: Yup.array()
    .of(Yup.string()),
  specializations: Yup.array()
    .of(Yup.string()),
  languages: Yup.array()
    .of(Yup.string())
    .min(1, 'At least one language is required'),
  hourly_rate: Yup.number()
    .required('Hourly rate is required')
    .min(0, 'Rate cannot be negative'),
  bio: Yup.string()
    .required('Bio is required')
    .min(100, 'Bio must be at least 100 characters'),
});

export const ecommerceStoreValidation = Yup.object().shape({
  store_name: Yup.string()
    .required('Store name is required'),
  description: Yup.string()
    .required('Store description is required'),
  categories: Yup.array()
    .of(Yup.string())
    .min(1, 'At least one category is required'),
  shipping_policy: Yup.string()
    .required('Shipping policy is required'),
  return_policy: Yup.string()
    .required('Return policy is required'),
  support_email: Yup.string()
    .email('Invalid email')
    .required('Support email is required'),
  support_phone: Yup.string()
    .required('Support phone is required')
    .matches(/^[0-9]+$/, 'Must be only digits')
    .min(10, 'Phone number must be at least 10 digits'),
});

export const productValidation = Yup.object().shape({
  name: Yup.string()
    .required('Product name is required'),
  description: Yup.string()
    .required('Product description is required'),
  category: Yup.string()
    .required('Category is required'),
  price: Yup.number()
    .required('Price is required')
    .min(0, 'Price cannot be negative'),
  stock: Yup.number()
    .required('Stock quantity is required')
    .min(0, 'Stock cannot be negative'),
  sku: Yup.string()
    .required('SKU is required'),
});

export const documentValidation = {
  required: {
    VENUE: [
      'BUSINESS_LICENSE',
      'ADDRESS_PROOF',
      'TAX_CERTIFICATE',
      'BANK_STATEMENT',
    ],
    COACH: [
      'ID_PROOF',
      'ADDRESS_PROOF',
      'CERTIFICATIONS',
      'BANK_STATEMENT',
    ],
    ECOMMERCE: [
      'BUSINESS_LICENSE',
      'TAX_CERTIFICATE',
      'BANK_STATEMENT',
      'ADDRESS_PROOF',
    ],
  },
  fileTypes: ['image/jpeg', 'image/png', 'application/pdf'],
  maxSize: 5 * 1024 * 1024, // 5MB
};