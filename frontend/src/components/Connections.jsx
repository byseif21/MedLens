import { useState } from 'react';
import PropTypes from 'prop-types';
import { useConnections } from '../hooks/useConnections';
import ConnectionCard from './ConnectionCard';
import AddConnectionModal from './AddConnectionModal';
import LoadingSpinner from './LoadingSpinner';
import {
  UserPlus,
  CheckCircle,
  AlertCircle,
  Clock,
  Link as LinkIcon,
  Globe,
  Users,
} from 'lucide-react';

const PendingRequestsList = ({ requests, onAccept, onReject, processingRequestId }) => {
  if (requests.length === 0) return null;

  return (
    <div className="mb-8 p-4 bg-medical-light/30 dark:bg-medical-gray-800/50 border border-medical-primary/20 dark:border-medical-primary/10 rounded-xl">
      <h3 className="text-lg font-semibold text-medical-dark dark:text-white mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5 text-medical-primary" />
        Pending Connection Requests ({requests.length})
      </h3>
      <div className="space-y-3">
        {requests.map((request) => {
          const isProcessing = processingRequestId === request.id;
          return (
            <div
              key={request.id}
              className="flex items-center justify-between p-3 bg-white dark:bg-medical-gray-800 border border-medical-gray-200 dark:border-medical-gray-700 rounded-lg shadow-sm"
            >
              <div>
                <p className="font-medium text-medical-dark dark:text-white">
                  {request.sender_name}
                </p>
                <p className="text-xs text-medical-gray-500 dark:text-medical-gray-400">
                  {request.sender_email}
                </p>
                <p className="text-sm text-medical-primary font-medium mt-1">
                  Wants to connect as: {request.relationship}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => onAccept(request.id)}
                  disabled={isProcessing}
                  className={`px-3 py-1.5 text-white text-sm font-medium rounded-md transition-colors ${
                    isProcessing
                      ? 'bg-medical-primary/50 cursor-not-allowed'
                      : 'bg-medical-primary hover:bg-medical-primary-dark'
                  }`}
                >
                  {isProcessing ? 'Accepting...' : 'Accept'}
                </button>
                <button
                  onClick={() => onReject(request.id)}
                  disabled={isProcessing}
                  className={`px-3 py-1.5 text-medical-gray-700 dark:text-medical-gray-300 text-sm font-medium rounded-md transition-colors ${
                    isProcessing
                      ? 'bg-medical-gray-100/50 dark:bg-medical-gray-800/50 text-medical-gray-400 cursor-not-allowed'
                      : 'bg-medical-gray-100 dark:bg-medical-gray-700 hover:bg-medical-gray-200 dark:hover:bg-medical-gray-600'
                  }`}
                >
                  Decline
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

PendingRequestsList.propTypes = {
  requests: PropTypes.array.isRequired,
  onAccept: PropTypes.func.isRequired,
  onReject: PropTypes.func.isRequired,
  processingRequestId: PropTypes.string,
};

const ConnectionsSection = ({ title, icon: Icon, connections, type, onEdit, onRemove }) => {
  if (connections.length === 0) return null;

  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-medical-dark dark:text-white mb-4 flex items-center gap-2">
        <Icon
          className={`w-5 h-5 ${type === 'linked' ? 'text-medical-primary' : 'text-medical-gray-600 dark:text-medical-gray-400'}`}
        />
        {title} ({connections.length})
      </h3>
      <div className="grid md:grid-cols-2 gap-4">
        {connections.map((connection) => (
          <ConnectionCard
            key={connection.id}
            connection={connection}
            type={type}
            onEdit={onEdit}
            onRemove={onRemove}
            showActions={true}
          />
        ))}
      </div>
    </div>
  );
};

ConnectionsSection.propTypes = {
  title: PropTypes.string.isRequired,
  icon: PropTypes.elementType.isRequired,
  connections: PropTypes.array.isRequired,
  type: PropTypes.string.isRequired,
  onEdit: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
};

const EmptyState = ({ onAdd }) => (
  <div className="text-center py-12 text-medical-gray-500 dark:text-medical-gray-400">
    <Users className="w-16 h-16 mx-auto mb-4 text-medical-gray-300 dark:text-medical-gray-700" />
    <p className="mb-4">No connections added yet</p>
    <button onClick={onAdd} className="btn-medical-primary px-6 py-2">
      Add Your First Connection
    </button>
  </div>
);

EmptyState.propTypes = {
  onAdd: PropTypes.func.isRequired,
};

const RemoveConfirmationModal = ({ isOpen, target, isBusy, onConfirm, onCancel }) => {
  if (!isOpen || !target) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isBusy) {
          onCancel();
        }
      }}
    >
      <div className="bg-white dark:bg-medical-gray-900 rounded-lg shadow-lg shadow-medical-primary/15 w-full max-w-md overflow-hidden animate-slide-down border border-transparent dark:border-medical-gray-800 transition-colors">
        <div className="p-6 border-b border-medical-gray-200 dark:border-medical-gray-800">
          <h3 className="text-xl font-semibold text-medical-dark dark:text-white">
            Remove Connection
          </h3>
          <p className="text-sm text-medical-gray-600 dark:text-medical-gray-400 mt-2">
            Are you sure you want to remove{' '}
            <span className="font-medium text-medical-dark dark:text-white">
              {target.name || target.connected_user?.name}
            </span>
            ? This action cannot be undone.
          </p>
        </div>
        <div className="flex justify-end gap-3 p-4 border-t border-medical-gray-200 dark:border-medical-gray-800 transition-colors">
          <button
            onClick={onCancel}
            disabled={isBusy}
            className="btn-medical-secondary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isBusy}
            className="btn-medical-primary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isBusy ? 'Removing...' : 'Remove'}
          </button>
        </div>
      </div>
    </div>
  );
};

RemoveConfirmationModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  target: PropTypes.object,
  isBusy: PropTypes.bool.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

const Connections = ({ targetUserId }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  const {
    loading,
    processingRequestId,
    linkedConnections,
    externalContacts,
    pendingRequests,
    error,
    successMessage,
    userId,
    acceptRequest,
    rejectRequest,
    addConnection,
    updateContact,
    removeConnection,
    allConnectionsCount,
  } = useConnections(targetUserId);

  const handleAddSubmit = async (data) => {
    const success = await addConnection(data);
    if (success) {
      setShowAddModal(false);
      setEditingContact(null);
    }
  };

  const handleUpdateSubmit = async (contactId, updatedData, connectionType) => {
    const success = await updateContact(contactId, updatedData, connectionType);
    if (success) {
      setShowAddModal(false);
      setEditingContact(null);
    }
  };

  const handleEditContact = (contact) => {
    setEditingContact(contact);
    setShowAddModal(true);
  };

  const handleRemoveClick = (connection) => {
    setConfirmTarget(connection);
    setConfirmOpen(true);
  };

  const handleConfirmRemove = async () => {
    if (!confirmTarget || confirmBusy) return;
    setConfirmBusy(true);
    const success = await removeConnection(confirmTarget.id);
    setConfirmBusy(false);
    if (success) {
      setConfirmOpen(false);
      setConfirmTarget(null);
    }
  };

  if (loading && allConnectionsCount === 0) {
    return (
      <div className="medical-card dark:bg-medical-gray-800 dark:border-medical-gray-700 transition-colors">
        <LoadingSpinner text="Loading connections..." />
      </div>
    );
  }

  return (
    <div className="medical-card dark:bg-medical-gray-800 dark:border-medical-gray-700 transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl font-semibold dark:text-white">Family Connections</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-medical-primary text-sm px-4 py-2 flex items-center gap-2 w-full sm:w-auto justify-center"
        >
          <UserPlus className="w-5 h-5" />
          Add Connection
        </button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 text-green-800 dark:text-green-300 rounded-lg flex items-center gap-2 transition-colors">
          <CheckCircle className="w-5 h-5" />
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-red-800 dark:text-red-300 rounded-lg flex items-center gap-2 transition-colors">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <PendingRequestsList
        requests={pendingRequests}
        onAccept={acceptRequest}
        onReject={rejectRequest}
        processingRequestId={processingRequestId}
      />

      <ConnectionsSection
        title="Linked Connections"
        icon={LinkIcon}
        connections={linkedConnections}
        type="linked"
        onEdit={handleEditContact}
        onRemove={handleRemoveClick}
      />

      <ConnectionsSection
        title="External Contacts"
        icon={Globe}
        connections={externalContacts}
        type="external"
        onEdit={handleEditContact}
        onRemove={handleRemoveClick}
      />

      {allConnectionsCount === 0 && !loading && <EmptyState onAdd={() => setShowAddModal(true)} />}

      <AddConnectionModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingContact(null);
        }}
        onAddConnection={handleAddSubmit}
        onUpdateConnection={handleUpdateSubmit}
        editingContact={editingContact}
        currentUserId={userId}
        existingConnections={linkedConnections.map((c) => c.connected_user?.id).filter(Boolean)}
      />

      <RemoveConfirmationModal
        isOpen={confirmOpen}
        target={confirmTarget}
        isBusy={confirmBusy}
        onConfirm={handleConfirmRemove}
        onCancel={() => {
          if (!confirmBusy) {
            setConfirmOpen(false);
            setConfirmTarget(null);
          }
        }}
      />
    </div>
  );
};

export default Connections;
