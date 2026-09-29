import { initials } from '../../lib/utils';

export default function Avatar({ name, size = 'md' }) {
  const colorIndex = (name?.charCodeAt(0) || 65) % 5;
  const sizeClass = size === 'sm' ? 'avatar-sm' : size === 'lg' ? 'avatar-lg' : '';
  return (
    <span className={`member-avatar avatar-${colorIndex} ${sizeClass}`}>
      {initials(name)}
    </span>
  );
}
