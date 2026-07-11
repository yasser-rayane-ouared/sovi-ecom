"use client";

import React, { useState, useEffect, useRef } from "react";
import api from "../../../lib/api";
import { useDashboardStore } from "../../../stores/dashboard";
import { useLanguageStore } from "../../../stores/language";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { 
  Send, Loader2, Image as ImageIcon, Mic, X, Play, Pause, Trash2, 
  HelpCircle, MessageSquare, Headphones, FileText, Check, CheckCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Inline CSS styles for SVG icons or items - Declared at top to avoid TDZ ReferenceError
const Mail = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
  </svg>
);

const Phone = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.824-1.502-5.176-3.854-6.678-6.678l1.293-.97a1.248 1.248 0 0 0 .417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
  </svg>
);

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

export default function SupportChatPage() {
  const { selectedStore } = useDashboardStore();
  const { isRtl, language } = useLanguageStore();
  const storeId = selectedStore?.id;

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
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

  // File states (for images)
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

  const localLabels = {
    title: isRtl ? "الدعم الفني المباشر" : "Direct Live Support",
    desc: isRtl ? "تواصل مباشرة مع إدارة المنصة لحل المشاكل أو طلب المساعدة الفنية." : "Chat directly with website admins for support or technical requests.",
    placeholder: isRtl ? "اكتب رسالتك هنا..." : "Type your message here...",
    supportStatus: isRtl ? "متصل" : "Online",
    supportTeam: isRtl ? "فريق دعم Sovi" : "Sovi Support Team",
    recordSpeech: isRtl ? "تحدث الآن..." : "Speak now...",
    voiceMessage: isRtl ? "رسالة صوتية" : "Voice Message",
    previewVoice: isRtl ? "معاينة التسجيل" : "Preview Recording",
    cancel: isRtl ? "إلغاء" : "Cancel",
    send: isRtl ? "إرسال" : "Send",
    quickFAQ: isRtl ? "الأسئلة الشائعة" : "Quick Support Info",
    faq1: isRtl ? "كيف يتم تجديد الاشتراك؟" : "How to renew subscription?",
    faq2: isRtl ? "كيفية ربط شركة شحن جديدة؟" : "How to link shipping carrier?",
    faq3: isRtl ? "مشاكل في مزامنة Google Sheets" : "Google Sheets sync issue?",
    faqAnswer: isRtl ? "يمكنك طرح هذه الأسئلة مباشرة على الدعم وسيقوم المشرف بالرد عليك." : "You can ask these questions directly here, and the admin will reply shortly."
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const fetchMessages = () => {
    if (!storeId) return;
    api.get(`/support/messages/?store_id=${storeId}`)
      .then((res) => {
        setMessages(res.data);
      })
      .catch(() => {})
      .finally(() => setFetching(false));
  };

  // Poll for replies every 5 seconds
  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [storeId]);

  // Handle Image File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert(isRtl ? "حجم الصورة يجب أن لا يتجاوز 5 ميغابايت." : "Image size must not exceed 5MB.");
        return;
      }
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
      // Cancel any voice record previews
      clearAudioRecording();
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (filePreview) URL.revokeObjectURL(filePreview);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Voice Recording Functions
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
        
        // Stop all audio tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      
      // Cancel any file upload previews
      removeSelectedFile();

      // Start duration timer
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

  // Submit Message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!storeId || loading) return;

    // Check if there is anything to send
    const hasText = inputText.trim().length > 0;
    const hasImage = !!selectedFile;
    const hasAudio = !!audioBlob;

    if (!hasText && !hasImage && !hasAudio) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("store_id", storeId);

    if (hasImage) {
      formData.append("message_type", "image");
      formData.append("file_attachment", selectedFile);
      formData.append("text", inputText);
    } else if (hasAudio && audioBlob) {
      formData.append("message_type", "audio");
      formData.append("file_attachment", new File([audioBlob], "voice_message.webm", { type: "audio/webm" }));
      formData.append("text", "");
    } else {
      formData.append("message_type", "text");
      formData.append("text", inputText);
    }

    try {
      const res = await api.post("/support/messages/", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setMessages((prev) => [...prev, res.data]);
      setInputText("");
      removeSelectedFile();
      clearAudioRecording();
    } catch (err) {
      alert(isRtl ? "حدث خطأ أثناء إرسال الرسالة." : "An error occurred while sending the message.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-[500px] flex flex-col justify-between text-foreground ${isRtl ? "font-cairo text-right" : "font-sans text-left"}`} dir={isRtl ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary animate-pulse" /> {localLabels.title}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{localLabels.desc}</p>
        </div>

        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
          <span>{localLabels.supportTeam} ({localLabels.supportStatus})</span>
        </div>
      </div>

      {/* Main Body Grid */}
      <div className="flex-grow my-4 grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Chat History Box (75% width) */}
        <div className="xl:col-span-3 flex flex-col justify-between bg-secondary/5 rounded-2xl border border-border p-4 md:p-6 relative">
          {fetching ? (
            <div className="flex-grow flex flex-col items-center justify-center text-slate-400 gap-2 min-h-[300px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span>جاري تحميل المحادثة...</span>
            </div>
          ) : (
            <div className="flex-grow h-[350px] md:h-[450px] overflow-y-auto pr-1 pl-1 space-y-4 custom-scrollbar mb-4 flex flex-col">
              {messages.length === 0 ? (
                <div className="my-auto flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto py-6">
                  <div className="h-16 w-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shadow-lg shadow-primary/5 flex-shrink-0">
                    <Headphones className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">لا توجد رسائل سابقة</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    أرسل استفسارك أو طلبك هنا وسيقوم مسؤول الموقع بالرد عليك في أقرب وقت ممكن. يمكنك إرسال نصوص وصور أو رسائل صوتية.
                  </p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {messages.map((msg) => {
                    const isMe = msg.sender_role === "store_owner";
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-3 max-w-[80%] ${isMe ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                      >
                        {/* Avatar */}
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${
                          isMe ? "bg-primary/10 border-primary/20 text-primary" : "bg-accent/10 border-accent/20 text-accent"
                        }`}>
                          <span className="text-[10px] font-bold">{isMe ? "Owner" : "Admin"}</span>
                        </div>

                        {/* Bubble */}
                        <div className="space-y-1">
                          <Card className={`border-none rounded-2xl p-3.5 shadow-sm ${
                            isMe ? "bg-primary text-primary-foreground" : "bg-card text-foreground border border-border"
                          }`}>
                            {/* Image Message */}
                            {msg.message_type === "image" && msg.file_attachment_url && (
                              <div className="mb-2 rounded-lg overflow-hidden border border-black/10 max-w-sm">
                                <img src={msg.file_attachment_url} alt="Attachment" className="max-h-60 w-full object-contain bg-black/5" />
                              </div>
                            )}

                            {/* Voice Message */}
                            {msg.message_type === "audio" && msg.file_attachment_url && (
                              <div className="py-2.5 px-1 flex items-center gap-3 min-w-[240px]">
                                <div className="h-9 w-9 rounded-full bg-black/10 flex items-center justify-center text-current flex-shrink-0">
                                  <Mic className="h-4.5 w-4.5" />
                                </div>
                                <audio src={msg.file_attachment_url} controls className="h-8 max-w-xs focus:outline-none" />
                              </div>
                            )}

                            {/* Text content */}
                            {msg.text && (
                              <p className="text-sm leading-relaxed whitespace-pre-line break-words font-cairo">
                                {msg.text}
                              </p>
                            )}
                          </Card>

                          {/* Timestamp & read receipt */}
                          <div className={`text-[10px] text-muted-foreground flex items-center gap-1.5 ${isMe ? "justify-end" : "justify-start"}`}>
                            <span>{formatTime(msg.created_at)}</span>
                            {isMe && (
                              msg.is_read_by_admin ? (
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
          )}

          {/* Previews and Recording Actions Drawer */}
          <div className="space-y-3">
            {/* File attachment preview */}
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

            {/* Voice Recording panel */}
            {isRecording && (
              <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="h-3.5 w-3.5 rounded-full bg-red-500 animate-ping"></div>
                  <span className="text-xs font-bold text-red-400">{localLabels.recordSpeech}</span>
                  <span className="text-sm font-semibold text-muted-foreground font-outfit">{formatDuration(recordingDuration)}</span>
                </div>
                <Button onClick={stopRecording} variant="destructive" size="sm" className="font-bold flex items-center gap-1.5">
                  <Pause className="h-3.5 w-3.5" /> Stop
                </Button>
              </div>
            )}

            {/* Recorded Audio preview before send */}
            {audioUrl && !isRecording && (
              <div className="p-3.5 bg-card border border-border rounded-xl flex items-center justify-between max-w-md animate-fade-in">
                <div className="flex items-center gap-3.5 flex-grow">
                  <Button onClick={togglePlayRecordPreview} variant="secondary" className="h-9 w-9 p-0 rounded-full flex-shrink-0">
                    {isPlayingRecordPreview ? <Pause className="h-4.5 w-4.5" /> : <Play className="h-4.5 w-4.5" />}
                  </Button>
                  <div className="flex-grow">
                    <span className="text-xs font-bold block">{localLabels.previewVoice}</span>
                    <span className="text-[10px] text-muted-foreground block font-outfit">Voice Note (WebM format)</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={clearAudioRecording} variant="ghost" className="h-8 w-8 p-0 text-red-500 hover:bg-red-500/10">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Input Form Bar */}
            <form onSubmit={handleSendMessage} className="flex gap-2.5 items-center">
              {/* Media tools */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {/* Image upload button */}
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

                {/* Voice Record button */}
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
                  title="Hold to Record Voice Message"
                >
                  <Mic className="h-5 w-5" />
                </Button>
              </div>

              {/* Message inputs */}
              <Input
                placeholder={audioUrl ? "رسالة صوتية جاهزة للإرسال..." : localLabels.placeholder}
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
                <span className="hidden sm:inline">{localLabels.send}</span>
              </Button>
            </form>
          </div>
        </div>

        {/* Support Information sidebar (25% width) */}
        <div className="hidden xl:flex flex-col gap-6 xl:col-span-1">
          {/* FAQ Card */}
          <Card className="border-border">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2 text-primary font-bold">
                <HelpCircle className="h-5 w-5" />
                <span className="text-sm font-black">{localLabels.quickFAQ}</span>
              </div>
              <div className="space-y-3.5 text-xs">
                <div className="p-3 bg-secondary/30 rounded-xl font-semibold text-foreground hover:bg-secondary/50 cursor-pointer transition-all">
                  {localLabels.faq1}
                </div>
                <div className="p-3 bg-secondary/30 rounded-xl font-semibold text-foreground hover:bg-secondary/50 cursor-pointer transition-all">
                  {localLabels.faq2}
                </div>
                <div className="p-3 bg-secondary/30 rounded-xl font-semibold text-foreground hover:bg-secondary/50 cursor-pointer transition-all">
                  {localLabels.faq3}
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed pt-2">
                  {localLabels.faqAnswer}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* SLA info card */}
          <Card className="border-border bg-gradient-to-br from-card to-secondary/10">
            <CardContent className="p-5 space-y-3">
              <h4 className="text-xs font-extrabold uppercase text-accent tracking-wider">ساعات العمل / Working Hours</h4>
              <p className="text-xs leading-relaxed text-muted-foreground font-semibold">
                فريق الدعم متواجد للرد على طلباتكم من السبت إلى الخميس، من الساعة 09:00 صباحاً حتى 06:00 مساءً.
              </p>
              <div className="border-t border-border pt-3 mt-3 flex flex-col gap-2 text-xs">
                <div className="flex items-center gap-2 text-muted-foreground font-medium">
                  <Mail className="h-4 w-4" /> sovi.algeria@gmail.com
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
