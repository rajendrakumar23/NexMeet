const Input = ({ label, error, icon: Icon, className = '', ...props }) => (
  <div className="flex flex-col gap-1.5">
    {label && <label className="text-sm font-medium text-slate-300">{label}</label>}
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />}
      <input
        className={`w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500
          focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all
          ${Icon ? 'pl-10' : ''} ${error ? 'border-red-500' : ''} ${className}`}
        {...props}
      />
    </div>
    {error && <p className="text-red-400 text-xs">{error}</p>}
  </div>
);

export default Input;
