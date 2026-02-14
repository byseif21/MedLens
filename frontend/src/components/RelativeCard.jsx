import PropTypes from 'prop-types';
import { Phone, MapPin, Edit2, Trash2 } from 'lucide-react';

const RelativeCard = ({ relative, onEdit, onDelete, isEditing }) => {
  return (
    <div className="medical-card hover:shadow-xl hover:shadow-medical-primary/25 dark:hover:shadow-lg dark:hover:shadow-medical-primary/20 transition-all duration-500 ease-in-out">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 sm:gap-0">
        <div className="flex-1 w-full">
          <h3 className="font-semibold text-medical-dark dark:text-white text-lg transition-colors">
            {relative.name}
          </h3>
          <p className="text-medical-primary text-sm font-medium mt-1">{relative.relation}</p>
          <div className="mt-3 space-y-1">
            <p className="text-medical-gray-600 dark:text-medical-gray-400 text-sm flex items-center gap-2 transition-colors">
              <Phone className="w-4 h-4" />
              {relative.phone}
            </p>
            {relative.address && (
              <p className="text-medical-gray-600 dark:text-medical-gray-400 text-sm flex items-center gap-2 transition-colors">
                <MapPin className="w-4 h-4" />
                {relative.address}
              </p>
            )}
          </div>
        </div>
        {isEditing && (
          <div className="flex gap-2 sm:ml-4 flex-shrink-0 self-end sm:self-start">
            <button
              onClick={() => onEdit(relative)}
              className="p-2 text-medical-primary dark:text-medical-secondary hover:bg-medical-primary/10 dark:hover:bg-medical-secondary/10 rounded-lg transition-all hover:scale-110 active:scale-95"
            >
              <Edit2 className="w-5 h-5" />
            </button>
            <button
              onClick={() => onDelete(relative.id)}
              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all hover:scale-110 active:scale-95"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

RelativeCard.propTypes = {
  relative: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string.isRequired,
    relation: PropTypes.string.isRequired,
    phone: PropTypes.string.isRequired,
    address: PropTypes.string,
  }).isRequired,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  isEditing: PropTypes.bool,
};

export default RelativeCard;
