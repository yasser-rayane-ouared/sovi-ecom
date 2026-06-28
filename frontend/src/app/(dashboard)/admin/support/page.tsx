"use client";

import React, { useState, useEffect, useRef } from "react";
import api from "../../../../lib/api";
import { useLanguageStore } from "../../../../stores/language";
import { Card, CardContent } from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { 
  Send, Loader2, Image as ImageIcon, Mic, X, Play, Pause, Trash2, 
  MessageSquare, Headphones, Check, CheckCheck, Store, ChevronLeft, Search
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ChatSnippet {
  store_id: string;
  store_name: string;
  store_subdomain: string;
  store_logo: string | null;
  unread_count: number;
  latest_message: {
    text: string;
    message_type: "text" | "image" | "audio";
    created_at: string;
    sender_role: "store_owner" | "website_admin";
  };
}

interface Message {
  id: string;
  sender_role: "store_owner" | "website_admin";
  message_type: "text" | "image" | "audio";
  text: string;
  file_attachment_url: string | null;
  created_at: string;
  is_read_by_admin: boolean;
  is_read_by_owner: boolean;
}

export default function AdminSupportInbox() {
  const { isRtl } = useLanguageStore();

  const [chats, setChats] = useState<ChatSnippet[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [selectedChatDetails, setSelectedChatDetails] = useState<{
    store_name: string;
    store_subdomain: string;
  } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingChats, setFetchingChats] = useState(true);
  const [fetchingMessages, setFetchingMessages] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const formatTime = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      let sanitized = dateStr;
      const match = dateStr.match(/\.(\d+)(Z|[+-]\d{2}:?\d{2})?$/);
      if (match) {
        const ms = match[1].substring(0, 3);
        const timezone = match[2] || "";
        sanitized = dateStr.replace(/\.\d+(Z|[+-]\d{2}:?\d{2})?$/, `.${ms}${timezone}`);
      }
      const d = new Date(sanitized);
      if (isNaN(d.getTime())) {
        const parts = dateStr.split('T');
        if (parts.length > 1) {
          const timeParts = parts[1].split(':');
          if (timeParts.length > 1) {
            return `${timeParts[0]}:${timeParts[1]}`;
          }
        }
        return "";
      }
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return "";
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      let sanitized = dateStr;
      const match = dateStr.match(/\.(\d+)(Z|[+-]\d{2}:?\d{2})?$/);
      if (match) {
        const ms = match[1].substring(0, 3);
        const timezone = match[2] || "";
        sanitized = dateStr.replace(/\.\d+(Z|[+-]\d{2}:?\d{2})?$/, `.${ms}${timezone}`);
      }
      const d = new Date(sanitized);
      if (isNaN(d.getTime())) {
        const parts = dateStr.split('T');
        if (parts.length > 0) return parts[0];
        return "";
      }
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch (e) {
      return "";
    }
  };

  // Attachment states (images)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Audio recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayingRecordPreview, setIsPlayingRecordPreview] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Fetch active chats
  const fetchChats = () => {
    api.get("/support/admin/chats/")
      .then((res) => {
        setChats(res.data);
      })
      .catch(() => {})
      .finally(() => setFetchingChats(false));
  };

  // Poll chats list and active chat messages
  useEffect(() => {
    fetchChats();
    const chatInterval = setInterval(fetchChats, 6000);
    return () => clearInterval(chatInterval);
  }, []);

  const fetchActiveMessages = (chatId: string) => {
    api.get(`/support/admin/chats/${chatId}/`)
      .then((res) => {
        setSelectedChatDetails({
          store_name: res.data.store_name,
          store_subdomain: res.data.store_subdomain
        });
        setMessages(res.data.messages);
      })
      .catch(() => {})
      .finally(() => setFetchingMessages(false));
  };

  useEffect(() => {
    if (!selectedChatId) return;
    setFetchingMessages(true);
    fetchActiveMessages(selectedChatId);
    
    const msgInterval = setInterval(() => {
      fetchActiveMessages(selectedChatId);
    }, 4000);

    return () => clearInterval(msgInterval);
  }, [selectedChatId]);

  // Image Upload handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert(isRtl ? "حجم الصورة يجب أن لا يتجاوز 5 ميغابايت." : "Image size must not exceed 5MB.");
        return;
      }
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
      clearAudioRecording();
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (filePreview) URL.revokeObjectURL(filePreview);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Voice Recording handlers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(audioBlob);
        setAudioUrl(URL.createObjectURL(audioBlob));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      removeSelectedFile();

      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Audio recording failed:", err);
      alert(isRtl ? "فشل الوصول إلى الميكروفون. يرجى تفعيل الصلاحية." : "Microphone access denied. Please grant permission.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const clearAudioRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
    setRecordingDuration(0);
    setAudioBlob(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setIsPlayingRecordPreview(false);
  };

  const togglePlayRecordPreview = () => {
    if (!audioUrl) return;
    if (isPlayingRecordPreview) {
      previewAudioRef.current?.pause();
      setIsPlayingRecordPreview(false);
    } else {
      if (!previewAudioRef.current) {
        previewAudioRef.current = new Audio(audioUrl);
        previewAudioRef.current.onended = () => setIsPlayingRecordPreview(false);
      }
      previewAudioRef.current.play();
      setIsPlayingRecordPreview(true);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Submit reply
  const handleSendReply = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedChatId || loading) return;

    const hasText = inputText.trim().length > 0;
    const hasImage = !!selectedFile;
    const hasAudio = !!audioBlob;

    if (!hasText && !hasImage && !hasAudio) return;

    setLoading(true);
    const formData = new FormData();

    if (hasImage) {
      formData.append("message_type", "image");
      formData.append("file_attachment", selectedFile);
      formData.append("text", inputText);
    } else if (hasAudio && audioBlob) {
      formData.append("message_type", "audio");
      formData.append("file_attachment", new File([audioBlob], "voice_reply.webm", { type: "audio/webm" }));
      formData.append("text", "");
    } else {
      formData.append("message_type", "text");
      formData.append("text", inputText);
    }

    try {
      const res = await api.post(`/support/admin/chats/${selectedChatId}/`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setMessages((prev) => [...prev, res.data]);
      setInputText("");
      removeSelectedFile();
      clearAudioRecording();
      fetchChats(); // Refresh unread count/last message
    } catch (err) {
      alert(isRtl ? "حدث خطأ أثناء إرسال الرد." : "An error occurred while sending the reply.");
    } finally {
      setLoading(false);
    }
  };

  // Filter chats based on search query
  const filteredChats = chats.filter(c => 
    c.store_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.store_subdomain.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`min-h-[500px] flex flex-col text-foreground ${isRtl ? "font-cairo text-right" : "font-sans text-left"}`} dir={isRtl ? "rtl" : "ltr"}>
      {/* Page Title */}
      <div className="border-b border-border pb-4 mb-4">
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-primary" />
          <span>{isRtl ? "صندوق محادثات الدعم الفني" : "Support Chats Inbox"}</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isRtl ? "الرد على استفسارات ملاك المتاجر وحل مشاكلهم الفنية." : "Reply to store owners' queries and help solve their technical issues."}
        </p>
      </div>

      {/* Inbox Split Pane */}
      <div className="flex-grow flex gap-6 min-h-0">
        
        {/* Left Side: Chats list (hidden on mobile when a chat is selected) */}
        <div className={`w-full md:w-80 xl:w-96 flex flex-col bg-card border border-border rounded-2xl flex-shrink-0 h-[450px] md:h-[550px] ${
          selectedChatId ? "hidden md:flex" : "flex"
        }`}>
          {/* Search bar */}
          <div className="p-4 border-b border-border relative">
            <Search className={`absolute top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4 ${isRtl ? 'right-7' : 'left-7'}`} />
            <Input
              placeholder={isRtl ? "بحث عن متجر..." : "Search store..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`h-9 bg-secondary/30 ${isRtl ? "pr-9 pl-3 text-right" : "pl-9 pr-3 text-left"}`}
            />
          </div>

          {/* List of active threads */}
          <div className="flex-grow overflow-y-auto custom-scrollbar p-2 space-y-1">
            {fetchingChats ? (
              <div className="py-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : filteredChats.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                {isRtl ? "لا توجد محادثات نشطة" : "No active support chats found."}
              </div>
            ) : (
              filteredChats.map((c) => {
                const isActive = selectedChatId === c.store_id;
                const snippet = c.latest_message.message_type === "audio" 
                  ? (isRtl ? "🎙️ رسالة صوتية" : "🎙️ Voice Message")
                  : c.latest_message.message_type === "image"
                    ? (isRtl ? "🖼️ صورة مرفقة" : "🖼️ Image Attachment")
                    : c.latest_message.text;

                return (
                  <button
                    key={c.store_id}
                    onClick={() => setSelectedChatId(c.store_id)}
                    className={`w-full flex items-start gap-3 p-3 rounded-xl transition-all text-start relative border ${
                      isActive 
                        ? "bg-primary/10 border-primary/20 text-foreground" 
                        : "border-transparent hover:bg-secondary/40 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {/* Store Logo */}
                    <div className="h-10 w-10 rounded-lg bg-secondary border flex items-center justify-center flex-shrink-0 text-muted-foreground overflow-hidden">
                      {c.store_logo ? (
                        <img src={c.store_logo} alt="Store Logo" className="h-full w-full object-cover" />
                      ) : (
                        <Store className="h-5 w-5 text-primary" />
                      )}
                    </div>

                    {/* Chat snippet details */}
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground truncate">{c.store_name}</span>
                        <span className="text-[10px] text-muted-foreground font-outfit">
                          {formatDate(c.latest_message.created_at)}
                        </span>
                      </div>
                      <span className="text-[10px] text-accent block font-outfit truncate">{c.store_subdomain}.sovi.com</span>
                      <p className="text-xs truncate font-cairo pr-2 text-muted-foreground">
                        {snippet}
                      </p>
                    </div>

                    {/* Unread badge */}
                    {c.unread_count > 0 && (
                      <span className="absolute bottom-3 right-3 h-5 min-w-[20px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center font-outfit shadow-md">
                        {c.unread_count}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Chat box content */}
        <div className={`flex-grow flex flex-col bg-secondary/5 border border-border rounded-2xl relative p-4 min-h-[450px] md:min-h-[550px] ${
          !selectedChatId ? "hidden md:flex items-center justify-center text-center text-muted-foreground" : "flex"
        }`}>
          {!selectedChatId ? (
            <div className="max-w-sm space-y-3 my-auto mx-auto">
              <div className="h-16 w-16 rounded-full bg-secondary border flex items-center justify-center mx-auto text-primary">
                <MessageSquare className="h-8 w-8" />
              </div>
              <h3 className="text-base font-bold text-foreground">{isRtl ? "اختر محادثة للبدء" : "Select a conversation to reply"}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                انقر على أحد المتاجر في القائمة الجانبية لعرض تاريخ الرسائل والرد عليها بمحادثة دعم فورية ومباشرة.
              </p>
            </div>
          ) : (
            <div className="flex-grow flex flex-col justify-between">
              
              {/* Active Chat Header */}
              <div className="border-b border-border pb-3 mb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => { setSelectedChatId(null); setSelectedChatDetails(null); }}
                    variant="ghost"
                    className="md:hidden h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <div>
                    <h3 className="text-sm font-black text-foreground">
                      {selectedChatDetails?.store_name || "تحميل تفاصيل المتجر..."}
                    </h3>
                    <span className="text-[10px] text-accent block font-outfit">
                      {selectedChatDetails?.store_subdomain ? `${selectedChatDetails.store_subdomain}.sovi.com` : ""}
                    </span>
                  </div>
                </div>

                <div className="text-[10px] text-muted-foreground uppercase font-bold bg-secondary/80 py-1 px-2.5 rounded-lg border border-border font-outfit">
                  Store ID: {selectedChatId.substring(0, 8)}...
                </div>
              </div>

              {/* Message scroll area */}
              <div className="flex-grow h-[300px] md:h-[400px] overflow-y-auto pr-1 pl-1 space-y-4 custom-scrollbar mb-4 flex flex-col">
                {fetchingMessages && messages.length === 0 ? (
                  <div className="flex-grow flex flex-col items-center justify-center gap-2 text-slate-400 min-h-[200px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span>جاري تحميل الرسائل...</span>
                  </div>
                ) : (
                  <AnimatePresence initial={false}>
                    {messages.map((msg) => {
                      const isMe = msg.sender_role === "website_admin";
                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex gap-3 max-w-[80%] ${isMe ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                        >
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${
                            isMe ? "bg-primary/10 border-primary/20 text-primary" : "bg-accent/10 border-accent/20 text-accent"
                          }`}>
                            <span className="text-[10px] font-bold">{isMe ? "Admin" : "Owner"}</span>
                          </div>

                          <div className="space-y-1">
                            <Card className={`border-none rounded-2xl p-3.5 shadow-sm ${
                              isMe ? "bg-primary text-primary-foreground" : "bg-card text-foreground border border-border"
                            }`}>
                              {msg.message_type === "image" && msg.file_attachment_url && (
                                <div className="mb-2 rounded-lg overflow-hidden border border-black/10 max-w-sm">
                                  <img src={msg.file_attachment_url} alt="Attachment" className="max-h-60 w-full object-contain bg-black/5" />
                                </div>
                              )}

                              {msg.message_type === "audio" && msg.file_attachment_url && (
                                <div className="py-2 px-1 flex items-center gap-3 min-w-[240px]">
                                  <div className="h-8 w-8 rounded-full bg-black/10 flex items-center justify-center text-current flex-shrink-0">
                                    <Mic className="h-4 w-4" />
                                  </div>
                                  <audio src={msg.file_attachment_url} controls className="h-8 max-w-xs focus:outline-none" />
                                </div>
                              )}

                              {msg.text && (
                                <p className="text-sm leading-relaxed whitespace-pre-line break-words font-cairo">
                                  {msg.text}
                                </p>
                              )}
                            </Card>

                            <div className={`text-[10px] text-muted-foreground flex items-center gap-1.5 ${isMe ? "justify-end" : "justify-start"}`}>
                              <span>{formatTime(msg.created_at)}</span>
                              {isMe && (
                                msg.is_read_by_owner ? (
                                  <CheckCheck className="h-3 w-3 text-sky-400" />
                                ) : (
                                  <Check className="h-3 w-3 text-muted-foreground" />
                                )
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Attachment Previews */}
              <div className="space-y-2">
                {filePreview && (
                  <div className="p-3 bg-card border border-border rounded-xl flex items-center justify-between max-w-sm animate-fade-in">
                    <div className="flex items-center gap-3">
                      <div className="h-14 w-14 rounded-lg overflow-hidden border bg-muted flex-shrink-0">
                        <img src={filePreview} alt="Preview" className="h-full w-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold block truncate">{selectedFile?.name}</span>
                        <span className="text-[10px] text-muted-foreground block">{(selectedFile!.size / 1024).toFixed(1)} KB</span>
                      </div>
                    </div>
                    <Button onClick={removeSelectedFile} variant="ghost" className="h-8 w-8 p-0 text-red-500 hover:bg-red-500/10">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {isRecording && (
                  <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl flex items-center justify-between animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="h-3.5 w-3.5 rounded-full bg-red-500 animate-ping"></div>
                      <span className="text-xs font-bold text-red-400">{isRtl ? "جاري تسجيل الرد الصوتي..." : "Recording voice reply..."}</span>
                      <span className="text-sm font-semibold text-muted-foreground font-outfit">{formatDuration(recordingDuration)}</span>
                    </div>
                    <Button onClick={stopRecording} variant="destructive" size="sm" className="font-bold">
                      Stop
                    </Button>
                  </div>
                )}

                {audioUrl && !isRecording && (
                  <div className="p-3 bg-card border border-border rounded-xl flex items-center justify-between max-w-md animate-fade-in">
                    <div className="flex items-center gap-3 flex-grow">
                      <Button onClick={togglePlayRecordPreview} variant="secondary" className="h-9 w-9 p-0 rounded-full flex-shrink-0">
                        {isPlayingRecordPreview ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <div className="flex-grow">
                        <span className="text-xs font-bold block">{isRtl ? "معاينة التسجيل الصوتي" : "Voice Recording Preview"}</span>
                        <span className="text-[10px] text-muted-foreground block font-outfit">Voice Note (WebM)</span>
                      </div>
                    </div>
                    <Button onClick={clearAudioRecording} variant="ghost" className="h-8 w-8 p-0 text-red-500 hover:bg-red-500/10">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* Reply Form */}
                <form onSubmit={handleSendReply} className="flex gap-2.5 items-center">
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      ref={fileInputRef}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      variant="ghost"
                      className="h-10 w-10 p-0 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground"
                      disabled={loading || isRecording}
                    >
                      <ImageIcon className="h-5 w-5" />
                    </Button>

                    <Button
                      type="button"
                      onMouseDown={startRecording}
                      onMouseUp={stopRecording}
                      onTouchStart={startRecording}
                      onTouchEnd={stopRecording}
                      variant="ghost"
                      className={`h-10 w-10 p-0 rounded-xl hover:bg-secondary ${
                        isRecording ? 'text-red-500 bg-red-500/10 animate-bounce' : 'text-muted-foreground hover:text-foreground'
                      }`}
                      disabled={loading || !!audioUrl}
                    >
                      <Mic className="h-5 w-5" />
                    </Button>
                  </div>

                  <Input
                    placeholder={audioUrl ? "الرسالة الصوتية جاهزة للإرسال..." : (isRtl ? "اكتب ردك ومساعدتك للمتجر هنا..." : "Type your reply/assistance to the merchant...")}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    disabled={loading || isRecording || !!audioUrl}
                    className="flex-grow h-11"
                  />

                  <Button
                    type="submit"
                    variant="glow"
                    disabled={loading || isRecording || (!inputText.trim() && !selectedFile && !audioUrl)}
                    className="h-11 px-5 rounded-xl font-bold flex items-center gap-2"
                  >
                    {loading ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <Send className="h-4.5 w-4.5" />}
                    <span className="hidden sm:inline">{isRtl ? "إرسال الرد" : "Send Reply"}</span>
                  </Button>
                </form>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
}
