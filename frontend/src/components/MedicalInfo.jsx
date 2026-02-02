import PropTypes from 'prop-types';
import LoadingSpinner from './LoadingSpinner';
import { useMedicalInfo } from '../hooks/useMedicalInfo';

const MedicalInfoField = ({ label, name, value, onChange, disabled, rows = 2, placeholder }) => (
  <div>
    <label className="label-medical">{label}</label>
    <textarea
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
      rows={rows}
      className="input-medical disabled:bg-medical-gray-50 disabled:cursor-not-allowed resize-none"
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

const MedicalInfo = ({ profile, onUpdate, readOnly = false, targetUserId = null }) => {
  const { isEditing, setIsEditing, loading, formData, handleChange, handleSave, handleCancel } =
    useMedicalInfo(profile, onUpdate, targetUserId);

  const canEdit = !readOnly;

  if (loading) {
    return (
      <div className="medical-card">
        <LoadingSpinner text="Saving..." />
      </div>
    );
  }

  return (
    <div className="medical-card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Medical Information</h2>
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

        <MedicalInfoField
          label="Chronic Conditions"
          name="chronic_conditions"
          value={formData.chronic_conditions}
          onChange={handleChange}
          disabled={!isEditing}
          placeholder="List any chronic conditions..."
        />

        <MedicalInfoField
          label="Allergies"
          name="allergies"
          value={formData.allergies}
          onChange={handleChange}
          disabled={!isEditing}
          placeholder="List any allergies..."
        />

        <MedicalInfoField
          label="Current Medications"
          name="current_medications"
          value={formData.current_medications}
          onChange={handleChange}
          disabled={!isEditing}
          rows={3}
          placeholder="List current medications..."
        />

        <MedicalInfoField
          label="Previous Surgeries"
          name="previous_surgeries"
          value={formData.previous_surgeries}
          onChange={handleChange}
          disabled={!isEditing}
          placeholder="List previous surgeries..."
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
};

export default MedicalInfo;
