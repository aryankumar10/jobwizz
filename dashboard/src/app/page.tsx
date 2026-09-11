import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-b from-blue-50 to-white dark:from-slate-900 dark:to-slate-950">
      <div className="max-w-4xl text-center space-y-8">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-slate-900 dark:text-white">
          Track Every Job Application, <span className="text-blue-600">Effortlessly</span>
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
          The ultimate companion for your job search. Use our browser extension to auto-capture jobs, and manage them all in this powerful dashboard.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link 
            href="/signup" 
            className="px-8 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
          >
            Get Started Free
          </Link>
          <Link 
            href="/upload" 
            className="px-8 py-3 rounded-lg bg-white text-slate-700 border border-slate-200 font-medium hover:bg-slate-50 transition-colors dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
          >
            Upload JSON
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mt-24 max-w-5xl">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4 text-xl">✨</div>
          <h3 className="text-lg font-semibold mb-2">Auto-Capture</h3>
          <p className="text-slate-600 dark:text-slate-300">Extension auto-detects jobs on LinkedIn & Handshake with a single click.</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="h-12 w-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mb-4 text-xl">📊</div>
          <h3 className="text-lg font-semibold mb-2">Track Progress</h3>
          <p className="text-slate-600 dark:text-slate-300">Update status, filter, and search across all your applications in one place.</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="h-12 w-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mb-4 text-xl">📂</div>
          <h3 className="text-lg font-semibold mb-2">Stay Organized</h3>
          <p className="text-slate-600 dark:text-slate-300">Export data, view stats, and never lose track of an application again.</p>
        </div>
      </div>
    </main>
  );
}
