import React, { useState, useRef, useEffect, useCallback } from 'react';
import { UserRole, ChatMessage } from '../types';
import { chatWithAI } from '../services/geminiService';


interface Props {
 role: UserRole;
}


const AIAssistant: React.FC<Props> = ({ role }) => {
 const [messages, setMessages] = useState<ChatMessage[]>([]);
 const [input, setInput] = useState('');
 const [loading, setLoading] = useState(false);
 const [streamingText, setStreamingText] = useState('');
 const [isOpen, setIsOpen] = useState(false);
  // DRAG STATE
 const [position, setPosition] = useState({ x: window.innerWidth - 100, y: window.innerHeight - 100 });
 const [isDragging, setIsDragging] = useState(false);
 const dragOffset = useRef({ x: 0, y: 0 });
 const messagesEndRef = useRef<HTMLDivElement>(null);


 // Auto-scroll to the latest message
 const scrollToBottom = useCallback(() => {
   messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
 }, []);


 useEffect(() => {
   if (isOpen) scrollToBottom();
 }, [messages, streamingText, loading, isOpen, scrollToBottom]);


 // DRAG HANDLERS
 const handleMouseDown = (e: React.MouseEvent) => {
   if (isOpen) return; // Disable drag when chat is open for easier interaction
   setIsDragging(true);
   dragOffset.current = {
     x: e.clientX - position.x,
     y: e.clientY - position.y
   };
 };


 useEffect(() => {
   const handleMouseMove = (e: MouseEvent) => {
     if (isDragging) {
       // Keep within bounds
       const newX = Math.max(20, Math.min(window.innerWidth - 80, e.clientX - dragOffset.current.x));
       const newY = Math.max(20, Math.min(window.innerHeight - 80, e.clientY - dragOffset.current.y));
       setPosition({ x: newX, y: newY });
     }
   };


   const handleMouseUp = () => {
     setIsDragging(false);
   };


   if (isDragging) {
     window.addEventListener('mousemove', handleMouseMove);
     window.addEventListener('mouseup', handleMouseUp);
   }


   return () => {
     window.removeEventListener('mousemove', handleMouseMove);
     window.removeEventListener('mouseup', handleMouseUp);
   };
 }, [isDragging]);


 const handleSend = async (e: React.FormEvent) => {
   e.preventDefault();
   if (!input.trim() || loading) return;


   const userMsgText = input.trim();
   const userMsg: ChatMessage = { role: 'user', text: userMsgText };
  
   const updatedMessages = [...messages, userMsg];
   setMessages(updatedMessages);
   setInput('');
   setLoading(true);
   setStreamingText('');


   try {
     const fullResponse = await chatWithAI(updatedMessages, role, (text) => {
       setStreamingText(text);
     });
     setMessages(prev => [...prev, { role: 'model', text: fullResponse }]);
     setStreamingText('');
   } catch (err) {
     setMessages(prev => [...prev, { role: 'model', text: "I'm sorry, I encountered an error. Please try again." }]);
     setStreamingText('');
   } finally {
     setLoading(false);
   }
 };


 const clearChat = () => {
   setMessages([]);
   setStreamingText('');
   setInput('');
 };


 return (
   <div
     className="fixed z-[999]"
     style={{ left: `${position.x}px`, top: `${position.y}px` }}
   >
     {/* FLOATING ACTION BUTTON */}
     {!isOpen && (
       <button
         onMouseDown={handleMouseDown}
         onClick={() => !isDragging && setIsOpen(true)}
         className={`w-16 h-16 rounded-full bg-gradient-to-br from-indigo-600 to-indigo-800 text-white shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-grab active:cursor-grabbing group relative ${loading ? 'animate-pulse ring-4 ring-indigo-400/30' : ''}`}
       >
         {loading ? (
           <i className="fas fa-circle-notch animate-spin text-xl"></i>
         ) : (
           <i className="fas fa-robot text-2xl group-hover:rotate-12 transition-transform"></i>
         )}
        
         {/* TOOLTIP ON HOVER */}
         <div className="absolute right-full mr-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap border border-white/10 shadow-xl">
           Ask {role} Assistant
         </div>
       </button>
     )}


     {/* EXPANDED CHAT WINDOW */}
     {isOpen && (
       <div
         className="bg-indigo-600 dark:bg-indigo-700 w-[350px] sm:w-[400px] h-[500px] rounded-[2.5rem] text-white shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] flex flex-col transition-all duration-300 animate-in zoom-in-95 slide-in-from-bottom-10"
         style={{ transform: 'translate(-85%, -85%)' }}
       >
         {/* HEADER */}
         <div className="flex justify-between items-center p-6 pb-4 shrink-0 border-b border-white/10">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
               <i className="fas fa-robot"></i>
             </div>
             <div>
               <p className="text-[10px] font-black uppercase tracking-widest opacity-60">MOMO AI</p>
               <span className="text-xs font-black uppercase">{role} Partner</span>
             </div>
           </div>
           <div className="flex items-center gap-2">
             <button
               onClick={clearChat}
               className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
               title="Clear Chat"
             >
               <i className="fas fa-trash-alt text-[10px]"></i>
             </button>
             <button
               onClick={() => setIsOpen(false)}
               className="w-8 h-8 rounded-xl bg-white text-indigo-600 flex items-center justify-center transition-all hover:bg-slate-100"
             >
               <i className="fas fa-times text-xs"></i>
             </button>
           </div>
         </div>


         {/* MESSAGES */}
         <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-4">
           {messages.length === 0 && !streamingText && !loading && (
             <div className="h-full flex flex-col items-center justify-center text-center opacity-50 space-y-4">
               <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                 <i className="fas fa-comment-dots text-3xl"></i>
               </div>
               <p className="text-sm font-bold leading-relaxed px-4">
                 "Hi! Ask me anything related to your {role.toLowerCase()} work. I'm here to help you stay in the flow."
               </p>
             </div>
           )}


           {messages.map((m, idx) => (
             <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
               <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-[13px] font-bold leading-relaxed ${
                 m.role === 'user'
                   ? 'bg-white/15 text-white rounded-tr-none'
                   : 'bg-white text-indigo-900 rounded-tl-none shadow-lg'
               }`}>
                 {m.text}
               </div>
             </div>
           ))}


           {loading && !streamingText && (
             <div className="flex justify-start">
               <div className="px-4 py-3 rounded-2xl bg-white text-indigo-900 rounded-tl-none shadow-lg flex items-center gap-2">
                 <div className="w-3 h-3 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                 <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Thinking...</span>
               </div>
             </div>
           )}


           {streamingText && (
             <div className="flex justify-start">
               <div className="max-w-[85%] px-4 py-3 rounded-2xl text-[13px] font-bold leading-relaxed bg-white text-indigo-900 rounded-tl-none shadow-lg">
                 {streamingText}
                 <span className="inline-block w-1 h-3 ml-1 bg-indigo-400 animate-pulse"></span>
               </div>
             </div>
           )}
           <div ref={messagesEndRef} />
         </div>


         {/* INPUT */}
         <div className="p-6 pt-0 mt-auto">
           <form onSubmit={handleSend} className="relative">
             <input
               type="text"
               placeholder="Message your assistant..."
               className="w-full bg-white/10 border-2 border-white/10 rounded-2xl py-4 pl-4 pr-12 text-sm font-bold placeholder:text-white/40 focus:bg-white/20 focus:border-indigo-300 outline-none transition-all shadow-inner"
               value={input}
               onChange={(e) => setInput(e.target.value)}
               disabled={loading}
             />
             <button
               disabled={loading || !input.trim()}
               className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-white text-indigo-600 flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 disabled:opacity-30 transition-all"
             >
               {loading ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-paper-plane"></i>}
             </button>
           </form>
         </div>
       </div>
     )}
   </div>
 );
};


export default AIAssistant;



