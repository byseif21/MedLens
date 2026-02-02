import PropTypes from 'prop-types';
import '../styles/glassmorphism.css';

// --- Sub-components ---

const InfoItem = ({ label, value, valueClassName = 'text-sm text-white' }) => {
  if (!value) return null;
  return (
    <div className="glass-card-dark p-3 rounded-lg">
      <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</div>
      <div className={valueClassName}>{value}</div>
    </div>
  );
};

InfoItem.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  valueClassName: PropTypes.string,
};

const PersonHeader = ({ confidence }) => (
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-xl font-bold text-glow-pink">Person Recognized</h3>
    {confidence !== undefined && (
      <div className="glass-card-dark px-3 py-1 rounded-full">
        <span className="text-sm font-semibold neon-gradient-text">
          {(confidence * 100).toFixed(1)}% Match
        </span>
      </div>
    )}
  </div>
);

PersonHeader.propTypes = {
  confidence: PropTypes.number,
};

const PersonAvatar = ({ displayImage, displayName }) => {
  if (!displayImage) return null;
  return (
    <div className="mb-4 flex justify-center">
      <div className="glow-border-blue rounded-lg overflow-hidden w-32 h-32">
        <img
          src={displayImage}
          alt={displayName || 'User'}
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
};

PersonAvatar.propTypes = {
  displayImage: PropTypes.string,
  displayName: PropTypes.string,
};

const PersonDetails = ({ user }) => {
  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-3">
      <InfoItem label="Name" value={user?.name} valueClassName="text-lg font-semibold text-white" />
      <InfoItem
        label="Job / Role"
        value={user?.job}
        valueClassName="text-lg font-semibold text-glow-blue"
      />
      <InfoItem label="Email" value={user?.email} valueClassName="text-sm text-white break-all" />
      <InfoItem label="Phone" value={user?.phone} />
      <InfoItem label="Additional Information" value={user?.additional_info} />
      <InfoItem label="Registered" value={formatDate(user?.created_at)} />
    </div>
  );
};

PersonDetails.propTypes = {
  user: PropTypes.shape({
    name: PropTypes.string,
    job: PropTypes.string,
    email: PropTypes.string,
    phone: PropTypes.string,
    additional_info: PropTypes.string,
    created_at: PropTypes.string,
  }),
};

// --- Main Component ---

const PersonCard = ({ user, confidence, imageUrl }) => {
  const displayImage = imageUrl || user?.image_url;
  const displayName = user?.name;

  return (
    <div className="glass-card hover-lift p-6 max-w-md mx-auto">
      <PersonHeader confidence={confidence} />
      <PersonAvatar displayImage={displayImage} displayName={displayName} />
      <PersonDetails user={user} />

      {/* Decorative Glow Effect */}
      <div className="mt-4 h-1 rounded-full neon-gradient-bg pulse-glow"></div>
    </div>
  );
};

PersonCard.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    job: PropTypes.string,
    email: PropTypes.string,
    phone: PropTypes.string,
    additional_info: PropTypes.string,
    image_url: PropTypes.string,
    created_at: PropTypes.string,
  }),
  confidence: PropTypes.number,
  imageUrl: PropTypes.string,
};

export default PersonCard;
