// Avatar system: emoji + gradient combos stored as "emoji|gradientIndex"

export const AVATAR_GRADIENTS = [
  'from-emerald-400 to-emerald-600',
  'from-amber-400 to-amber-600',
  'from-rose-400 to-rose-600',
  'from-blue-400 to-blue-600',
  'from-violet-400 to-violet-600',
  'from-cyan-400 to-cyan-600',
  'from-orange-400 to-orange-600',
  'from-pink-400 to-pink-600',
];

export const AVATAR_EMOJI_CATEGORIES: { label: string; emojis: string[] }[] = [
  {
    label: 'Animals',
    emojis: ['🦁', '🐯', '🦅', '🐺', '🐼', '🦊', '🐢', '🦋', '🐝', '🐬', '🐈', '🐎'],
  },
  {
    label: 'Nature',
    emojis: ['🌟', '⚡', '🔥', '🌈', '🌙', '☀️', '🌸', '🌵', '🌊', '🍃', '❄️', '🌺'],
  },
  {
    label: 'Objects',
    emojis: ['💎', '🎯', '🚀', '🛡️', '⚖️', '📈', '💰', '🧠', '🎨', '🏆', '🔔', '🗝️'],
  },
];

export interface ParsedAvatar {
  emoji: string;
  gradient: string;
  gradientIndex: number;
}

export function parseAvatar(avatar: string | null | undefined): ParsedAvatar | null {
  if (!avatar) return null;
  const [emoji, idxStr] = avatar.split('|');
  const idx = parseInt(idxStr || '0', 10);
  const gradientIndex = idx >= 0 && idx < AVATAR_GRADIENTS.length ? idx : 0;
  if (!emoji) return null;
  return { emoji, gradient: AVATAR_GRADIENTS[gradientIndex], gradientIndex };
}

export function buildAvatar(emoji: string, gradientIndex: number): string {
  return `${emoji}|${gradientIndex}`;
}

/** Renders the avatar circle — emoji on gradient, or initial letter fallback */
export function AvatarView({
  avatar,
  name,
  size = 'md',
  className = '',
}: {
  avatar?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  const parsed = parseAvatar(avatar);
  const sizes = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-lg',
    lg: 'w-14 h-14 text-2xl',
    xl: 'w-24 h-24 text-5xl',
  };
  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center font-bold flex-shrink-0 bg-gradient-to-br ${
        parsed ? parsed.gradient : 'from-gold-400 to-gold-600'
      } ${className}`}
      title={name}
    >
      {parsed ? <span>{parsed.emoji}</span> : <span className="text-primary-900">{name?.charAt(0)?.toUpperCase() || '?'}</span>}
    </div>
  );
}
