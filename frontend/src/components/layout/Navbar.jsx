import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiMenuAlt3, HiX } from 'react-icons/hi';
import { BsSun, BsMoon } from 'react-icons/bs';
import useThemeStore from '../../store/themeStore';
import useAuthStore from '../../store/authStore';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isDark, toggleTheme } = useThemeStore();
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'FAQ', href: '#faq' },
  ];

  return (
    <motion.nav
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'glass shadow-lg shadow-black/20' : 'bg-transparent'}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 gradient-bg rounded-lg flex items-center justify-center glow-sm">
              <span className="text-white font-black text-sm">N</span>
            </div>
            <span className="font-black text-xl gradient-text">NexMeet</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(link => (
              <a key={link.label} href={link.href} className="text-slate-400 hover:text-white transition-colors text-sm font-medium">
                {link.label}
              </a>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
              {isDark ? <BsSun size={18} /> : <BsMoon size={18} />}
            </button>

            {isAuthenticated ? (
              <Link to="/dashboard">
                <Avatar src={user?.avatar} name={user?.name} size="sm" online={true} />
              </Link>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/login"><Button variant="ghost" size="sm">Login</Button></Link>
                <Link to="/register"><Button size="sm">Get Started</Button></Link>
              </div>
            )}

            <button className="md:hidden p-2 text-slate-400" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <HiX size={22} /> : <HiMenuAlt3 size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass border-t border-white/10"
          >
            <div className="px-4 py-4 flex flex-col gap-3">
              {navLinks.map(link => (
                <a key={link.label} href={link.href} className="text-slate-300 py-2" onClick={() => setMobileOpen(false)}>
                  {link.label}
                </a>
              ))}
              {!isAuthenticated && (
                <>
                  <Link to="/login" onClick={() => setMobileOpen(false)}><Button variant="secondary" className="w-full">Login</Button></Link>
                  <Link to="/register" onClick={() => setMobileOpen(false)}><Button className="w-full">Get Started</Button></Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
