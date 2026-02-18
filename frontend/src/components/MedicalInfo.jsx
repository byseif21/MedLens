import { useState } from 'react';
import PropTypes from 'prop-types';
import LoadingSpinner from './LoadingSpinner';
import { useMedicalInfo } from '../hooks/useMedicalInfo';

const MedicalInfoField = ({ label, name, value, onChange, disabled, rows = 2, placeholder }) => (
  <div>
    <label className="label-medical transition-colors">{label}</label>
    <textarea
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
      rows={rows}
      className="input-medical resize-none transition-colors"
      placeholder={placeholder}
    />
  </div>
);

MedicalInfoField.propTypes = {
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool.isRequired,
  rows: PropTypes.number,
  placeholder: PropTypes.string,
};

const MedicalTagField = ({ label, name, value, onChange, disabled, placeholder }) => {
  const [inputValue, setInputValue] = useState('');

  const tags = (value || '')
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);

  const updateValueFromTags = (nextTags) => {
    const nextValue = nextTags.join(', ');
    onChange({ target: { name, value: nextValue } });
  };

  const handleKeyDown = (e) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = inputValue.trim();
      if (!newTag) return;
      if (tags.includes(newTag)) {
        setInputValue('');
        return;
      }
      const nextTags = [...tags, newTag];
      updateValueFromTags(nextTags);
      setInputValue('');
    } else if (e.key === 'Backspace' && !inputValue && tags.length) {
      const nextTags = tags.slice(0, -1);
      updateValueFromTags(nextTags);
    }
  };

  const handleRemoveTag = (tag) => {
    if (disabled) return;
    const nextTags = tags.filter((t) => t !== tag);
    updateValueFromTags(nextTags);
  };

  return (
    <div>
      <label className="label-medical transition-colors">{label}</label>
      <div
        className={`input-medical flex flex-wrap items-center gap-2 min-h-[3rem] ${
          disabled ? 'bg-medical-gray-50 dark:bg-medical-gray-800/50' : ''
        }`}
      >
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-medical-primary/10 dark:bg-medical-primary/20 text-medical-primary dark:text-medical-secondary"
          >
            <span>{tag}</span>
            {!disabled && (
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="ml-1 text-medical-primary/70 dark:text-medical-secondary/70 hover:text-medical-primary dark:hover:text-medical-secondary"
              >
                ×
              </button>
            )}
          </span>
        ))}
        {!disabled && (
          <input
            type="text"
            name={name}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={tags.length ? '' : placeholder}
            className="flex-1 min-w-[120px] border-none bg-transparent outline-none text-sm text-medical-gray-900 dark:text-white placeholder-medical-gray-400 dark:placeholder-medical-gray-500"
          />
        )}
        {disabled && !tags.length && (
          <span className="text-sm text-medical-gray-400 dark:text-medical-gray-500">
            {placeholder}
          </span>
        )}
      </div>
    </div>
  );
};

MedicalTagField.propTypes = {
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool.isRequired,
  placeholder: PropTypes.string,
};

const MedicalInfo = ({
  profile,
  onUpdate,
  readOnly = false,
  targetUserId = null,
  canEditCritical = false,
}) => {
  const {
    isEditing,
    setIsEditing,
    loading,
    formData,
    handleChange,
    handleSave,
    handleCancel,
    critical,
    toggleCritical,
  } = useMedicalInfo(profile, onUpdate, targetUserId, canEditCritical);

  const canEdit = !readOnly;
  const isCritical = Boolean(critical);

  if (loading) {
    return (
      <div className="medical-card">
        <LoadingSpinner text="Saving..." />
      </div>
    );
  }

  return (
    <div
      className={`medical-card ${
        isCritical
          ? 'border-red-300 dark:border-red-700 bg-red-50/40 dark:bg-red-950/10 shadow-[0_0_0_1px_rgba(248,113,113,0.35)]'
          : ''
      }`}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold dark:text-white">Medical Information</h2>
        {canEdit &&
          (!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="btn-medical-secondary text-sm px-4 py-2"
            >
              Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={handleCancel} className="btn-medical-secondary text-sm px-4 py-2">
                Cancel
              </button>
              <button onClick={handleSave} className="btn-medical-primary text-sm px-4 py-2">
                Save
              </button>
            </div>
          ))}
      </div>
      {canEditCritical && isEditing && (
        <div className="mb-4">
          <label className="label-medical transition-colors">Critical patient</label>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              name="is_critical"
              checked={critical}
              onChange={toggleCritical}
              disabled={!isEditing}
              className="h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
            />
            <span className="text-sm text-medical-gray-700 dark:text-medical-gray-200">
              Mark this person as a critical patient (affects Smart Glass alerts)
            </span>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <MedicalInfoField
          label="Health History"
          name="health_history"
          value={formData.health_history}
          onChange={handleChange}
          disabled={!isEditing}
          rows={3}
          placeholder="Brief medical history..."
        />

        <MedicalTagField
          label="Chronic Conditions"
          name="chronic_conditions"
          value={formData.chronic_conditions}
          onChange={handleChange}
          disabled={!isEditing}
          placeholder="Add a condition and press Enter..."
        />

        <MedicalTagField
          label="Allergies"
          name="allergies"
          value={formData.allergies}
          onChange={handleChange}
          disabled={!isEditing}
          placeholder="Add an allergy and press Enter..."
        />

        <MedicalTagField
          label="Current Medications"
          name="current_medications"
          value={formData.current_medications}
          onChange={handleChange}
          disabled={!isEditing}
          placeholder="Add a medication and press Enter..."
        />

        <MedicalTagField
          label="Previous Surgeries"
          name="previous_surgeries"
          value={formData.previous_surgeries}
          onChange={handleChange}
          disabled={!isEditing}
          placeholder="Add a surgery and press Enter..."
        />

        <MedicalInfoField
          label="Emergency Notes"
          name="emergency_notes"
          value={formData.emergency_notes}
          onChange={handleChange}
          disabled={!isEditing}
          placeholder="Important emergency information..."
        />
      </div>
    </div>
  );
};

MedicalInfo.propTypes = {
  profile: PropTypes.object,
  onUpdate: PropTypes.func.isRequired,
  readOnly: PropTypes.bool,
  targetUserId: PropTypes.string,
  canEditCritical: PropTypes.bool,
};

export default MedicalInfo;
