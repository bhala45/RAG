import { Filter } from 'lucide-react';

const DEPARTMENTS = [
  'All',
  'General',
  'CSE',
  'ECE',
  'Mechanical',
  'Admissions',
  'Hostel',
  'Placements',
];

export default function DepartmentFilter({ value, onChange }) {
  return (
    <div className="flex items-center space-x-2">
      <Filter className="w-3.5 h-3.5 text-blue-400" />
      <span className="text-xs text-slate-400 font-medium">Department:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-slate-900 border border-slate-700/80 hover:border-slate-600 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer"
      >
        {DEPARTMENTS.map((dept) => (
          <option key={dept} value={dept}>
            {dept === 'All' ? 'All Departments' : dept}
          </option>
        ))}
      </select>
    </div>
  );
}
