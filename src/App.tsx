import { ChatInterface } from "./components/ChatInterface";
import { Toaster } from "./components/ui/sonner";

function App() {
  return (
    <div className="fixed inset-0 bg-muted flex items-center justify-center p-0 md:p-4">
      <div className="w-full h-full max-w-md bg-background shadow-2xl md:rounded-3xl overflow-hidden border-border md:border relative">
        <ChatInterface />
        <Toaster position="top-center" richColors />
      </div>
    </div>
  );
}

export default App;
