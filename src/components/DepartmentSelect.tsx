import { useEffect, useState } from 'react';
import { ApiError } from '../services/apiClient';
import { getDepartments } from '../services/departmentService';
import type { Department } from '../types/file';

interface DepartmentSelectProps {
  value: string;
  onChange: (departmentId: string) => void;
  onDepartmentChange?: (department: Department | null) => void;
  refreshKey?: number;
  disabled?: boolean;
  required?: boolean;
}

export function DepartmentSelect({
  value,
  onChange,
  onDepartmentChange,
  refreshKey = 0,
  disabled = false,
  required = true,
}: DepartmentSelectProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setIsLoading(true);
    setError('');

    getDepartments()
      .then((nextDepartments) => {
        setDepartments(nextDepartments);
        onDepartmentChange?.(
          nextDepartments.find((department) => String(department.id) === value) ?? null,
        );
      })
      .catch((loadError) => {
        setError(loadError instanceof ApiError ? loadError.message : 'Could not load departments.');
      })
      .finally(() => setIsLoading(false));
  }, [refreshKey, value]);

  const handleChange = (departmentId: string) => {
    onChange(departmentId);
    onDepartmentChange?.(
      departments.find((department) => String(department.id) === departmentId) ?? null,
    );
  };

  return (
    <label>
      <span>Department</span>
      <select
        required={required}
        disabled={disabled || isLoading}
        value={value}
        onChange={(event) => handleChange(event.target.value)}
      >
        <option value="">{isLoading ? 'Loading departments...' : 'Select department'}</option>
        {departments.map((department) => (
          <option key={department.id} value={department.id}>
            {department.code ? `${department.name} (${department.code})` : department.name}
          </option>
        ))}
      </select>
      {error && <span className="field-error">{error}</span>}
    </label>
  );
}
