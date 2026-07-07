import { useState, useRef, useEffect } from "react";
import { Message, Language, Patient, Clinic, QueueItem } from "../lib/types";
import { translations } from "../lib/translations";
import { processInput } from "../lib/intentEngine";
import { useClinicData } from "../hooks/useClinicData";
import { ClinicCard } from "./ClinicCard";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Send, Phone, MapPin, Heart, ArrowLeft, MoreVertical } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export function ChatInterface() {
  const { queue, patients, clinics, addToQueue, callNext, updatePatientNotes } = useClinicData();
  const [lang, setLang] = useState<Language>("en");
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: translations.en.welcome }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [pendingAction, setPendingAction] = useState<{ type: string; data?: any } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const t = translations[lang];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const addMessage = (role: "user" | "assistant", content: string, type: Message["type"] = "text", data?: any) => {
    setMessages(prev => [...prev, { role, content, type, data }]);
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userText = inputValue.trim();
    addMessage("user", userText);
    setInputValue("");

    // Multi-turn handling
    if (pendingAction) {
       handlePendingAction(userText);
       return;
    }

    // Default intent processing
    const result = processInput(userText, lang, { 
      queue, patients, clinics, addToQueue, callNext, updatePatientNotes 
    });

    if (result.newLang) {
      setLang(result.newLang);
    }

    if (result.type) {
      setPendingAction({ type: result.type });
    }

    addMessage("assistant", result.response);
  };

  const handlePendingAction = (input: string) => {
    if (!pendingAction) return;

    const lowerInput = input.toLowerCase();

    // 1. New Patient Registration
    if (pendingAction.type === "waiting_for_name") {
      const existing = patients.find(p => p.name.toLowerCase() === lowerInput);
      const ticket = addToQueue(input);
      const waitTime = Math.max(0, (queue.filter(q => q.status === "Waiting").length) * 10);
      
      let response = t.patient_registered
        .replace("{ticket}", ticket.ticket_number.toString())
        .replace("{wait}", waitTime.toString());

      if (existing) {
        response = t.welcome_back.replace("{name}", existing.name).replace("{date}", existing.last_visit) + " " + response;
      }
      
      addMessage("assistant", response);
      setPendingAction(null);
    }

    // 2. Queue Status Query
    else if (pendingAction.type === "waiting_for_ticket_query") {
      const item = queue.find(q => 
        q.ticket_number.toString() === input || 
        q.patient_name.toLowerCase().includes(lowerInput)
      );

      if (!item) {
        addMessage("assistant", t.not_found);
      } else {
        const serving = queue.find(q => q.status === "With Doctor");
        const ahead = queue.filter(q => q.status === "Waiting" && q.ticket_number < item.ticket_number).length;
        const wait = ahead * 10;

        if (item.status === "With Doctor") {
            addMessage("assistant", lang === "en" ? "You are currently with the doctor!" : "O wa pelu dokita lowolowo!");
        } else if (item.status === "Done") {
            addMessage("assistant", lang === "en" ? "Your session is already complete." : "O ti pari itoju re.");
        } else {
            addMessage("assistant", t.queue_status
                .replace("{ticket}", item.ticket_number.toString())
                .replace("{serving}", serving?.ticket_number.toString() || "0")
                .replace("{ahead}", ahead.toString())
                .replace("{wait}", wait.toString())
            );
        }
      }
      setPendingAction(null);
    }

    // 3. Health Record Lookup
    else if (pendingAction.type === "waiting_for_record_name") {
      const patient = patients.find(p => p.name.toLowerCase().includes(lowerInput));
      if (!patient) {
        addMessage("assistant", t.not_found);
      } else {
        const response = t.record_found
          .replace("{last_visit}", patient.last_visit)
          .replace("{next_appointment}", patient.next_appointment)
          .replace("{notes}", patient.notes);
        
        addMessage("assistant", response);
        addMessage("assistant", "Health Summary Card", "card", patient);
        
        // Reminder check (within 3 days - mock logic)
        if (patient.next_appointment.includes("July 2026")) {
           addMessage("assistant", t.appointment_reminder);
        }
      }
      setPendingAction(null);
    }

    // 4. Area Search
    else if (pendingAction.type === "waiting_for_area") {
      const matches = clinics.filter(c => c.area.toLowerCase().includes(lowerInput));
      if (matches.length > 0) {
        addMessage("assistant", lang === "en" ? `Clinics in ${input}:` : `Ile iwosan ni ${input}:`, "clinic-list", matches);
      } else {
        addMessage("assistant", t.no_clinic_found, "clinic-list", clinics);
      }
      setPendingAction(null);
    }

    // 5. Drug Reminder
    else if (pendingAction.type === "waiting_for_drug_name") {
      const patient = patients.find(p => p.name.toLowerCase().includes(lowerInput));
      if (!patient) {
        addMessage("assistant", t.not_found);
      } else {
        // Extract drug from notes
        const meds = ["amlodipine", "paracetamol", "insulin", "antibiotic", "vitamin"];
        const foundMed = meds.find(m => patient.notes.toLowerCase().includes(m));
        
        if (foundMed) {
          addMessage("assistant", t.drug_reminder.replace("{drug}", foundMed), "status", { patient: patient.name, drug: foundMed });
          setPendingAction({ type: "waiting_for_drug_confirmation", data: { patient: patient.name, drug: foundMed } });
        } else {
          addMessage("assistant", t.no_meds);
          setPendingAction(null);
        }
      }
    }

    // 6. Drug Confirmation
    else if (pendingAction.type === "waiting_for_drug_confirmation") {
      const isYes = ["yes", "beeni", "i did", "mo mu", "ok"].some(p => lowerInput.includes(p));
      const { patient, drug } = pendingAction.data;
      
      if (isYes) {
        addMessage("assistant", t.drug_taken);
        updatePatientNotes(patient, `Drug reminder: ${drug} taken on ${new Date().toLocaleDateString()}.`);
      } else {
        addMessage("assistant", t.drug_not_taken);
        updatePatientNotes(patient, `Drug reminder: ${drug} NOT taken on ${new Date().toLocaleDateString()}.`);
      }
      setPendingAction(null);
    }
  };

  const getSalutation = () => {
    // Random Mama/Baba logic or based on name if we had gender
    return Math.random() > 0.5 ? (lang === "en" ? "Mama" : "Mama") : (lang === "en" ? "Baba" : "Baba");
  };

  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <img 
          src="https://storage.googleapis.com/dala-prod-public-storage/generated-images/a38dc2e7-fa38-4cc0-9578-cb0367d7e871/clinic-background-76d86a9c-1783446216037.webp" 
          alt="background" 
          className="w-full h-full object-cover"
        />
      </div>

      {/* Header */}
      <header className="z-10 bg-primary text-primary-foreground p-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border-2 border-white/20">
            <AvatarImage src="https://storage.googleapis.com/dala-prod-public-storage/generated-images/a38dc2e7-fa38-4cc0-9578-cb0367d7e871/oyoclinic-logo-0cef83e1-1783446215007.webp" />
            <AvatarFallback>OC</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-bold text-lg leading-tight">OyoClinic</h1>
            <p className="text-[10px] opacity-80 uppercase tracking-widest">Health Assistant</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="secondary" 
            size="sm" 
            className="text-[10px] h-7 px-2 font-bold"
            onClick={() => {
              const newLang = lang === "en" ? "yo" : "en";
              setLang(newLang);
              addMessage("assistant", translations[newLang].welcome);
              toast.info(translations[newLang].switch_lang);
            }}
          >
            {lang === "en" ? "YORUBA" : "ENGLISH"}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-hidden p-4">
        <ScrollArea className="h-full pr-4" ref={scrollRef}>
          <div className="space-y-6 pb-4">
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[85%] ${msg.role === "user" ? "order-2" : "order-1"}`}>
                    <div className={`rounded-2xl p-3 shadow-sm ${
                      msg.role === "user" 
                        ? "bg-primary text-primary-foreground rounded-tr-none" 
                        : "bg-card border border-border rounded-tl-none"
                    }`}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {msg.role === "assistant" && i === 0 && `${getSalutation()}, `}
                        {msg.content}
                      </p>
                    </div>

                    {/* Rich Components */}
                    {msg.type === "card" && (
                      <div className="mt-3">
                        <ClinicCard patient={msg.data} lang={lang} />
                      </div>
                    )}

                    {msg.type === "clinic-list" && (
                      <div className="mt-3 space-y-2">
                        {msg.data.map((clinic: Clinic, idx: number) => (
                          <div key={idx} className="bg-card border border-border p-3 rounded-lg text-sm shadow-sm">
                            <h4 className="font-bold text-primary mb-1">{clinic.name}</h4>
                            <div className="space-y-1 text-[12px]">
                              <div className="flex items-start gap-2">
                                <MapPin className="w-3 h-3 text-muted-foreground mt-0.5 shrink-0" />
                                <span>{clinic.address} ({clinic.area})</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone className="w-3 h-3 text-muted-foreground shrink-0" />
                                <span>{t.phone}: {clinic.phone}</span>
                              </div>
                              <div className="flex items-center gap-2 text-destructive font-bold">
                                <Phone className="w-3 h-3 shrink-0" />
                                <span>{t.emergency}: {clinic.emergency_phone}</span>
                              </div>
                              <div className="flex items-start gap-2 pt-1 border-t mt-1">
                                <Heart className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                                <span className="text-[11px] italic">{clinic.services}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </div>

      {/* Input */}
      <div className="p-4 bg-background border-t border-border shadow-2xl z-10">
        <div className="flex items-center gap-2 max-w-4xl mx-auto">
          <Input
            placeholder={lang === "en" ? "Ask something..." : "Beere nkan..."}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="flex-1 rounded-full border-primary/20 focus-visible:ring-primary h-11"
          />
          <Button 
            onClick={handleSend} 
            size="icon" 
            className="rounded-full h-11 w-11 shrink-0 shadow-lg"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
        <p className="text-[10px] text-center text-muted-foreground mt-2 px-4 italic leading-tight">
          {t.disclaimer}
        </p>
      </div>
    </div>
  );
}
