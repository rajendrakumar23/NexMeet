const Badge = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    success: 'bg-green-500/20 text-green-400 border-green-500/30',
    danger: 'bg-red-500/20 text-red-400 border-red-500/30',
    warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    info: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
