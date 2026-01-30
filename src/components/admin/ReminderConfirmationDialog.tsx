'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';

interface Recipient {
  id: string;
  displayName: string;
  hasLineId: boolean;
  isGuest: boolean;
}

interface ReminderConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  recipients: Recipient[];
  stats: {
    total: number;
    willReceive: number;
    willSkip: number;
  };
  reminderAlreadySent: boolean;
}

export function ReminderConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  recipients,
  stats,
  reminderAlreadySent,
}: ReminderConfirmationDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-slate-800 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-xl max-h-[80vh] flex flex-col"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Bell className="w-5 h-5 text-blue-500" />
                  </div>
                  <h2 className="text-lg font-semibold text-white">リマインダー送信の確認</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Already Sent Warning */}
              {reminderAlreadySent && (
                <div className="mb-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                  <div className="flex items-center gap-2 text-amber-500">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">リマインダーは既に送信済みです</span>
                  </div>
                  <p className="text-sm text-slate-400 mt-1">
                    再度送信すると、参加者に複数の通知が届きます。
                  </p>
                </div>
              )}

              {/* Stats Summary */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-slate-900/50 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-white">{stats.total}</div>
                  <div className="text-xs text-slate-400">合計</div>
                </div>
                <div className="bg-green-500/10 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-green-500">{stats.willReceive}</div>
                  <div className="text-xs text-slate-400">送信対象</div>
                </div>
                <div className="bg-slate-900/50 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-slate-400">{stats.willSkip}</div>
                  <div className="text-xs text-slate-400">スキップ</div>
                </div>
              </div>

              {/* Recipients List */}
              <div className="flex-1 overflow-y-auto mb-6">
                <p className="text-sm text-slate-400 mb-2">送信先一覧:</p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {recipients.map((recipient) => (
                    <div
                      key={recipient.id}
                      className="flex items-center justify-between p-2 bg-slate-900/50 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-white">{recipient.displayName}</span>
                        {recipient.isGuest && (
                          <span className="text-xs bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded">
                            外部
                          </span>
                        )}
                      </div>
                      {recipient.hasLineId ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-slate-500" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Info */}
              <div className="bg-slate-900/50 rounded-xl p-4 mb-6">
                <p className="text-sm text-slate-400">
                  <CheckCircle className="w-4 h-4 inline mr-1 text-green-500" />
                  LINE連携済みのユーザーにのみ通知が送信されます
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1 py-3 rounded-xl text-sm font-medium bg-slate-700 text-white hover:bg-slate-600 transition-colors disabled:opacity-50"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isSubmitting || stats.willReceive === 0}
                  className="flex-1 py-3 rounded-xl text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      送信中...
                    </>
                  ) : (
                    <>
                      <Bell className="w-4 h-4" />
                      リマインダーを送信
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
