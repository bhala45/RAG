import Navbar from './Navbar';

export default function Layout({ children, showSidebar = false, sidebarComponent = null }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Background glow effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-cyan-600/10 rounded-full blur-[120px]"></div>
      </div>

      <Navbar />

      <main className="flex-1 flex relative z-10">
        {showSidebar && sidebarComponent}
        <div className="flex-1 overflow-x-hidden">{children}</div>
      </main>
    </div>
  );
}
