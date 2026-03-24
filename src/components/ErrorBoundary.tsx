import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      let displayMessage = "وقع مشكل تقني. حاول مرة أخرى.";
      
      try {
        if (this.state.error?.message) {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.error && parsed.error.includes('permissions')) {
            displayMessage = "ما عندكش الصلاحيات الكافية لهاد العملية. جرب تخرج وتعاود تدخل.";
          }
        }
      } catch (e) {
        // Not a JSON error, use default
      }

      return (
        <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 text-center space-y-6">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center text-red-500">
            <AlertCircle size={40} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black tracking-tighter italic text-white">أوبس! وقع خطأ</h2>
            <p className="text-neutral-500 text-sm max-w-xs mx-auto">
              {displayMessage}
            </p>
          </div>
          <button
            onClick={this.handleReset}
            className="px-8 py-4 bg-orange-500 text-neutral-950 font-black rounded-2xl flex items-center gap-2 transition-transform active:scale-95"
          >
            <RefreshCcw size={20} />
            نعاودو من الأول
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
