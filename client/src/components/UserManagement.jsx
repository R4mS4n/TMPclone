  import React, { useState, useEffect } from 'react';
  import { motion, AnimatePresence } from 'framer-motion';
  import { useNotification } from '../contexts/NotificationContext';

  const API_BASE = "http://localhost:5000/api";

  const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [showUserModal, setShowUserModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingUser, setEditingUser] = useState({ user_id: null, username: '', mail: '' });
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const { notifySuccess, notifyError, confirm } = useNotification();

    const baseBtn = "px-4 py-2 rounded-md transition-colors";
    const primaryBtn = `${baseBtn} bg-primary hover:bg-primary-focus text-primary-content`;
    const secondaryBtn = `${baseBtn} bg-base-300 hover:bg-base-200 text-base-content`;
    const linkBtn = "text-red-600 hover:text-red-700 transition-colors font-bold";

    useEffect(() => {
      fetchUsers();
      fetchCurrentUser();
    }, []);

    const fetchUsers = async () => {
      try {
        const res = await fetch(`${API_BASE}/users`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
        });
        if (!res.ok) throw new Error('Error al listar usuarios');
        const data = await res.json();
        setUsers(data.users);
      } catch (err) {
        console.error(err);
        notifyError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const fetchCurrentUser = async () => {
      try {
        const res = await fetch(`${API_BASE}/users/me`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
        });
        if (!res.ok) throw new Error('No autorizado');
        const data = await res.json();
        setCurrentUser(data);
      } catch (err) {
        console.error(err);
        notifyError('No se pudo cargar tu sesión');
      }
    };

    const handleEdit = (user) => {
      setIsEditing(true);
      setEditingUser(user);
      setShowUserModal(true);
    };

    const handleDelete = async (id) => {
      confirm('¿Seguro que quieres eliminar este usuario?', async () => {
        try {
          const res = await fetch(`${API_BASE}/users/${id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
          });
          if (!res.ok) throw new Error('No se pudo eliminar');
          notifySuccess('Usuario eliminado');
          await fetchUsers();
        } catch (err) {
          console.error(err);
          notifyError(err.message);
        }
      });
    };

    const handleSubmit = async () => {
      try {
        const res = await fetch(`${API_BASE}/users/${editingUser.user_id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          },
          body: JSON.stringify({
            username: editingUser.username,
            mail: editingUser.mail
          })
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Error al guardar');
        }

        notifySuccess('Usuario actualizado');
        setShowUserModal(false);
        await fetchUsers();
      } catch (err) {
        console.error(err);
        notifyError(err.message);
      }
    };

    const handleRoleChange = async (userId, newRole) => {
      try {
        const res = await fetch(`${API_BASE}/users/${userId}/role`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          },
          body: JSON.stringify({ role: newRole })
        });

        if (!res.ok) throw new Error('Error al cambiar el rol');
        notifySuccess('Rol actualizado');
        await fetchUsers();
      } catch (err) {
        console.error(err);
        notifyError(err.message);
      }
    };

    const getRoleBadge = (role) => {
      switch (role) {
        case 0: return <span className="badge badge-neutral">Usuario</span>;
        case 1: return <span className="badge badge-warning text-black">Admin</span>;
        case 2: return <span className="badge badge-info text-black">SuperAdmin</span>;
        default: return <span className="badge">Desconocido</span>;
      }
    };

    return (
      <div className="min-h-screen bg-base-100 p-6 text-base-content">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Usuarios</h1>
        </div>

        <table className="w-full table-auto mb-6">
          <thead>
            <tr>
              <th className="px-4 py-2">ID</th>
              <th className="px-4 py-2">Usuario</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Rol</th>
              <th className="px-4 py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="p-4">Cargando...</td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.user_id} className="border-b">
                  <td className="px-4 py-2">{u.user_id}</td>
                  <td className="px-4 py-2">{u.username}</td>
                  <td className="px-4 py-2">{u.mail}</td>
                  <td className="px-4 py-2">
                    {currentUser?.role === 2 && u.role !== 2 ? (
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.user_id, parseInt(e.target.value))}
                        className="bg-base-200 px-2 py-1 rounded"
                      >
                        <option value={0}>Usuario</option>
                        <option value={1}>Admin</option>
                      </select>
                    ) : getRoleBadge(u.role)}
                  </td>
                  <td className="px-4 py-2">
                    {(currentUser?.role === 2 || (currentUser?.role === 1 && u.role === 0)) && (
                      <>
                        <button onClick={() => handleEdit(u)} className={linkBtn}>Editar</button>
                        <button onClick={() => handleDelete(u.user_id)} className={`${linkBtn} ml-2`}>Eliminar</button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <AnimatePresence>
          {showUserModal && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 w-1/3 h-full bg-base-100 shadow-lg p-6 z-50"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Editar Usuario</h2>
                <button onClick={() => setShowUserModal(false)} className="text-base-content/60 hover:text-base-content">
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block mb-1">Usuario</label>
                  <input
                    type="text"
                    value={editingUser.username}
                    onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-base-200 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block mb-1">Email</label>
                  <input
                    type="email"
                    value={editingUser.mail}
                    onChange={(e) => setEditingUser({ ...editingUser, mail: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-base-200 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="flex gap-3">
                  <button onClick={handleSubmit} className={primaryBtn}>Guardar</button>
                  <button onClick={() => setShowUserModal(false)} className={secondaryBtn}>Cancelar</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  export default UserManagement;
