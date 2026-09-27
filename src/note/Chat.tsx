import { useState, useRef, useEffect } from 'react';
import React from 'react';

// @ts-ignore
const useChat = (...args: any[]) => ({ messages: [], appendMessage: (...args: any[]) => {} });
const ErrorBoundary = ({ children }: any) => <>{children}</>;

function Chat() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { messages, appendMessage } = useChat({
    model: 'gemini-2.5-pro',
  });

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const safeMessages = messages ?? [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [safeMessages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    appendMessage({ role: 'user', text: input });
    setInput('');
  };

  return (
    <div className="flex flex-col w-full">
      <div className="flex w-full min-h-[calc(100vh-3.5rem)] relative overflow-hidden bg-surface">
        
        <aside className={`w-72 shrink-0 flex flex-col justify-between p-space-md transition-all duration-300 ease-out bg-surface-container-low/60 backdrop-blur-md z-30 ${!isSidebarOpen ? '-ml-72' : ''}`} id="chat-sidebar">
          <div className="flex flex-col gap-space-md min-w-0">
            <div className="flex items-center justify-between px-space-xs">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-text-tertiary">Settings</span>
              <button 
                className="p-1 rounded hover:bg-surface-container text-text-tertiary hover:text-on-surface transition-colors"
                onClick={() => setIsSidebarOpen(false)}
              >
                <span className="material-symbols-outlined text-[18px]">keyboard_double_arrow_left</span>
              </button>
            </div>
            {/* Neural Network and Memory blocks removed as requested */}
          </div>
        </aside>
  

        <section className="flex-1 flex flex-col justify-between items-center relative overflow-y-auto px-margin py-space-xl">
          {!isSidebarOpen && (
            <button 
              className="absolute top-4 left-4 p-1 rounded-lg text-text-tertiary hover:text-on-surface hover:bg-surface-container transition-colors z-40" 
              onClick={() => setIsSidebarOpen(true)}
            >
              <span className="material-symbols-outlined text-[18px]">side_navigation</span>
            </button>
          )}

          <div className="w-full flex flex-col gap-space-xl pb-36">
            <div className="flex items-center justify-center gap-space-sm">
              <div className="h-[1px] flex-1 bg-surface-container-high"></div>
              <span className="px-space-md py-1 rounded-full bg-surface-container-low text-text-tertiary font-label-sm text-label-sm shadow-sm">
                Today • Document-aware Context Active
              </span>
              <div className="h-[1px] flex-1 bg-surface-container-high"></div>
            </div>

            

            {safeMessages.map((m: any, index: number) => (
              m.role === 'user' ? (
                <div key={index} className="flex justify-end w-full">
                  <div className="flex items-start gap-space-sm max-w-4xl group">
                    <div className="flex flex-col items-end">
                      <div className="px-space-lg py-space-md rounded-2xl bg-surface-container-high text-on-surface shadow-sm">
                        <p className="font-body-md text-body-md text-on-surface leading-relaxed">
                          {m.text}
                        </p>
                      </div>
                    </div>
                    <div className="w-7 h-7 rounded-full bg-primary shrink-0 mt-1 shadow-sm flex items-center justify-center text-[10px] text-on-primary font-bold">SH</div>
                  </div>
                </div>
              ) : (
                <div key={index} className="flex items-start gap-space-md w-full">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-fixed to-accent-subtle flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    <span className="material-symbols-outlined text-[18px] text-primary">auto_awesome</span>
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center gap-space-sm mb-space-sm">
                      <span className="font-title-md text-title-md text-on-surface font-semibold">Copilot Engine</span>
                      <span className="px-2 py-0.5 rounded-full bg-accent-subtle text-primary font-label-sm text-label-sm font-medium">Deep Dive</span>
                    </div>
                    <div className="space-y-space-md font-body-lg text-body-lg text-on-surface leading-relaxed markdown-content">
                      <div>{m.text}</div>
                    </div>
                    <div className="flex items-center gap-space-xs mt-space-lg pt-space-sm text-text-tertiary">
                      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-surface-container hover:text-on-surface transition-colors">
                        <span className="material-symbols-outlined text-[16px]">content_copy</span>
                        <span className="font-label-md text-label-md font-medium">Copy</span>
                      </button>
                      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-surface-container hover:text-on-surface transition-colors">
                        <span className="material-symbols-outlined text-[16px]">bookmark_add</span>
                        <span className="font-label-md text-label-md font-medium">Save to Note</span>
                      </button>
                      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-surface-container hover:text-on-surface transition-colors">
                        <span className="material-symbols-outlined text-[16px]">refresh</span>
                        <span className="font-label-md text-label-md font-medium">Regenerate</span>
                      </button>
                      <div className="h-3 w-[1px] bg-surface-container-high mx-1"></div>
                      <button className="p-1.5 rounded-lg hover:bg-surface-container hover:text-on-surface transition-colors" title="Helpful">
                        <span className="material-symbols-outlined text-[16px]">thumb_up</span>
                      </button>
                      <button className="p-1.5 rounded-lg hover:bg-surface-container hover:text-on-surface transition-colors" title="Not helpful">
                        <span className="material-symbols-outlined text-[16px]">thumb_down</span>
                      </button>
                    </div>
                  </div>
                </div>
              )
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="fixed bottom-6 left-0 right-0 z-40 flex justify-center px-margin pointer-events-none">
            <form onSubmit={handleSubmit} className="pointer-events-auto w-full max-w-4xl bg-surface-container-lowest/90 backdrop-blur-2xl rounded-full p-2 shadow-xl shadow-black/5 flex items-center gap-2 transition-all focus-within:shadow-2xl focus-within:ring-2 focus-within:ring-primary/20">
              <label className="w-9 h-9 rounded-full flex items-center justify-center text-text-secondary hover:text-on-surface hover:bg-surface-container transition-colors shrink-0 cursor-pointer" title="Attach file or context">
                <span className="material-symbols-outlined text-[20px]">add</span>
                <input type="file" className="hidden" multiple accept="image/*,.pdf,.doc,.docx,.txt" />
              </label>
              
              <input 
                className="flex-1 bg-transparent border-none outline-none font-body-md text-body-md text-on-surface placeholder:text-text-tertiary px-space-xs py-1" 
                placeholder="Ask AI anything or type / for commands..." 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              

              
              <button type="button" className="w-9 h-9 rounded-full flex items-center justify-center text-text-secondary hover:text-on-surface hover:bg-surface-container transition-colors shrink-0" title="Voice dictation">
                <span className="material-symbols-outlined text-[19px]">mic</span>
              </button>
              
              <button type="submit" disabled={!input.trim()} className="w-9 h-9 rounded-full bg-primary hover:bg-accent-hover disabled:opacity-50 text-on-primary flex items-center justify-center transition-transform active:scale-95 shadow-sm shrink-0" title="Send message">
                <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}

export function ChatWithErrorBoundary() {
  return (
    <ErrorBoundary fallback={<div className="p-4 text-error">Something went wrong in Chat.</div>}>
      <Chat />
    </ErrorBoundary>
  );
}