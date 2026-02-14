import PropTypes from 'prop-types';
import { User, UserX, Check } from 'lucide-react';

const EmptyState = () => (
  <div className="p-8 text-center transition-colors">
    <UserX className="w-12 h-12 mx-auto mb-3 text-medical-gray-300 dark:text-medical-gray-700" />
    <p className="text-medical-gray-600 dark:text-medical-gray-400">No users found</p>
    <p className="text-sm text-medical-gray-500 dark:text-medical-gray-400 mt-1">
      Try a different search term
    </p>
  </div>
);

const UserStatusBadge = ({ status, isSelected, onSelect, user }) => {
  if (status === 'connected') {
    return (
      <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-full whitespace-nowrap transition-colors">
        <Check className="w-3.5 h-3.5" />
        Connected
      </span>
    );
  }

  if (status === 'pending_sent') {
    return (
      <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-sm rounded-full whitespace-nowrap transition-colors">
        Request sent
      </span>
    );
  }

  if (status === 'pending_received') {
    return (
      <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm rounded-full whitespace-nowrap transition-colors">
        Request received
      </span>
    );
  }

  if (isSelected) {
    return (
      <span className="px-3 py-1 bg-medical-primary text-white text-sm rounded-full whitespace-nowrap transition-colors">
        Selected
      </span>
    );
  }

  return (
    <button
      onClick={() => onSelect(user)}
      className="btn-medical-primary text-sm px-4 py-2 whitespace-nowrap"
    >
      Select
    </button>
  );
};

UserStatusBadge.propTypes = {
  status: PropTypes.string.isRequired,
  isSelected: PropTypes.bool.isRequired,
  onSelect: PropTypes.func.isRequired,
  user: PropTypes.object.isRequired,
};

const UserItem = ({ user, selectedUser, onSelect }) => {
  const isSelected = selectedUser?.id === user.id;
  const status = user.connection_status;
  const isUnavailable = status !== 'none';

  return (
    <div
      className={`p-4 border-b border-medical-gray-200 dark:border-medical-gray-800 last:border-b-0 transition-colors ${
        isSelected
          ? 'bg-medical-light dark:bg-medical-primary/10'
          : isUnavailable
            ? 'bg-medical-gray-50 dark:bg-medical-gray-800/30'
            : 'hover:bg-medical-gray-50 dark:hover:bg-medical-gray-800'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-full bg-medical-primary/10 dark:bg-medical-primary/20 flex items-center justify-center shrink-0">
            <User className="w-6 h-6 text-medical-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-medical-dark dark:text-white truncate transition-colors">
              {user.name}
            </p>
            <p className="text-xs text-medical-gray-500 dark:text-medical-gray-400 font-mono truncate transition-colors">
              ID: {user.id.substring(0, 8).toUpperCase()}
            </p>
            {user.email && (
              <p className="text-sm text-medical-gray-400 dark:text-medical-gray-400 truncate transition-colors">
                {user.email}
              </p>
            )}
          </div>
        </div>
        <div className="shrink-0">
          <UserStatusBadge
            status={status}
            isSelected={isSelected}
            onSelect={onSelect}
            user={user}
          />
        </div>
      </div>
    </div>
  );
};

UserItem.propTypes = {
  user: PropTypes.object.isRequired,
  selectedUser: PropTypes.object,
  onSelect: PropTypes.func.isRequired,
};

const UserSearchResults = ({
  results,
  selectedUser,
  onSelect,
  loading,
  hasSearched,
  searchQuery,
}) => {
  const shouldRender = hasSearched && !loading && searchQuery.length >= 2;

  if (!shouldRender) {
    return null;
  }

  return (
    <div className="border border-medical-gray-200 dark:border-medical-gray-800 rounded-lg overflow-hidden transition-colors">
      {results.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="max-h-80 overflow-y-auto">
          {results.map((user) => (
            <UserItem key={user.id} user={user} selectedUser={selectedUser} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
};

UserSearchResults.propTypes = {
  results: PropTypes.array.isRequired,
  selectedUser: PropTypes.object,
  onSelect: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  hasSearched: PropTypes.bool.isRequired,
  searchQuery: PropTypes.string.isRequired,
};

export default UserSearchResults;
