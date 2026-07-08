const Avatar = ({ src, name, size = 'md', online, className = '' }) => {
  const sizes = { xs: 'w-6 h-6 text-xs', sm: 'w-8 h-8 text-sm', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-lg', xl: 'w-20 h-20 text-2xl' };
  const dotSizes = { xs: 'w-1.5 h-1.5', sm: 'w-2 h-2', md: 'w-2.5 h-2.5', lg: 'w-3 h-3', xl: 'w-4 h-4' };

  const initials = name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <div className={`relative inline-flex shrink-0 ${className}`}>
      {src ? (
        <img src={src} alt={name} className={`${sizes[size]} rounded-full object-cover ring-2 ring-indigo-500/30`} />
      ) : (
        <div className={`${sizes[size]} rounded-full gradient-bg flex items-center justify-center font-bold text-white ring-2 ring-indigo-500/30`}>
          {initials}
        </div>
      )}
      {online !== undefined && (
        <span className={`absolute bottom-0 right-0 ${dotSizes[size]} rounded-full border-2 border-[#0f0f1a] ${online ? 'bg-green-400' : 'bg-slate-500'}`} />
      )}
    </div>
  );
};

export default Avatar;
