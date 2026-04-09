/**
 * RadioGroup Component Stories
 * 
 * Storybook stories for the RadioGroup component
 * 
 * NOTE: Storybook for React Native requires Node.js 20.19+
 * This file is ready for when Storybook is configured.
 * 
 * @module components/ui/RadioGroup.stories
 */

import React, { useState } from 'react';
import { View } from 'react-native';
import { RadioGroup, RadioGroupProps } from './RadioGroup';

// Story metadata (Storybook format)
export default {
  title: 'UI/RadioGroup',
  component: RadioGroup,
  parameters: {
    docs: {
      description: {
        component: 'A radio button group for single-choice selection. Built manually for full control and proper circle rendering.',
      },
    },
  },
};

/**
 * Wrapper component to manage state in stories
 */
const RadioGroupWrapper = (props: Omit<RadioGroupProps, 'value' | 'onChange'>) => {
  const [value, setValue] = useState('');
  
  return (
    <View style={{ padding: 16 }}>
      <RadioGroup {...props} value={value} onChange={setValue} />
    </View>
  );
};

/**
 * Default story - basic usage
 */
export const Default = () => (
  <RadioGroupWrapper
    label="Will Type"
    options={[
      { label: 'Simple Will', value: 'simple' },
      { label: 'Complex Will', value: 'complex' },
    ]}
  />
);

/**
 * Multiple options
 */
export const MultipleOptions = () => (
  <RadioGroupWrapper
    label="What's your relationship status?"
    options={[
      { label: 'Married', value: 'married' },
      { label: 'Civil Partnership', value: 'civil-partnership' },
      { label: 'Living with Partner', value: 'living-with-partner' },
      { label: 'Single', value: 'single' },
      { label: 'Divorced', value: 'divorced' },
      { label: 'Widowed', value: 'widowed' },
    ]}
  />
);

/**
 * Yes/No/Not Sure pattern
 */
export const YesNoNotSure = () => (
  <RadioGroupWrapper
    label="Are you domiciled in the UK?"
    options={[
      { label: 'Yes', value: 'yes' },
      { label: 'No', value: 'no' },
      { label: 'Not sure', value: 'not-sure' },
    ]}
  />
);

/**
 * Disabled state
 */
export const Disabled = () => (
  <RadioGroupWrapper
    label="Locked Selection"
    options={[
      { label: 'Option 1', value: 'option1' },
      { label: 'Option 2', value: 'option2' },
    ]}
    disabled={true}
  />
);

/**
 * Pre-selected value
 */
export const PreSelected = () => {
  const [value, setValue] = useState('yes');
  
  return (
    <View style={{ padding: 16 }}>
      <RadioGroup
        label="Pre-selected Example"
        value={value}
        onChange={setValue}
        options={[
          { label: 'Yes', value: 'yes' },
          { label: 'No', value: 'no' },
        ]}
      />
    </View>
  );
};


