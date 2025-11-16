export type PhoneCountryCode = {
  value: string;
  label: string;
};

export const PHONE_COUNTRY_CODES: PhoneCountryCode[] = [
  { value: '+90', label: 'Türkiye (+90)' },
  { value: '+1', label: 'United States (+1)' },
  { value: '+44', label: 'United Kingdom (+44)' },
  { value: '+49', label: 'Germany (+49)' },
  { value: '+33', label: 'France (+33)' },
  { value: '+39', label: 'Italy (+39)' },
  { value: '+34', label: 'Spain (+34)' },
  { value: '+31', label: 'Netherlands (+31)' },
  { value: '+41', label: 'Switzerland (+41)' },
  { value: '+43', label: 'Austria (+43)' },
  { value: '+46', label: 'Sweden (+46)' },
  { value: '+47', label: 'Norway (+47)' },
  { value: '+48', label: 'Poland (+48)' },
  { value: '+7', label: 'Russia (+7)' },
  { value: '+81', label: 'Japan (+81)' },
  { value: '+82', label: 'South Korea (+82)' },
  { value: '+86', label: 'China (+86)' },
  { value: '+91', label: 'India (+91)' },
  { value: '+971', label: 'United Arab Emirates (+971)' },
  { value: '+966', label: 'Saudi Arabia (+966)' },
  { value: '+994', label: 'Azerbaijan (+994)' },
  { value: '+961', label: 'Lebanon (+961)' },
  { value: '+962', label: 'Jordan (+962)' },
  { value: '+964', label: 'Iraq (+964)' },
];

export const DEFAULT_PHONE_COUNTRY_CODE = PHONE_COUNTRY_CODES[0]?.value ?? '+90';
