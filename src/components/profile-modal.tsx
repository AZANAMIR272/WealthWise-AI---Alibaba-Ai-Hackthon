'use client';
import { useState, useEffect } from 'react';
import {
  X, Loader2, Check, User, Mail, Calendar, Palette, Sparkles, AlertTriangle, Camera
} from 'lucide-react';
import { AVATAR_EMOJI_CATEGORIES, AVATAR_GRADIENTS, parseAvatar, buildAvatar, AvatarView } from '@/lib/avatar';
import { saveCurrentUser } from '@/lib/use-current-user';

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
  /** Called after successful save so parent (sidebar) can refresh avatar */
  onSaved?: (user: { id: string; name: string; email: string; avatar: string | null }) => void;
}

export function ProfileModal({ open, onClose, onSaved }: ProfileModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [createdAt, setCreatedAt] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [selectedEmoji, setSelectedEmoji] = useState<string>('🦁');
  const [selectedGradient, setSelectedGradient] = useState<number>(0);
  const [activeCategory, setActiveCategory] = useState(0);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  // Load profile when modal opens
  useEffect(() => {
    if (!open) return;
    setError('');
    setSaved(false);
    setLoading(true);
    fetch('/api/profile')
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); return; }
        setName(data.name || '');
        setEmail(data.email || '');
        setCreatedAt(data.createdAt || '');
        setAvatar(data.avatar || null);
        const parsed = parseAvatar(data.avatar);
        if (parsed) {
          setSelectedEmoji(parsed.emoji);
          setSelectedGradient(parsed.gradientIndex);
        }
      })
      .catch(() => setError('Profile load nahi ho payi'))
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  const handleSave = async () => {
    setError('');
    setSaved(false);
    if (!name.trim() || name.trim().length < 2) {
      setError('Name kam se kam 2 characters ka ho');
      return;
    }
    setSaving(true);
    try {
      const newAvatar = buildAvatar(selectedEmoji, selectedGradient);
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), avatar: newAvatar }),
      });
      const data = await res.json();
      if (res.ok) {
        setAvatar(newAvatar);
        saveCurrentUser(data.user);
        onSaved?.(data.user);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } else {
        setError(data.error || 'Save failed');
      }
    } catch {
      setError('Server se connect nahi ho pa raha');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-surface-secondary border border-border-secondary rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-surface-secondary border-b border-border-secondary px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <User className="w-5 h-5 text-primary-500" /> Profile Setup
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface-tertiary text-text-muted hover:text-text-primary transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Avatar Preview + Pick */}
            <div className="flex flex-col items-center">
              <div className="relative group">
                <AvatarView avatar={buildAvatar(selectedEmoji, selectedGradient)} name={name || 'User'} size="xl" className="shadow-xl" />
                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center shadow-lg border-2 border-surface-secondary">
                  <Camera className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
              <p className="text-xs text-text-muted mt-3 flex items-center gap-1">
                <Palette className="w-3 h-3" /> Avatar chuno — emoji + color
              </p>
            </div>

            {/* Gradient Picker */}
            <div>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Background Color</p>
              <div className="flex flex-wrap gap-2">
                {AVATAR_GRADIENTS.map((g, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedGradient(i)}
                    className={`w-9 h-9 rounded-full bg-gradient-to-br ${g} transition-all ${
                      selectedGradient === i ? 'ring-2 ring-offset-2 ring-primary-500 ring-offset-surface-secondary scale-110' : 'hover:scale-105'
                    }`}
                    title={`Color ${i + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Emoji Picker */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Avatar</p>
                <div className="flex gap-1">
                  {AVATAR_EMOJI_CATEGORIES.map((cat, i) => (
                    <button
                      key={cat.label}
                      onClick={() => setActiveCategory(i)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-all ${
                        activeCategory === i
                          ? 'bg-primary-500 text-white'
                          : 'bg-surface-primary text-text-muted hover:text-text-primary'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
                {AVATAR_EMOJI_CATEGORIES[activeCategory].emojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setSelectedEmoji(emoji)}
                    className={`aspect-square rounded-xl flex items-center justify-center text-2xl transition-all ${
                      selectedEmoji === emoji
                        ? 'bg-primary-500/20 ring-2 ring-primary-500 scale-110 shadow-lg'
                        : 'bg-surface-primary hover:bg-surface-tertiary hover:scale-105'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Info Fields */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={50}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-primary border border-border-secondary text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">Email (read-only)</label>
                <div className="w-full px-4 py-2.5 rounded-xl bg-surface-primary/50 border border-border-secondary text-text-muted text-sm flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{email}</span>
                </div>
              </div>
              {createdAt && (
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1.5">Member Since</label>
                  <div className="w-full px-4 py-2.5 rounded-xl bg-surface-primary/50 border border-border-secondary text-text-muted text-sm flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                    {new Date(createdAt + 'Z').toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                </div>
              )}
            </div>

            {/* Error / Success */}
            {error && (
              <div className="p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}
            {saved && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 flex-shrink-0" />
                Profile save ho gayi!
              </div>
            )}

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 text-white font-bold text-sm shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Save Profile
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
