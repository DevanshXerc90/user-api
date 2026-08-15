export const getApiUrl = (backend) => {
  return backend === 'nestjs' 
    ? import.meta.env.VITE_NEST_API_URL 
    : import.meta.env.VITE_GO_API_URL;
};

export const fetchUsers = async (backend, page = 1, limit = 10) => {
  const url = `${getApiUrl(backend)}/users?page=${page}&limit=${limit}`;
  const response = await fetch(url);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Failed to fetch users');
  }
  return response.json();
};

export const fetchUserById = async (backend, id) => {
  const url = `${getApiUrl(backend)}/users/${id}`;
  const response = await fetch(url);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Failed to fetch user');
  }
  return response.json();
};

export const createUser = async (backend, userData) => {
  const url = `${getApiUrl(backend)}/users`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Failed to create user');
  }
  return response.json();
};

export const updateUser = async (backend, id, userData) => {
  const url = `${getApiUrl(backend)}/users/${id}`;
  const response = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Failed to update user');
  }
  return response.json();
};

export const deleteUser = async (backend, id) => {
  const url = `${getApiUrl(backend)}/users/${id}`;
  const response = await fetch(url, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Failed to delete user');
  }
};
