// src/components/common/ErrorBoundary.jsx
import React from 'react';
import { AlertTriangle, RefreshCw, Trash2, Building2 } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo,
    });
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.15)_1px,transparent_0)] bg-size-[32px_32px]"></div>

          <div className="relative max-w-md w-full">
            {/* Error Card */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-8">
              {/* Header */}
              <div className="text-center mb-6">
                {/* Company Logo */}
                <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-br from-blue-600 to-blue-800 rounded-xl mb-4 shadow-lg">
                  <Building2 className="w-8 h-8 text-white" />
                </div>

                {/* Error Icon */}
                <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-br from-red-500 to-red-600 rounded-xl mb-4 shadow-lg">
                  <AlertTriangle className="w-8 h-8 text-white" />
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
                <p className="text-gray-600 mb-4">
                  The Fleet Monitor application encountered an unexpected error.
                </p>
              </div>

              {/* Error Details */}
              {this.state.error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-red-800 mb-1">Error Details</h3>
                      <p className="text-xs text-red-700 font-mono wrap-break-word">
                        {String(this.state.error?.message || this.state.error)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full flex items-center justify-center gap-2 bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
                >
                  <RefreshCw className="w-5 h-5" />
                  Reload Application
                </button>

                <button
                  onClick={() => {
                    localStorage.clear();
                    sessionStorage.clear();
                    window.location.reload();
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-linear-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
                >
                  <Trash2 className="w-5 h-5" />
                  Clear Cache & Reload
                </button>
              </div>

              {/* Help Section */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="text-sm font-medium text-gray-800 mb-2">Need Help?</h3>
                <p className="text-xs text-gray-600 mb-3">
                  If this error persists, please contact the system administrator or try the
                  following:
                </p>
                <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
                  <li>Check your internet connection</li>
                  <li>Ensure the backend server is running</li>
                  <li>Clear your browser cache and cookies</li>
                  <li>Try accessing the application in an incognito window</li>
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center mt-6">
              <p className="text-white/70 text-sm">PT Borneo Indobara - Fleet Monitoring System</p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
