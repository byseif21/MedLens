import { useState } from 'react';
import PropTypes from 'prop-types';
import { updateRelatives } from '../services/api';
import RelativeCard from './RelativeCard';
import LoadingSpinner from './LoadingSpinner';

const Connections = ({ profile, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [relatives, setRelatives] = useState(profile?.relatives || []);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRelative, setEditingRelative] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    relation: '',
    phone: '',
    address: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddRelative = () => {
    if (!formData.name || !formData.relation || !formData.phone) {
      alert('Please fill in all required fields');
      return;
    }

    const newRelative = {
      id: Date.now(),
      ...formData,
    };

    setRelatives([...relatives, newRelative]);
    setFormData({ name: '', relation: '', phone: '', address: '' });
    setShowAddForm(false);
  };

  const handleEditRelative = (relative) => {
    setEditingRelative(relative);
    setFormData(relative);
    setShowAddForm(true);
  };

  const handleUpdateRelative = () => {
    if (!formData.name || !formData.relation || !formData.phone) {
      alert('Please fill in all required fields');
      return;
    }

    setRelatives(
      relatives.map((r) => (r.id === editingRelative.id ? { ...editingRelative, ...formData } : r))
    );
    setFormData({ name: '', relation: '', phone: '', address: '' });
    setEditingRelative(null);
    setShowAddForm(false);
  };

  const handleDeleteRelative = (id) => {
    if (confirm('Are you sure you want to delete this connection?')) {
      setRelatives(relatives.filter((r) => r.id !== id));
    }
  };

  const handleSave = async () => {
    setLoading(true);
    const userId = localStorage.getItem('user_id');
    const result = await updateRelatives(userId, relatives);

    if (result.success) {
      setIsEditing(false);
      onUpdate();
    } else {
      alert('Failed to update: ' + result.error);
    }
    setLoading(false);
  };

  const handleCancel = () => {
    setRelatives(profile?.relatives || []);
    setIsEditing(false);
    setShowAddForm(false);
    setEditingRelative(null);
    setFormData({ name: '', relation: '', phone: '', address: '' });
  };

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
        <h2 className="text-2xl font-semibold">Family Connections</h2>
        {!isEditing ? (
          <button onClick={() => setIsEditing(true)} className="btn-medical-secondary text-sm px-4 py-2">
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
        )}
      </div>

      {isEditing && !showAddForm && (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full mb-6 py-3 border-2 border-dashed border-medical-primary text-medical-primary rounded-lg hover:bg-medical-light transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New Connection
        </button>
      )}

      {showAddForm && (
        <div className="mb-6 p-6 bg-medical-light border border-medical-primary/20 rounded-lg">
          <h3 className="font-semibold text-medical-dark mb-4">
            {editingRelative ? 'Edit Connection' : 'Add New Connection'}
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label-medical">Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input-medical"
                placeholder="Full name"
              />
            </div>
            <div>
              <label className="label-medical">Relation *</label>
              <select name="relation" value={formData.relation} onChange={handleChange} className="input-medical">
                <option value="">Select relation</option>
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Brother">Brother</option>
                <option value="Sister">Sister</option>
                <option value="Spouse">Spouse</option>
                <option value="Son">Son</option>
                <option value="Daughter">Daughter</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="label-medical">Phone *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="input-medical"
                placeholder="Phone number"
              />
            </div>
            <div>
              <label className="label-medical">Address (Optional)</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="input-medical"
                placeholder="Address"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => {
                setShowAddForm(false);
                setEditingRelative(null);
                setFormData({ name: '', relation: '', phone: '', address: '' });
              }}
              className="btn-medical-secondary text-sm px-4 py-2"
            >
              Cancel
            </button>
            <button
              onClick={editingRelative ? handleUpdateRelative : handleAddRelative}
              className="btn-medical-primary text-sm px-4 py-2"
            >
              {editingRelative ? 'Update' : 'Add'}
            </button>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {relatives.length === 0 ? (
          <div className="md:col-span-2 text-center py-12 text-medical-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-medical-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p>No connections added yet</p>
          </div>
        ) : (
          relatives.map((relative) => (
            <RelativeCard
              key={relative.id}
              relative={relative}
              onEdit={handleEditRelative}
              onDelete={handleDeleteRelative}
              isEditing={isEditing}
            />
          ))
        )}
      </div>
    </div>
  );
};

Connections.propTypes = {
  profile: PropTypes.object,
  onUpdate: PropTypes.func.isRequired,
};

export default Connections;
