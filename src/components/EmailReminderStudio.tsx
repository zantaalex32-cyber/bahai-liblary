import React, { useState } from 'react';
import {
  Mail,
  Sparkles,
  Send,
  AlertTriangle,
  Clock,
  CheckCircle2,
  RefreshCw,
  Zap,
  History,
  User,
  BookOpen,
} from 'lucide-react';
import { Loan, Book, Borrower, EmailReminder } from '../types';
import { apiService } from '../services/apiService';

interface EmailReminderStudioProps {
  loans: Loan[];
  books: Book[];
  borrowers: Borrower[];
  reminders: EmailReminder[];
  onRefreshData: () => Promise<void>;
  preselectedLoanForReminder?: Loan | null;
  onClearPreselection?: () => void;
}

export const EmailReminderStudio: React.FC<EmailReminderStudioProps> = ({
  loans,
  books,
  borrowers,
  reminders,
  onRefreshData,
  preselectedLoanForReminder,
  onClearPreselection,
}) => {
  const overdueLoans = loans.filter((l) => l.status === 'Overdue');

  const [activeLoan, setActiveLoan] = useState<Loan | null>(
    preselectedLoanForReminder || overdueLoans[0] || null
  );

  // Email draft state
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [tone, setTone] = useState('Gentle & Encouraging');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isAutomatingAll, setIsAutomatingAll] = useState(false);
  const [automationResult, setAutomationResult] = useState<string | null>(null);

  const activeBook = books.find((b) => b.id === activeLoan?.bookId);
  const activeBorrower = borrowers.find((br) => br.id === activeLoan?.borrowerId);

  const calculateDaysOverdue = (dueDateStr?: string) => {
    if (!dueDateStr) return 0;
    const dueMs = new Date(dueDateStr).getTime();
    const todayMs = new Date().getTime();
    return Math.max(0, Math.floor((todayMs - dueMs) / (1000 * 3600 * 24)));
  };

  const handleGenerateAiCopy = async () => {
    if (!activeBorrower || !activeBook || !activeLoan) return;

    setIsGeneratingAi(true);
    try {
      const result = await apiService.generateGeminiReminder(
        activeBorrower.name,
        activeBook.title,
        activeLoan.dueDate,
        calculateDaysOverdue(activeLoan.dueDate),
        tone
      );
      setSubject(result.subject);
      setBody(result.body);
    } catch (err: any) {
      console.error('Error generating AI reminder:', err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSendReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLoan) return;

    setIsSending(true);
    try {
      await apiService.sendEmailReminder(activeLoan.id, subject, body);
      await onRefreshData();
      setAutomationResult(`Successfully sent overdue email reminder to ${activeBorrower?.email}!`);
      if (onClearPreselection) onClearPreselection();
    } catch (err) {
      console.error('Error sending email reminder:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleAutomateAll = async () => {
    setIsAutomatingAll(true);
    setAutomationResult(null);
    try {
      const res = await apiService.automateAllOverdueReminders();
      await onRefreshData();
      setAutomationResult(
        `Automated Email Job Completed: ${res.count} overdue reminder email(s) dispatched!`
      );
    } catch (err) {
      console.error('Error running automated reminders:', err);
    } finally {
      setIsAutomatingAll(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-amber-950 rounded-2xl p-6 text-stone-100 shadow-xl border border-stone-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="bg-amber-500/20 text-amber-300 text-xs font-mono px-2.5 py-1 rounded-md border border-amber-500/30 font-semibold tracking-wide">
            AUTOMATED COMMUNICATIONS
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold mt-2 text-white">
            Overdue Email Reminders Studio
          </h2>
          <p className="text-stone-300 text-sm mt-1 max-w-xl">
            Automated email schedules & Gemini AI composition for polite, encouraging Baha'i Library overdue reminders.
          </p>
        </div>

        <button
          onClick={handleAutomateAll}
          disabled={isAutomatingAll || overdueLoans.length === 0}
          className={`flex items-center space-x-2 px-5 py-3 rounded-xl font-bold text-xs shadow-lg transition-colors whitespace-nowrap ${
            overdueLoans.length > 0
              ? 'bg-amber-600 hover:bg-amber-500 text-stone-950'
              : 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700'
          }`}
          id="automate-all-reminders-btn"
        >
          {isAutomatingAll ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Zap className="w-4 h-4 fill-current" />
          )}
          <span>Run Automated Reminders Cron ({overdueLoans.length})</span>
        </button>
      </div>

      {automationResult && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-xl text-xs font-semibold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{automationResult}</span>
        </div>
      )}

      {/* Main Grid: Left Overdue Queue, Right AI Composer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Queue */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-stone-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-stone-900 text-base flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Overdue Returns Queue ({overdueLoans.length})</span>
            </h3>
            <span className="text-[11px] text-stone-500 font-mono">Auto-Calculated</span>
          </div>

          {overdueLoans.length === 0 ? (
            <div className="bg-emerald-50/60 p-6 rounded-xl border border-emerald-200 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <p className="text-xs font-bold text-emerald-900">All books returned on schedule!</p>
              <p className="text-[11px] text-emerald-700">
                No borrowers currently have overdue items in your library inventory.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {overdueLoans.map((loan) => {
                const book = books.find((b) => b.id === loan.bookId);
                const borrower = borrowers.find((br) => br.id === loan.borrowerId);
                const daysOverdue = calculateDaysOverdue(loan.dueDate);
                const isSelected = activeLoan?.id === loan.id;

                return (
                  <div
                    key={loan.id}
                    onClick={() => {
                      setActiveLoan(loan);
                      setSubject('');
                      setBody('');
                    }}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-amber-50/90 border-amber-500 ring-2 ring-amber-500/20 shadow-xs'
                        : 'bg-stone-50 border-stone-200 hover:border-amber-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="font-serif font-bold text-stone-900 text-sm">
                        {book?.title || 'Unknown Title'}
                      </div>
                      <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded font-mono">
                        {daysOverdue} Days Overdue
                      </span>
                    </div>

                    <div className="text-xs text-stone-600 mt-1 flex items-center space-x-1">
                      <User className="w-3.5 h-3.5 text-stone-400" />
                      <span className="font-semibold">{borrower?.name}</span>
                      <span className="text-stone-400">({borrower?.email})</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-stone-500 mt-3 pt-2 border-t border-stone-200/60 font-mono">
                      <span>Due: {loan.dueDate}</span>
                      <span>Reminders Sent: {loan.reminderCount}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right AI Email Composer */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-stone-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div className="flex items-center space-x-2">
              <Mail className="w-5 h-5 text-amber-700" />
              <h3 className="font-serif font-bold text-stone-900 text-base">
                Email Dispatch & Composition Studio
              </h3>
            </div>

            <button
              onClick={handleGenerateAiCopy}
              disabled={!activeLoan || isGeneratingAi}
              className="flex items-center space-x-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-semibold text-xs px-3.5 py-2 rounded-lg shadow transition-all"
              id="gemini-generate-email-btn"
            >
              {isGeneratingAi ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>✨ Compose with Gemini AI</span>
            </button>
          </div>

          {!activeLoan ? (
            <p className="text-xs text-stone-500 text-center py-12">
              Select an overdue loan from the left queue to compose or send an email reminder.
            </p>
          ) : (
            <form onSubmit={handleSendReminder} className="space-y-4">
              {/* Recipient Details */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-stone-50 p-3 rounded-lg border border-stone-200">
                <div>
                  <span className="text-stone-500 font-medium">To Borrower:</span>
                  <p className="font-bold text-stone-900">{activeBorrower?.name || 'Member'}</p>
                  <p className="text-stone-500">{activeBorrower?.email}</p>
                </div>
                <div>
                  <span className="text-stone-500 font-medium">Overdue Book:</span>
                  <p className="font-bold text-stone-900">{activeBook?.title}</p>
                  <p className="text-stone-500 font-mono">{activeBook?.accessionNumber}</p>
                </div>
              </div>

              {/* Tone Selection */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-800 uppercase">AI Tone Persona</label>
                <div className="flex space-x-2">
                  {['Gentle & Encouraging', 'Dignified & Direct', 'Warm Baha\'i Greetings'].map(
                    (t) => (
                      <button
                        type="button"
                        key={t}
                        onClick={() => setTone(t)}
                        className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                          tone === t
                            ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                            : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        {t}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Email Subject */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-800 uppercase">Subject Line *</label>
                <input
                  type="text"
                  required
                  placeholder="Subject line..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 text-stone-900 text-sm rounded-lg p-2.5 font-medium focus:ring-2 focus:ring-amber-500"
                  id="email-subject-input"
                />
              </div>

              {/* Email Body */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-800 uppercase">Email Body Content *</label>
                <textarea
                  rows={6}
                  required
                  placeholder="Click '✨ Compose with Gemini AI' or type custom reminder body..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 text-stone-900 text-xs rounded-lg p-3 font-sans leading-relaxed focus:ring-2 focus:ring-amber-500"
                  id="email-body-input"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSending || !subject.trim() || !body.trim()}
                  className="flex items-center space-x-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-6 py-2.5 rounded-lg shadow transition-colors"
                  id="send-email-reminder-submit"
                >
                  {isSending ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>Dispatch Email Reminder</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Audit Log / Sent Reminders History */}
      <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 border-b border-stone-100 pb-3">
          <History className="w-5 h-5 text-stone-700" />
          <h3 className="font-serif font-bold text-stone-900 text-base">
            Email Reminders Activity & Dispatch Log ({reminders.length})
          </h3>
        </div>

        {reminders.length === 0 ? (
          <p className="text-xs text-stone-500 text-center py-6">No email reminders logged yet.</p>
        ) : (
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {reminders.map((rem) => (
              <div
                key={rem.id}
                className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-stone-900">
                    To: {rem.borrowerName} ({rem.borrowerEmail})
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded font-mono">
                    {rem.status} ({rem.triggerType})
                  </span>
                </div>
                <div className="font-semibold text-amber-900">{rem.subject}</div>
                <div className="text-stone-600 font-sans text-[11px] whitespace-pre-line bg-white p-2.5 rounded border border-stone-200/70">
                  {rem.body}
                </div>
                <div className="text-[10px] text-stone-400 font-mono text-right">
                  Sent At: {new Date(rem.sentAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
