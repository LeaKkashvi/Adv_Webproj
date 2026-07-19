import { useState, useEffect } from 'react';
import { Shield, AlertCircle, Save, Users, Lock, Eye, Edit3, Trash2, CheckCircle } from 'lucide-react';
import adminApi from '../../api/adminApi';
import { Button } from '../../components/common/Button';
import { Loader } from '../../components/common/Loader';

const defaultPermissions = [
  { id: 'view_users', label: 'View Users', category: 'User Management' },
  { id: 'edit_users', label: 'Edit Users', category: 'User Management' },
  { id: 'suspend_users', label: 'Suspend/Activate Users', category: 'User Management' },
  { id: 'view_cases', label: 'View Cases', category: 'Case Management' },
  { id: 'create_cases', label: 'Create Cases', category: 'Case Management' },
  { id: 'assign_cases', label: 'Assign Cases', category: 'Case Management' },
  { id: 'update_cases', label: 'Update Case Status', category: 'Case Management' },
  { id: 'view_documents', label: 'View Documents', category: 'Document Management' },
  { id: 'review_documents', label: 'Review & Verify Documents', category: 'Document Management' },
  { id: 'view_analytics', label: 'View Analytics', category: 'Reports' },
  { id: 'export_reports', label: 'Export Reports', category: 'Reports' },
  { id: 'manage_roles', label: 'Manage Roles & Permissions', category: 'Administration' },
  { id: 'view_advocates', label: 'View Advocate Profiles', category: 'Advocate Management' },
  { id: 'verify_advocates', label: 'Verify/Reject Advocates', category: 'Advocate Management' },
];

const defaultRoles = [
  {
    name: 'admin',
    label: 'Administrator',
    description: 'Full system access with all permissions',
    color: 'bg-red-100 text-red-800 border-red-200',
  },
  {
    name: 'advocate',
    label: 'Advocate',
    description: 'Legal professional managing cases and clients',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  {
    name: 'client',
    label: 'Client',
    description: 'NRI client accessing legal services',
    color: 'bg-green-100 text-green-800 border-green-200',
  },
];

const permissionCategories = [...new Set(defaultPermissions.map((p) => p.category))];

export function RoleManagement() {
  const [roles, setRoles] = useState([]);
  const [rolePermissions, setRolePermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedRole, setSelectedRole] = useState('advocate');

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await adminApi.getRoles();
        const serverRoles = res.data || res.roles || [];
        setRoles(serverRoles.length > 0 ? serverRoles : defaultRoles);
        const perms = {};
        defaultRoles.forEach((r) => {
          const found = serverRoles.find((sr) => sr.name === r.name);
          perms[r.name] = found?.permissions || (r.name === 'admin' ? defaultPermissions.map((p) => p.id) : []);
        });
        serverRoles.forEach((sr) => {
          if (!perms[sr.name]) {
            perms[sr.name] = sr.permissions || [];
          }
        });
        setRolePermissions(perms);
      } catch {
        const perms = {};
        defaultRoles.forEach((r) => {
          perms[r.name] = r.name === 'admin' ? defaultPermissions.map((p) => p.id) : [];
        });
        setRoles(defaultRoles);
        setRolePermissions(perms);
      } finally {
        setLoading(false);
      }
    };
    fetchRoles();
  }, []);

  const togglePermission = (roleName, permId) => {
    setRolePermissions((prev) => {
      const current = prev[roleName] || [];
      const updated = current.includes(permId)
        ? current.filter((p) => p !== permId)
        : [...current, permId];
      return { ...prev, [roleName]: updated };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await adminApi.updateRolePermissions(selectedRole, rolePermissions[selectedRole] || []);
      setSuccess(`Permissions updated for ${selectedRole}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update permissions');
    } finally {
      setSaving(false);
    }
  };

  const currentRole = roles.find((r) => r.name === selectedRole) || defaultRoles.find((r) => r.name === selectedRole);
  const currentPerms = rolePermissions[selectedRole] || [];

  if (loading) return <Loader size="md" className="py-12" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Role Management</h1>
        <p className="text-sm text-gray-500 mt-1">Configure access control and permissions for each role</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" /> {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-3">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Roles</h3>
          {roles.map((role) => (
            <button
              key={role.name}
              onClick={() => { setSelectedRole(role.name); setSuccess(''); setError(''); }}
              className={`w-full text-left p-4 rounded-lg border transition-all ${
                selectedRole === role.name
                  ? 'bg-primary-50 border-primary-200 shadow-sm'
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Shield className={`w-5 h-5 ${selectedRole === role.name ? 'text-primary-600' : 'text-gray-400'}`} />
                <div>
                  <p className="text-sm font-medium text-gray-900">{role.label || role.name}</p>
                  <p className="text-xs text-gray-500">{(rolePermissions[role.name] || []).length} permissions</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="lg:col-span-3">
          {currentRole && (
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{currentRole.label || currentRole.name}</h2>
                    <p className="text-sm text-gray-500 mt-1">{currentRole.description}</p>
                  </div>
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${currentRole.color || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                    {currentPerms.length} permissions
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {permissionCategories.map((category) => {
                  const catPerms = defaultPermissions.filter((p) => p.category === category);
                  const allChecked = catPerms.every((p) => currentPerms.includes(p.id));
                  const someChecked = catPerms.some((p) => currentPerms.includes(p.id));

                  return (
                    <div key={category}>
                      <div className="flex items-center gap-2 mb-3">
                        <input
                          type="checkbox"
                          checked={allChecked}
                          ref={(el) => { if (el) el.indeterminate = someChecked && !allChecked; }}
                          onChange={() => {
                            const newPerms = { ...rolePermissions };
                            if (allChecked) {
                              newPerms[selectedRole] = currentPerms.filter((p) => !catPerms.find((cp) => cp.id === p));
                            } else {
                              newPerms[selectedRole] = [...new Set([...currentPerms, ...catPerms.map((p) => p.id)])];
                            }
                            setRolePermissions(newPerms);
                          }}
                          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <h4 className="text-sm font-semibold text-gray-700">{category}</h4>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 ml-6">
                        {catPerms.map((perm) => (
                          <label
                            key={perm.id}
                            className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
                              currentPerms.includes(perm.id) ? 'bg-primary-50' : 'hover:bg-gray-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={currentPerms.includes(perm.id)}
                              onChange={() => togglePermission(selectedRole, perm.id)}
                              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm text-gray-700">{perm.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end">
                <Button onClick={handleSave} loading={saving} disabled={selectedRole === 'admin'}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Permissions
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RoleManagement;
