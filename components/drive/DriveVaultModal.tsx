'use client';

import React, { useState } from 'react';
import { Shield, Lock, Unlock, KeyRound, AlertCircle, X, CheckCircle2 } from 'lucide-react';

interface DriveVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  hasPin: boolean;
  onSuccess: () => void;
}

export const DriveVaultModal: React.FC<DriveVaultModalProps> = ({
  isOpen,
  onClose,
  hasPin,
  onSuccess,
}) => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isSettingNewPin, setIsSettingNewPin] = useState(!hasPin);
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleKeyPress = (digit: string) => {
    if (isSettingNewPin && step === 'enter') {
      if (pin.length < 6) setPin((prev) => prev + digit);
    } else if (isSettingNewPin && step === 'confirm') {
      if (confirmPin.length < 6) setConfirmPin((prev) => prev + digit);
    } else {
      if (pin.length < 6) setPin((prev) => prev + digit);
    }
    setError('');
  };

  const handleBackspace = () => {
    if (isSettingNewPin && step === 'confirm') {
      setConfirmPin((prev) => prev.slice(0, -1));
    } else {
      setPin((prev) => prev.slice(0, -1));
    }
    setError('');
  };

  const handleSubmit = async () => {
    if (isSettingNewPin) {
      if (step === 'enter') {
        if (pin.length < 4) {
          setError('PIN must be at least 4 digits');
          return;
        }
        setStep('confirm');
        return;
      }

      if (pin !== confirmPin) {
        setError('PINs do not match. Please try again.');
        setConfirmPin('');
        return;
      }

      setLoading(true);
      try {
        const res = await fetch('/api/drive/vault', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'set_pin', newPin: pin }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to set PIN');

        onSuccess();
        onClose();
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    } else {
      if (pin.length < 4) {
        setError('Please enter your 4-6 digit PIN');
        return;
      }

      setLoading(true);
      try {
        const res = await fetch('/api/drive/vault', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'verify_pin', pin }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Incorrect PIN');

        // Store unlock timestamp in session storage
        sessionStorage.setItem('filecraft_vault_unlocked_until', (Date.now() + 15 * 60 * 1000).toString());
        onSuccess();
        onClose();
      } catch (err: any) {
        setError(err.message || 'Incorrect PIN');
        setPin('');
      } finally {
        setLoading(false);
      }
    }
  };

  const activePin = isSettingNewPin && step === 'confirm' ? confirmPin : pin;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-3xl bg-white/95 dark:bg-zinc-900/95 border border-zinc-200/80 dark:border-zinc-800 shadow-2xl p-6 text-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon & Title */}
        <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-500 mb-4 shadow-inner">
          <Shield className="w-7 h-7" />
        </div>

        <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">
          {isSettingNewPin
            ? step === 'enter'
              ? 'Set Vault Security PIN'
              : 'Confirm Your PIN'
            : 'Unlock Secure Vault'}
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">
          {isSettingNewPin
            ? step === 'enter'
              ? 'Create a 4 to 6-digit PIN to protect sensitive documents (Cards, IDs, Passports).'
              : 'Re-enter your PIN to verify.'
            : 'Enter your Security PIN to unlock protected files.'}
        </p>

        {/* PIN Dots Indicator */}
        <div className="flex justify-center items-center gap-3 mb-6">
          {[0, 1, 2, 3, 4, 5].map((idx) => {
            const filled = idx < activePin.length;
            return (
              <div
                key={idx}
                className={`w-3.5 h-3.5 rounded-full border transition-all duration-200 ${
                  filled
                    ? 'bg-amber-500 border-amber-500 scale-110 shadow-sm shadow-amber-500/50'
                    : 'border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800'
                }`}
              />
            );
          })}
        </div>

        {error && (
          <div className="mb-4 flex items-center justify-center gap-1.5 text-xs text-rose-500 dark:text-rose-400 bg-rose-500/10 dark:bg-rose-500/20 py-1.5 px-3 rounded-lg border border-rose-500/20 animate-shake">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-2.5 max-w-[240px] mx-auto mb-6">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleKeyPress(digit)}
              className="w-16 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 active:scale-95 text-lg font-bold text-zinc-900 dark:text-zinc-100 transition shadow-sm border border-zinc-200/50 dark:border-zinc-700/50"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={handleBackspace}
            className="w-16 h-14 rounded-2xl bg-zinc-100/50 dark:bg-zinc-800/40 hover:bg-zinc-200 dark:hover:bg-zinc-700 active:scale-95 text-xs font-semibold text-zinc-500 dark:text-zinc-400 transition"
          >
            Del
          </button>
          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="w-16 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 active:scale-95 text-lg font-bold text-zinc-900 dark:text-zinc-100 transition shadow-sm border border-zinc-200/50 dark:border-zinc-700/50"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={activePin.length < 4 || loading}
            className="w-16 h-14 rounded-2xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 text-white font-bold transition shadow-md shadow-amber-500/20 flex items-center justify-center"
          >
            <CheckCircle2 className="w-5 h-5" />
          </button>
        </div>

        <div className="text-2xs text-zinc-400 dark:text-zinc-500">
          Vault automatically locks after 15 minutes of inactivity.
        </div>
      </div>
    </div>
  );
};
