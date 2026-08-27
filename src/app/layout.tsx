import { ReactNode, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Calculator, Menu, X, Landmark, ShieldCheck, Mail, Phone } from 'lucide-react';
import { useAuth } from '../components/auth/auth-provider';
import { logout } from '../lib/supabase/auth';
import { Button } from '../components/ui/button';

interface LayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: LayoutProps) {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
    navigate('/');
  };

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'EMI Calculator', path: '/emi-calculator' },
    { label: 'Part Payment', path: '/part-payment-calculator' },
    { label: 'Company Search', path: '/company-search' },
    { label: 'Bank Policies', path: '/policies' },
    { label: 'Offers', path: '/offers' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground p-2 rounded-lg">
              <Landmark className="h-5 w-5" />
            </div>
            <Link to="/" className="font-bold text-xl tracking-tight hidden sm:inline-block text-slate-900">
              Loan Finance Portal
            </Link>
          </div>
          
          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium">
            {navLinks.map((link) => (
              <Link 
                key={link.path} 
                to={link.path} 
                className={`transition-colors hover:text-primary ${location.pathname === link.path ? 'text-primary font-semibold' : 'text-slate-600'}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          
          <div className="hidden lg:flex items-center gap-4">
            {!loading && !user && (
              <>
                <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">
                  Login
                </Link>
                <Button asChild size="sm" className="rounded-full px-6">
                  <Link to="/register">Register</Link>
                </Button>
              </>
            )}
            {!loading && user && (
              <div className="flex items-center gap-4">
                <Link to="/dashboard" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">
                  Dashboard
                </Link>
                {isAdmin && (
                  <Link to="/admin" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4" /> Admin
                  </Link>
                )}
                <Button variant="outline" size="sm" onClick={handleLogout} className="rounded-full">
                  Logout
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="lg:hidden p-2 text-slate-600 hover:text-primary"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Nav Overlay */}
        {mobileMenuOpen && (
          <div className="lg:hidden absolute top-16 left-0 w-full bg-white border-b shadow-lg py-4 px-4 flex flex-col gap-4">
            <nav className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <Link 
                  key={link.path} 
                  to={link.path} 
                  className={`block px-2 py-1 text-base font-medium ${location.pathname === link.path ? 'text-primary' : 'text-slate-600'}`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="h-px bg-slate-100 my-2"></div>
            <div className="flex flex-col gap-3">
              {!loading && !user && (
                <>
                  <Link to="/login" className="block px-2 py-1 text-base font-medium text-slate-600">
                    Login
                  </Link>
                  <Button asChild className="w-full">
                    <Link to="/register">Register</Link>
                  </Button>
                </>
              )}
              {!loading && user && (
                <>
                  <Link to="/dashboard" className="block px-2 py-1 text-base font-medium text-slate-600">
                    Dashboard
                  </Link>
                  {isAdmin && (
                    <Link to="/admin" className="block px-2 py-1 text-base font-medium text-primary flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" /> Admin Portal
                    </Link>
                  )}
                  <Button variant="outline" className="w-full mt-2" onClick={handleLogout}>
                    Logout
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12 md:py-16 mt-auto">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <div className="bg-primary/20 text-primary p-2 rounded-lg">
                  <Landmark className="h-5 w-5" />
                </div>
                <span className="font-bold text-xl text-white tracking-tight">Loan Finance Portal</span>
              </div>
              <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                The leading intelligent platform for finance professionals to calculate EMIs, evaluate part payments, and discover bank policies seamlessly.
              </p>
              <div className="flex flex-col gap-2 text-sm text-slate-400">
                <span className="flex items-center gap-2"><Mail className="w-4 h-4" /> support@loanportal.com</span>
                <span className="flex items-center gap-2"><Phone className="w-4 h-4" /> 1-800-FINANCE</span>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-white mb-6 uppercase tracking-wider text-sm">Tools</h3>
              <ul className="flex flex-col gap-3 text-sm">
                <li><Link to="/emi-calculator" className="hover:text-primary transition-colors">EMI Calculator</Link></li>
                <li><Link to="/part-payment-calculator" className="hover:text-primary transition-colors">Part Payment Analysis</Link></li>
                <li><Link to="/company-search" className="hover:text-primary transition-colors">Company Category Search</Link></li>
                <li><Link to="/policies" className="hover:text-primary transition-colors">Bank Policies</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-6 uppercase tracking-wider text-sm">Legal</h3>
              <ul className="flex flex-col gap-3 text-sm">
                <li><Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
                <li><Link to="/disclaimer" className="hover:text-primary transition-colors">Financial Disclaimer</Link></li>
                <li><Link to="/contact" className="hover:text-primary transition-colors">Contact Us</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-6 uppercase tracking-wider text-sm">Security</h3>
              <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                <div className="flex items-center gap-3 mb-2">
                  <ShieldCheck className="w-5 h-5 text-green-400" />
                  <span className="font-medium text-white text-sm">Bank-grade Security</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Your data is protected with 256-bit encryption. We never store sensitive credentials and implement strict role-based access.
                </p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500">
              © {new Date().getFullYear()} Loan Finance Portal. All rights reserved.
            </p>
            <p className="text-xs text-slate-500">
              Designed for Professional Use.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
