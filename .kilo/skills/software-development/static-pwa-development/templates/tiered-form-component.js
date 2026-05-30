// Template for implementing tiered field rendering in React components
// Based on the pattern used in CheckinForm.jsx for Smart Fitness Coach

import React from 'react';
import { CHECKIN_TIERS } from '../../config/constants.js';

// Helper function to check if a field belongs to the current tier
function isFieldInTier(field, tier) {
  return CHECKIN_TIERS[tier]?.fields.includes(field) ?? false;
}

// Example usage in a form component
export default function TieredFormExample() {
  // In actual implementation, these would come from Zustand store
  const { checkinTier } = useAppStore(); 
  const [formValues, setFormValues] = React.useState({
    // Initialize with your form fields
    field1: '',
    field2: '',
    field3: '',
    // ... other fields
  });

  // Handler function example
  const handleChange = (field, value) => {
    setFormValues(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="tiered-form">
      {/* Conditionally render fields based on tier */}
      {isFieldInTier('field1', checkinTier) && (
        <div className="form-field">
          <label>Field 1 Label</label>
          <input
            type="text"
            value={formValues.field1 || ''}
            onChange={(e) => handleChange('field1', e.target.value)}
          />
        </div>
      )}
      
      {isFieldInTier('field2', checkinTier) && (
        <div className="form-field">
          <label>Field 2 Label</label>
          <input
            type="number"
            value={formValues.field2 || ''}
            onChange={(e) => handleChange('field2', e.target.value)}
          />
        </div>
      )}
      
      {isFieldInTier('field3', checkinTier) && (
        <div className="form-field">
          <label>Field 3 Label</label>
          <select
            value={formValues.field3}
            onChange={(e) => handleChange('field3', e.target.value)}
          >
            {/* Options */}
          </select>
        </div>
      )}
      
      {/* Add more conditional fields as needed */}
      
      {/* Submit button with tier-aware validation */}
      <button 
        onClick={handleSubmit}
        disabled={!isFormValid()}
      >
        Submit
      </button>
    </div>
  );
}

// Validation function that only checks fields in current tier
function isFormValid() {
  const errors = [];
  
  // Only validate fields that are in the current tier
  if (isFieldInTier('field1', checkinTier) && !formValues.field1) {
    errors.push('Field 1 is required');
  }
  
  if (isFieldInTier('field2', checkinTier) && (formValues.field2 === '' || formValues.field2 <= 0)) {
    errors.push('Field 2 must be a positive number');
  }
  
  // Add more tier-aware validations
  
  return errors.length === 0;
}

// Alternative approach: Dynamic field rendering with field configuration
export function DynamicTieredForm() {
  const { checkinTier } = useAppStore();
  const [formValues, setFormValues] = React.useState({});
  
  // Define field configuration with metadata
  const fieldConfig = [
    {
      id: 'field1',
      label: 'Field 1',
      type: 'text',
      // Add any tier-specific properties
      tiers: ['full', 'medium', 'light'] // which tiers this field appears in
    },
    {
      id: 'field2',
      label: 'Field 2',
      type: 'number',
      tiers: ['full', 'medium'] // only in full and medium tiers
    },
    {
      id: 'field3',
      label: 'Field 3',
      type: 'select',
      options: ['Option A', 'Option B', 'Option C'],
      tiers: ['light', 'medium'] // only in light and medium tiers
    }
    // ... more field configurations
  ];
  
  // Filter fields based on current tier
  const visibleFields = fieldConfig.filter(field => 
    field.tiers.includes(checkinTier)
  );
  
  const handleChange = (fieldId, value) => {
    setFormValues(prev => ({ 
      ...prev, 
      [fieldId]: value 
    }));
  };
  
  return (
    <div className="dynamic-tiered-form">
      {visibleFields.map(field => (
        <div key={field.id} className="form-field">
          <label>{field.label}</label>
          {field.type === 'text' && (
            <input
              type="text"
              value={formValues.field.id || ''}
              onChange={(e) => handleChange(field.id, e.target.value)}
            />
          )}
          {field.type === 'number' && (
            <input
              type="number"
              value={formValues.field.id || ''}
              onChange={(e) => handleChange(field.id, e.target.value)}
            />
          )}
          {field.type === 'select' && (
            <select
              value={formValues.field.id}
              onChange={(e) => handleChange(field.id, e.target.value)}
            >
              {field.options?.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          )}
          {/* Add other input types as needed */}
        </div>
      ))}
      
      <button 
        onClick={handleSubmit}
        disabled={!isFormValid()}
      >
        Submit
      </button>
    </div>
  );
}