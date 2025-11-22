import PropTypes from 'prop-types';

const RELATIONSHIP_TYPES = [
  'Father',
  'Mother',
  'Brother',
  'Sister',
  'Son',
  'Daughter',
  'Spouse',
  'Partner',
  'Friend',
  'Doctor',
  'Caregiver',
  'Neighbor',
  'Other',
];

const RelationshipSelector = ({ value, onChange, required = true, error, disabled = false }) => {
  return (
    <div>
      <label className="label-medical">
        Relationship {required && <span className="text-red-500">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`input-medical ${error ? 'border-red-500' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        required={required}
        disabled={disabled}
      >
        <option value="">Select relationship</option>
        {RELATIONSHIP_TYPES.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  );
};

RelationshipSelector.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  required: PropTypes.bool,
  error: PropTypes.string,
  disabled: PropTypes.bool,
};

export default RelationshipSelector;
