import { useEffect, useState } from "react";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const res = await fetch("http://127.0.0.1:8000/admin/users", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    const data = await res.json();
    setUsers(data);
  };

  const logout = () => {
  localStorage.removeItem("token");
  window.location.reload();
};

  const deleteUser = async (id) => {
  await fetch(`http://127.0.0.1:8000/admin/users/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },

  });

  // refresh list
  fetchUsers();
};

  return (
    <div className="p-6 text-white">
      <h2 className="text-2xl mb-4">All Users</h2>

      <table className="w-full bg-[#1a1d25] rounded-xl">
        <thead>
          <tr>
            <th className="p-2">ID</th>
            <th className="p-2">Name</th>
            <th className="p-2">Email</th>
            <th className="p-2">Role </th>
            <th className="p-2">Action </th>
          </tr>
        </thead>

        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td className="p-2">{u.id}</td>
              <td className="p-2">{u.name}</td>
              <td className="p-2">{u.email}</td>
              <td className="p-2">{u.role} </td>
              <td className="p-2">
            <button
              onClick={() => deleteUser(u.id)}
              className="bg-red-600 px-3 py-1 rounded"
            >
              Delete
            </button>
            </td>
            <button
              onClick={logout}
              className="bg-red-600 px-4 py-2 rounded mb-4"
            >
              Logout
            </button>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 