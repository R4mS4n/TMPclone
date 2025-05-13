import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence }       from 'framer-motion';
import { useNotification }               from '../contexts/NotificationContext';

const UserManagement = () => {
  const [users, setUsers]               = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [isEditing, setIsEditing]       = useState(false);
  const [currentUser, setCurrentUser]   = useState({
    user_id: null,
    username: '',
  });
  const [loading, setLoading]           = useState(true);
  const { notifySuccess, notifyError, confirm } = useNotification();

  // estilos de botón como en el ejemplo
  const baseBtn       = "px-4 py-2 rounded-md transition-colors";
  const primaryBtn    = `${baseBtn} bg-primary hover:bg-primary-focus text-primary-content`;
  const secondaryBtn  = `${baseBtn} bg-base-300 hover:bg-base-200 text-base-content`;
  const linkBtn       = "text-red-600 hover:text-red-700 transition-colors font-bold";

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/admin/users', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
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

  const handleCreate = () => {
    setIsEditing(false);
    setCurrentUser({ user_id: null, username: '' });
    setShowUserModal(true);
  };

  const handleEdit = (user) => {
    setIsEditing(true);
    setCurrentUser(user);
    setShowUserModal(true);
  };

  const handleDelete = async (id) => {
    confirm(
      '¿Seguro que quieres eliminar este usuario?',
      async () => {
        try {
          const res = await fetch(`http://localhost:5000/api/admin/users/${id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          if (!res.ok) throw new Error('No se pudo eliminar');
          notifySuccess('Usuario eliminado');
          await fetchUsers();
        } catch (err) {
          console.error(err);
          notifyError(err.message);
        }
      }
    );
  };

  const handleSubmit = async () => {
    try {
      const url    = isEditing
        ? `http://localhost:5000/api/admin/users/${currentUser.user_id}`
        : 'http://localhost:5000/api/admin/users';
      const method = isEditing ? 'PUT' : 'POST'; // si en el futuro añades creación
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ username: currentUser.username })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al guardar');
      }
      notifySuccess(isEditing ? 'Usuario actualizado' : 'Usuario creado');
      setShowUserModal(false);
      await fetchUsers();
    } catch (err) {
      console.error(err);
      notifyError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-base-100 p-6 text-base-content">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Usuarios</h1>
        {/* Si quieres botón de crear, descomenta */}
        {/* <button onClick={handleCreate} className={primaryBtn}>Nuevo Usuario</button> */}
      </div>

      <table className="w-full table-auto mb-6">
        <thead>
          <tr>
            <th className="px-4 py-2">ID</th>
            <th className="px-4 py-2">Usuario</th>
            <th className="px-4 py-2">Email</th>
            <th className="px-4 py-2">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {loading
            ? <tr><td colSpan="4" className="p-4">Cargando...</td></tr>
            : users.map(u => (
              <tr key={u.user_id} className="border-b">
                <td className="px-4 py-2">{u.user_id}</td>
                <td className="px-4 py-2">{u.username}</td>
                <td className="px-4 py-2">{u.mail}</td>
                <td className="px-4 py-2">
                  <button onClick={() => handleEdit(u)} className={linkBtn}>Editar</button>
                  <button onClick={() => handleDelete(u.user_id)} className={linkBtn}>Eliminar</button>
                </td>
              </tr>
            ))
          }
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
              <h2 className="text-xl font-bold">{isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
              <button onClick={() => setShowUserModal(false)} className="text-base-content/60 hover:text-base-content">
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block mb-1">Usuario</label>
                <input
                  type="text"
                  value={currentUser.username}
                  onChange={e => setCurrentUser({ ...currentUser, username: e.target.value })}
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
