import type { SelectOption } from '../components/ui/Select';

const RELATIONSHIP_LABELS: Record<string, string> = {
  'spouse': 'Spouse',
  'partner': 'Partner',
  'ex-spouse': 'Ex-spouse',
  'ex-partner': 'Ex-partner',
  'biological-child': 'Biological child',
  'adopted-child': 'Adopted child',
  'stepchild': 'Stepchild',
  'parent': 'Parent',
  'sibling': 'Sibling',
  'grandparent': 'Grandparent',
  'grandchild': 'Grandchild',
  'uncle-aunt': 'Uncle/Aunt',
  'nephew-niece': 'Niece/Nephew',
  'cousin': 'Cousin',
  'friend': 'Friend',
  'colleague': 'Colleague',
  'solicitor': 'Solicitor',
  'accountant': 'Accountant',
  'other': 'Other',
};

const RELATIONSHIP_ORDER: string[] = [
  'spouse',
  'partner',
  'ex-spouse',
  'ex-partner',
  'parent',
  'biological-child',
  'adopted-child',
  'stepchild',
  'sibling',
  'grandparent',
  'grandchild',
  'uncle-aunt',
  'nephew-niece',
  'cousin',
  'friend',
  'colleague',
  'solicitor',
  'accountant',
  'other',
];

export const RELATIONSHIP_OPTIONS: SelectOption[] = RELATIONSHIP_ORDER.map((value) => ({
  label: RELATIONSHIP_LABELS[value],
  value,
}));

export const getRelationshipLabel = (value: string): string => {
  return RELATIONSHIP_LABELS[value] || 'Other';
};
