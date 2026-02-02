import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { User, X } from 'lucide-react';
import '../styles/glassmorphism.css';

// Fallback user icon SVG component (defined outside render)
const UserIcon = ({ className }) => <User className={className} />;

const AvatarModal = ({ show, onClose, imageUrl, userName }) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (show) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-2xl max-h-[90vh] animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white hover:text-medical-primary transition-colors duration-500"
          aria-label="Close"
        >
          <X className="w-8 h-8" />
        </button>

        <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-white/20">
          <img
            src={imageUrl}
            alt={userName || 'User avatar'}
            className="max-w-full max-h-[80vh] object-contain"
          />
        </div>

        {userName && (
          <div className="mt-4 text-center">
            <p className="text-white text-lg font-semibold">{userName}</p>
          </div>
        )}
      </div>
    </div>
  );
};

AvatarModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  imageUrl: PropTypes.string,
  userName: PropTypes.string,
};

const sizeClasses = {
  sm: 'w-10 h-10',
  md: 'w-14 h-14',
  lg: 'w-20 h-20',
  xl: 'w-28 h-28',
};

const AvatarDisplay = ({
  sizeClass,
  className,
  canInteract,
  onClick,
  onKeyDown,
  showFallback,
  imageUrl,
  userName,
  onImageError,
}) => {
  return (
    <div
      className={`${sizeClass} rounded-full overflow-hidden flex items-center justify-center ${className} ${canInteract ? 'cursor-pointer hover:ring-2 hover:ring-medical-primary transition-all duration-500' : ''}`}
      style={{ aspectRatio: '1 / 1' }}
      onClick={onClick}
      role={canInteract ? 'button' : undefined}
      tabIndex={canInteract ? 0 : undefined}
      onKeyDown={onKeyDown}
    >
      {showFallback ? (
        <div className="w-full h-full flex items-center justify-center bg-medical-primary p-2.5">
          <UserIcon className="w-full h-full text-white" />
        </div>
      ) : (
        <img
          src={imageUrl}
          alt={userName || 'User avatar'}
          className="w-full h-full object-cover"
          onError={onImageError}
        />
      )}
    </div>
  );
};

AvatarDisplay.propTypes = {
  sizeClass: PropTypes.string,
  className: PropTypes.string,
  canInteract: PropTypes.bool,
  onClick: PropTypes.func,
  onKeyDown: PropTypes.func,
  showFallback: PropTypes.bool,
  imageUrl: PropTypes.string,
  userName: PropTypes.string,
  onImageError: PropTypes.func,
};

const useProfileAvatar = ({ imageUrl, size, clickable }) => {
  const [imageError, setImageError] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const sizeClass = sizeClasses[size] || sizeClasses.md;
  const showFallback = !imageUrl || imageError;
  const canInteract = clickable && !showFallback;

  useEffect(() => {
    if (imageError) {
      setImageError(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUrl]);

  const handleImageError = () => setImageError(true);

  const handleClick = () => {
    if (canInteract) {
      setShowModal(true);
    }
  };

  const handleKeyDown = (e) => {
    const isActivationKey = e.key === 'Enter' || e.key === ' ';
    if (canInteract && isActivationKey) {
      e.preventDefault();
      handleClick();
    }
  };

  return {
    sizeClass,
    showFallback,
    canInteract,
    showModal,
    setShowModal,
    handleImageError,
    handleClick,
    handleKeyDown,
  };
};

const ProfileAvatar = ({ imageUrl, userName, size = 'md', className = '', clickable = true }) => {
  const {
    sizeClass,
    showFallback,
    canInteract,
    showModal,
    setShowModal,
    handleImageError,
    handleClick,
    handleKeyDown,
  } = useProfileAvatar({ imageUrl, size, clickable });

  return (
    <>
      <AvatarDisplay
        sizeClass={sizeClass}
        className={className}
        canInteract={canInteract}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        showFallback={showFallback}
        imageUrl={imageUrl}
        userName={userName}
        onImageError={handleImageError}
      />

      <AvatarModal
        show={showModal && !showFallback}
        onClose={() => setShowModal(false)}
        imageUrl={imageUrl}
        userName={userName}
      />
    </>
  );
};

ProfileAvatar.propTypes = {
  imageUrl: PropTypes.string,
  userName: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
  className: PropTypes.string,
  clickable: PropTypes.bool,
};

export default ProfileAvatar;
