import { useState } from 'react';
import PropTypes from 'prop-types';
import RelationshipSelector from './RelationshipSelector';
import { externalContactSchema, validateWithSchema } from '../utils/validation';

const ExternalContactForm = ({
  onSubmit,
  onCancel,
  initialData = null,
  isEditMode = false,
  isSubmitting: externalIsSubmitting = false,
}) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    phone: initialData?.phone || '',
    address: initialData?.address || '',
    relationship: initialData?.relationship || '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form when initialData changes
  useState(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        phone: initialData.phone || '',
        address: initialData.address || '',
        relationship: initialData.relationship || '',
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleRelationshipChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      relationship: value,
    }));

    if (errors.relationship) {
      setErrors((prev) => ({
        ...prev,
        relationship: '',
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent duplicate submissions
    if (isSubmitting || externalIsSubmitting) {
      return;
    }

    const {
      isValid,
      errors: validationErrors,
      data: sanitizedData,
    } = validateWithSchema(externalContactSchema, formData);

    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({}); // Clear previous errors

    try {
      await onSubmit(sanitizedData);
      // Reset form on success only if not in edit mode
      if (!isEditMode) {
        setFormData({
          name: '',
          phone: '',
          address: '',
          relationship: '',
        });
        setErrors({});
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      // Check if it's a network error
      if (error.message && error.message.includes('network')) {
        setErrors({ submit: 'Network error. Please check your connection and try again.' });
      } else {
        setErrors({ submit: error.message || 'Failed to save contact. Please try again.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitting = isSubmitting || externalIsSubmitting;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Submit Error */}
      {errors.submit && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{errors.submit}</p>
        </div>
      )}

      {/* Name Field */}
      <div>
        <label className="label-medical">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          disabled={submitting}
          className={`input-medical ${errors.name ? 'border-red-500' : ''} disabled:opacity-50 disabled:cursor-not-allowed`}
          placeholder="Full name"
        />
        {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
      </div>

      {/* Phone Field */}
      <div>
        <label className="label-medical">
          Phone Number <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          disabled={submitting}
          className={`input-medical ${errors.phone ? 'border-red-500' : ''} disabled:opacity-50 disabled:cursor-not-allowed`}
          placeholder="+1 (555) 123-4567"
        />
        {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone}</p>}
      </div>

      {/* Address Field */}
      <div>
        <label className="label-medical">Address (Optional)</label>
        <input
          type="text"
          name="address"
          value={formData.address}
          onChange={handleChange}
          disabled={submitting}
          className="input-medical disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder="Street address, city, state"
        />
      </div>

      {/* Relationship Selector */}
      <RelationshipSelector
        value={formData.relationship}
        onChange={handleRelationshipChange}
        required={true}
        error={errors.relationship}
        disabled={submitting}
      />

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="btn-medical-secondary px-6 py-2"
          disabled={submitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn-medical-primary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={submitting}
        >
          {submitting
            ? isEditMode
              ? 'Updating...'
              : 'Adding...'
            : isEditMode
              ? 'Update Contact'
              : 'Add Contact'}
        </button>
      </div>
    </form>
  );
};

ExternalContactForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  initialData: PropTypes.object,
  isEditMode: PropTypes.bool,
  isSubmitting: PropTypes.bool,
};

export default ExternalContactForm;
