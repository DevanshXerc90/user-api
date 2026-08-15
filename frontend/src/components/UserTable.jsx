export default function UserTable({ users, loading, onEdit, onDelete }) {
  if (loading) {
    return <div className="loading-state">Loading users...</div>;
  }

  if (!users || users.length === 0) {
    return <div className="empty-state">No users found. Create one to get started.</div>;
  }

  return (
    <div className="table-container">
      <table className="user-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>DOB</th>
            <th>Age</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.name}</td>
              <td>{user.dob}</td>
              <td>{user.age ?? '-'}</td>
              <td>
                <div className="action-buttons">
                  <button 
                    className="btn btn-secondary btn-small"
                    onClick={() => onEdit(user)}
                  >
                    Edit
                  </button>
                  <button 
                    className="btn btn-danger btn-small"
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to delete ${user.name}?`)) {
                        onDelete(user.id);
                      }
                    }}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
