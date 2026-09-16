'use client';

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Lock, 
  Unlock, 
  KeyRound, 
  AlertCircle, 
  X, 
  CheckCircle2, 
  Settings, 
  Clock, 
  ShieldCheck, 
  Check,
  RefreshCw
} from 'lucide-react';

interface DriveVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  hasPin?: boolean;
  initialMode?: 'unlock' | 'configure';
  onSuccess: () => void;
}

export const DriveVaultModal: React.FC<DriveVaultModalProps> = ({
  isOpen,
  onClose,
  hasPin = true,
  initialMode = 'unlock',
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'unlock' | 'configure'>(initialMode);
  const [isServerHasPin, setIsServerHasPin] = useState(hasPin);
  const [vaultItemsCount, setVaultItemsCount] = useState(0);
  const [autoLockMinutes, setAutoLockMinutes] = useState(15);
  const [fetchingStatus, setFetchingStatus] = useState(false);

  // Unlock state
  const [unlockPin, setUnlockPin] = useState('');

  // Configure / Change PIN state
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [configStep, setConfigStep] = useState<'current' | 'new' | 'confirm'>('new');

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch live vault status on open
  useEffect(() => {
    if (!isOpen) {
      setUnlockPin('');
      setCurrentPin('');
      setNewPin('');
      setConfirmNewPin('');
      setError('');
      setSuccessMsg('');
      return;
    }

    setActiveTab(initialMode);

    async function loadVaultStatus() {
      try {
        setFetchingStatus(true);
        const res = await fetch('/api/drive/vault');
        if (res.ok) {
          const data = await res.json();
          setIsServerHasPin(Boolean(data.hasPin));
          setVaultItemsCount(data.vaultItemsCount || 0);
          setAutoLockMinutes(data.autoLockMinutes || 15);
          if (!data.hasPin) {
            setActiveTab('configure');
            setConfigStep('new');
          }
        }
      } catch (err) {
        console.warn('Failed to fetch vault status:', err);
      } finally {
        setFetchingStatus(false);
      }
    }

    loadVaultStatus();
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  // Keypad press handler for unlock
  const handleKeypadPress = (digit: string) => {
    if (activeTab === 'unlock') {
      if (unlockPin.length < 6) setUnlockPin((prev) => prev + digit);
    } else {
      if (isServerHasPin && configStep === 'current') {
        if (currentPin.length < 6) setCurrentPin((prev) => prev + digit);
      } else if (configStep === 'new') {
        if (newPin.length < 6) setNewPin((prev) => prev + digit);
      } else if (configStep === 'confirm') {
        if (confirmNewPin.length < 6) setConfirmNewPin((prev) => prev + digit);
      }
    }
    setError('');
    setSuccessMsg('');
  };

  const handleBackspace = () => {
    if (activeTab === 'unlock') {
      setUnlockPin((prev) => prev.slice(0, -1));
    } else {
      if (isServerHasPin && configStep === 'current') {
        setCurrentPin((prev) => prev.slice(0, -1));
      } else if (configStep === 'new') {
        setNewPin((prev) => prev.slice(0, -1));
      } else if (configStep === 'confirm') {
        setConfirmNewPin((prev) => prev.slice(0, -1));
      }
    }
    setError('');
  };

  // Submit Unlock PIN
  const handleUnlockSubmit = async () => {
    if (unlockPin.length < 4) {
      setError('Please enter your 4 to 6 digit PIN');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/drive/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify_pin', pin: unlockPin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Incorrect PIN. Access denied.');

      const lockTime = data.unlockedUntil || Date.now() + autoLockMinutes * 60 * 1000;
      sessionStorage.setItem('filecraft_vault_unlocked_until', lockTime.toString());
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Incorrect PIN');
      setUnlockPin('');
    } finally {
      setLoading(false);
    }
  };

  // Submit Set or Change PIN
  const handleConfigurePinSubmit = async () => {
    // If PIN is already set, verify current step flow
    if (isServerHasPin) {
      if (configStep === 'current') {
        if (currentPin.length < 4) {
          setError('Enter your current 4 to 6 digit PIN');
          return;
        }
        setConfigStep('new');
        return;
      }
      if (configStep === 'new') {
        if (newPin.length < 4 || newPin.length > 6) {
          setError('New PIN must be between 4 and 6 digits');
          return;
        }
        setConfigStep('confirm');
        return;
      }
      if (configStep === 'confirm') {
        if (newPin !== confirmNewPin) {
          setError('New PINs do not match. Please re-enter.');
          setConfirmNewPin('');
          return;
        }

        setLoading(true);
        setError('');
        try {
          const res = await fetch('/api/drive/vault', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'change_pin',
              currentPin,
              newPin,
            }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Failed to update PIN');

          setSuccessMsg('Vault PIN successfully updated!');
          setIsServerHasPin(true);
          setCurrentPin('');
          setNewPin('');
          setConfirmNewPin('');
          setConfigStep('new');
          setTimeout(() => {
            setActiveTab('unlock');
            setSuccessMsg('');
          }, 1500);
        } catch (err: any) {
          setError(err.message || 'Failed to update PIN');
        } finally {
          setLoading(false);
        }
        return;
      }
    } else {
      // First time setting PIN
      if (configStep === 'new') {
        if (newPin.length < 4 || newPin.length > 6) {
          setError('PIN must be between 4 and 6 digits');
          return;
        }
        setConfigStep('confirm');
        return;
      }
      if (configStep === 'confirm') {
        if (newPin !== confirmNewPin) {
          setError('PINs do not match. Please try again.');
          setConfirmNewPin('');
          return;
        }

        setLoading(true);
        setError('');
        try {
          const res = await fetch('/api/drive/vault', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'set_pin',
              newPin,
              autoLockMinutes,
            }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Failed to configure PIN');

          setSuccessMsg('Vault PIN successfully configured!');
          setIsServerHasPin(true);
          onSuccess();
          setTimeout(() => {
            setActiveTab('unlock');
            setSuccessMsg('');
          }, 1500);
        } catch (err: any) {
          setError(err.message || 'Failed to configure PIN');
        } finally {
          setLoading(false);
        }
      }
    }
  };

  // Update Auto-Lock timeout duration
  const handleUpdateAutoLock = async (minutes: number) => {
    setAutoLockMinutes(minutes);
    try {
      await fetch('/api/drive/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_settings', autoLockMinutes: minutes }),
      });
    } catch (err) {
      console.warn('Failed to update auto-lock settings:', err);
    }
  };

  const currentConfigPin = isServerHasPin && configStep === 'current'
    ? currentPin
    : configStep === 'confirm'
    ? confirmNewPin
    : newPin;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-modal-backdrop">
      <div className="relative w-full max-w-md rounded-3xl bg-white/95 dark:bg-zinc-900/95 border border-zinc-200/90 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-modal-pop">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-inner">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <span>Secure Personal Vault</span>
                <span className="text-3xs font-mono px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/20">
                  PBKDF2
                </span>
              </h3>
              <p className="text-3xs text-zinc-400 font-medium">Hardware-isolated Zero-Knowledge Storage</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation (Unlock vs Configure) */}
        <div className="flex border-b border-zinc-200/80 dark:border-zinc-800/80 px-6 pt-2 bg-zinc-50/30 dark:bg-zinc-950/20 gap-2">
          {isServerHasPin && (
            <button
              type="button"
              onClick={() => {
                setActiveTab('unlock');
                setError('');
                setSuccessMsg('');
              }}
              className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'unlock'
                  ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-extrabold'
                  : 'border-transparent text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Unlock Vault</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setActiveTab('configure');
              setError('');
              setSuccessMsg('');
              setConfigStep(isServerHasPin ? 'current' : 'new');
            }}
            className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'configure'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-extrabold'
                : 'border-transparent text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>{isServerHasPin ? 'Configure & Change PIN' : 'Set Up Vault PIN'}</span>
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* TAB 1: UNLOCK VAULT */}
          {activeTab === 'unlock' && (
            <div className="text-center space-y-4">
              <div>
                <h4 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                  Enter Security PIN
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Enter your 4 to 6-digit PIN to unmask and preview protected files.
                </p>
              </div>

              {/* PIN Dots Indicator */}
              <div className="flex justify-center items-center gap-3 py-2">
                {[0, 1, 2, 3, 4, 5].map((idx) => {
                  const filled = idx < unlockPin.length;
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
                <div className="flex items-center justify-center gap-1.5 text-xs text-rose-500 dark:text-rose-400 bg-rose-500/10 dark:bg-rose-500/20 py-1.5 px-3 rounded-xl border border-rose-500/20">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Keypad */}
              <div className="grid grid-cols-3 gap-2.5 max-w-[240px] mx-auto pt-1">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handleKeypadPress(digit)}
                    className="w-16 h-13 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 active:scale-95 text-lg font-extrabold text-zinc-900 dark:text-zinc-100 transition shadow-2xs border border-zinc-200/50 dark:border-zinc-700/50 cursor-pointer"
                  >
                    {digit}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleBackspace}
                  className="w-16 h-13 rounded-2xl bg-zinc-100/60 dark:bg-zinc-800/40 hover:bg-zinc-200 dark:hover:bg-zinc-700 active:scale-95 text-xs font-bold text-zinc-500 dark:text-zinc-400 transition cursor-pointer"
                >
                  Del
                </button>
                <button
                  type="button"
                  onClick={() => handleKeypadPress('0')}
                  className="w-16 h-13 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 active:scale-95 text-lg font-extrabold text-zinc-900 dark:text-zinc-100 transition shadow-2xs border border-zinc-200/50 dark:border-zinc-700/50 cursor-pointer"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleUnlockSubmit}
                  disabled={unlockPin.length < 4 || loading}
                  className="w-16 h-13 rounded-2xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 text-white font-bold transition shadow-md shadow-amber-500/20 flex items-center justify-center cursor-pointer"
                >
                  {loading ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Quick Settings Footer Link */}
              <div className="pt-2 flex items-center justify-between text-3xs text-zinc-400 border-t border-zinc-100 dark:border-zinc-800/60">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-500" />
                  <span>Auto-locks in {autoLockMinutes} mins</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('configure');
                    setConfigStep('current');
                  }}
                  className="text-amber-600 dark:text-amber-400 hover:underline font-bold"
                >
                  Configure / Change PIN →
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: CONFIGURE & SETTINGS */}
          {activeTab === 'configure' && (
            <div className="space-y-5">
              {/* Step Title */}
              <div className="text-center">
                <h4 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                  {!isServerHasPin
                    ? configStep === 'new'
                      ? 'Create Your Master Vault PIN'
                      : 'Confirm Your Master PIN'
                    : configStep === 'current'
                    ? 'Verify Current PIN'
                    : configStep === 'new'
                    ? 'Enter New Vault PIN'
                    : 'Confirm New Vault PIN'}
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {!isServerHasPin
                    ? 'Set a 4 to 6-digit numeric PIN to protect sensitive government IDs and bank cards.'
                    : configStep === 'current'
                    ? 'Enter your existing security PIN to authorize changes.'
                    : configStep === 'new'
                    ? 'Choose a new 4 to 6-digit numeric PIN.'
                    : 'Re-enter your new PIN to confirm.'}
                </p>
              </div>

              {/* Progress Steps Indicator */}
              <div className="flex items-center justify-center gap-2">
                {isServerHasPin && (
                  <div
                    className={`px-2.5 py-1 rounded-full text-3xs font-bold transition-all ${
                      configStep === 'current'
                        ? 'bg-amber-500 text-white'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    1. Current PIN
                  </div>
                )}
                <div
                  className={`px-2.5 py-1 rounded-full text-3xs font-bold transition-all ${
                    configStep === 'new'
                      ? 'bg-amber-500 text-white'
                      : (isServerHasPin && configStep === 'confirm')
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {isServerHasPin ? '2. New PIN' : '1. Enter PIN'}
                </div>
                <div
                  className={`px-2.5 py-1 rounded-full text-3xs font-bold transition-all ${
                    configStep === 'confirm'
                      ? 'bg-amber-500 text-white'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {isServerHasPin ? '3. Confirm' : '2. Confirm'}
                </div>
              </div>

              {/* PIN Dots Indicator for Config Step */}
              <div className="flex justify-center items-center gap-3 py-1">
                {[0, 1, 2, 3, 4, 5].map((idx) => {
                  const filled = idx < currentConfigPin.length;
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
                <div className="flex items-center justify-center gap-1.5 text-xs text-rose-500 dark:text-rose-400 bg-rose-500/10 dark:bg-rose-500/20 py-1.5 px-3 rounded-xl border border-rose-500/20">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20 py-1.5 px-3 rounded-xl border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Keypad */}
              <div className="grid grid-cols-3 gap-2.5 max-w-[240px] mx-auto">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handleKeypadPress(digit)}
                    className="w-16 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 active:scale-95 text-lg font-extrabold text-zinc-900 dark:text-zinc-100 transition shadow-2xs border border-zinc-200/50 dark:border-zinc-700/50 cursor-pointer"
                  >
                    {digit}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleBackspace}
                  className="w-16 h-12 rounded-2xl bg-zinc-100/60 dark:bg-zinc-800/40 hover:bg-zinc-200 dark:hover:bg-zinc-700 active:scale-95 text-xs font-bold text-zinc-500 dark:text-zinc-400 transition cursor-pointer"
                >
                  Del
                </button>
                <button
                  type="button"
                  onClick={() => handleKeypadPress('0')}
                  className="w-16 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 active:scale-95 text-lg font-extrabold text-zinc-900 dark:text-zinc-100 transition shadow-2xs border border-zinc-200/50 dark:border-zinc-700/50 cursor-pointer"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleConfigurePinSubmit}
                  disabled={currentConfigPin.length < 4 || loading}
                  className="w-16 h-12 rounded-2xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 text-white font-bold transition shadow-md shadow-amber-500/20 flex items-center justify-center cursor-pointer text-xs"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : configStep === 'confirm' ? (
                    'Save'
                  ) : (
                    'Next →'
                  )}
                </button>
              </div>

              {/* Auto-Lock Inactivity Preference */}
              <div className="pt-3 border-t border-zinc-200/80 dark:border-zinc-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>Auto-Lock Timeout</span>
                  </span>
                  <span className="text-3xs text-zinc-400 font-mono">Inactivity Lease</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { label: '5 min', value: 5 },
                    { label: '15 min', value: 15 },
                    { label: '30 min', value: 30 },
                    { label: '1 hour', value: 60 },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleUpdateAutoLock(opt.value)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        autoLockMinutes === opt.value
                          ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                          : 'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vault Security Specs Card */}
              <div className="p-3 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 text-3xs text-amber-800 dark:text-amber-300 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Zero-Exposure Protection Active</span>
                </div>
                <p className="leading-tight opacity-90">
                  {vaultItemsCount} protected files remain encrypted and invisible in regular search feeds until unlocked with your PIN.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

