'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Clock, Loader2, Pencil } from 'lucide-react';

interface CancelDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isWithin24Hours: boolean;
}

export function CancelDialog({ isOpen, onClose, onConfirm, isWithin24Hours }: CancelDialogProps) {
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
              className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500/10 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  </div>
                  <h2 className="text-lg font-semibold text-white">キャンセルの確認</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="space-y-4 mb-6">
                <p className="text-slate-300">
                  本当にキャンセルしますか？
                </p>

                <div className="bg-slate-900/50 rounded-xl p-4 space-y-3">
                  <p className="text-sm font-medium text-amber-400 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    ペナルティについて
                  </p>
                  <ul className="text-sm text-slate-400 space-y-2">
                    <li className={`flex justify-between ${!isWithin24Hours ? 'text-white font-medium' : ''}`}>
                      <span>通常キャンセル:</span>
                      <span className="text-red-400">-30 pt</span>
                    </li>
                    <li className={`flex justify-between ${isWithin24Hours ? 'text-white font-medium' : ''}`}>
                      <span>24時間以内のキャンセル:</span>
                      <span className="text-red-400">-50 pt</span>
                    </li>
                    <li className="flex justify-between">
                      <span>無断キャンセル（No-Show）:</span>
                      <span className="text-red-400">-100 pt</span>
                    </li>
                  </ul>
                </div>

                <p className="text-sm text-slate-400">
                  他のメンバーに迷惑がかかります。やむを得ない場合のみキャンセルしてください。
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1 py-3 rounded-xl text-sm font-medium bg-slate-700 text-white hover:bg-slate-600 transition-colors disabled:opacity-50"
                >
                  戻る
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isSubmitting}
                  className="flex-1 py-3 rounded-xl text-sm font-medium bg-red-500 text-white hover:bg-red-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      処理中...
                    </>
                  ) : (
                    'キャンセルする'
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

interface LateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (minutes: number) => Promise<void>;
  initialMinutes?: number | null;
}

export function LateDialog({ isOpen, onClose, onConfirm, initialMinutes }: LateDialogProps) {
  const [minutes, setMinutes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ダイアログが開いたときに初期値をセット
  useEffect(() => {
    if (isOpen && initialMinutes) {
      setMinutes(String(initialMinutes));
    } else if (!isOpen) {
      setMinutes('');
      setError(null);
    }
  }, [isOpen, initialMinutes]);

  const handleConfirm = async () => {
    const mins = parseInt(minutes, 10);
    if (isNaN(mins) || mins <= 0) {
      setError('有効な分数を入力してください');
      return;
    }
    if (mins > 180) {
      setError('180分以上の遅刻の場合はキャンセルを検討してください');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onConfirm(mins);
      onClose();
      setMinutes('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
    setMinutes('');
    setError(null);
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
            onClick={handleClose}
          />

          {/* Dialog */}
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/10 rounded-lg">
                    {initialMinutes ? (
                      <Pencil className="w-5 h-5 text-amber-400" />
                    ) : (
                      <Clock className="w-5 h-5 text-amber-400" />
                    )}
                  </div>
                  <h2 className="text-lg font-semibold text-white">
                    {initialMinutes ? '遅刻時間の変更' : '遅刻連絡'}
                  </h2>
                </div>
                <button
                  onClick={handleClose}
                  className="p-1 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="space-y-4 mb-6">
                <p className="text-slate-300">
                  何分くらい遅れそうですか？
                </p>

                <div className="relative">
                  <input
                    type="number"
                    value={minutes}
                    onChange={(e) => {
                      setMinutes(e.target.value);
                      setError(null);
                    }}
                    placeholder="例: 15"
                    min="1"
                    max="180"
                    className="w-full px-4 py-3 pr-12 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50 transition-colors"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                    分
                  </span>
                </div>

                {error && (
                  <p className="text-sm text-red-400">{error}</p>
                )}

                <div className="bg-slate-900/50 rounded-xl p-4">
                  <p className="text-sm text-slate-400">
                    他のメンバーにダッシュボードで表示されます。
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="flex-1 py-3 rounded-xl text-sm font-medium bg-slate-700 text-white hover:bg-slate-600 transition-colors disabled:opacity-50"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isSubmitting || !minutes}
                  className="flex-1 py-3 rounded-xl text-sm font-medium bg-amber-500 text-slate-900 hover:bg-amber-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      送信中...
                    </>
                  ) : (
                    initialMinutes ? '変更する' : '遅刻を連絡する'
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
