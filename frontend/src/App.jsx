import { useState, useEffect, useCallback } from 'react';
import StatusIndicator from './components/StatusIndicator';
import UserTable from './components/UserTable';
import UserForm from './components/UserForm';
import { fetchUsers, createUser, updateUser, deleteUser } from './services/api';
import './index.css';

function App() {
  const [backend, setBackend] = useState('go'); // 'go' or 'nestjs'
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchUsers(backend, 1, 100); // Fetch up to 100 users for simplicity
      setUsers(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [backend]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleCreateOrUpdate = async (userData) => {
    try {
      setFormLoading(true);
      setError(null);
      
      if (editingUser) {
        await updateUser(backend, editingUser.id, userData);
      } else {
        await createUser(backend, userData);
      }
      
      setIsModalOpen(false);
      setEditingUser(null);
      await loadUsers();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setError(null);
      await deleteUser(backend, id);
      await loadUsers();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-left">
          <h1>User Management</h1>
          <StatusIndicator backend={backend} />
        </div>
        
        <div className="header-right">
          <div className="backend-selector">
            <label htmlFor="backend">Backend: </label>
            <select 
              id="backend" 
              value={backend} 
              onChange={(e) => setBackend(e.target.value)}
            >
              <option value="go">Go (Port 3000)</option>
              <option value="nestjs">NestJS (Port 3001)</option>
            </select>
          </div>
          <button className="btn btn-primary" onClick={openCreateModal}>
            + Create User
          </button>
        </div>
      </header>

      <main className="app-main">
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="stats-bar">
          Total Users: {users.length}
        </div>

        <UserTable 
          users={users} 
          loading={loading} 
          onEdit={openEditModal} 
          onDelete={handleDelete} 
        />
      </main>

      {isModalOpen && (
        <UserForm 
          user={editingUser} 
          onSubmit={handleCreateOrUpdate} 
          onCancel={closeModal}
          loading={formLoading}
        />
      )}
    </div>
  );
}

export default App;
