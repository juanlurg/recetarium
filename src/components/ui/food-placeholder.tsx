import { cn } from '@/lib/utils';

type FoodCategory =
  | 'pasta'
  | 'meat'
  | 'salad'
  | 'dessert'
  | 'soup'
  | 'fish'
  | 'rice'
  | 'bread'
  | 'vegetable'
  | 'default';

interface FoodPlaceholderProps {
  category?: FoodCategory;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const categoryConfig: Record<FoodCategory, { bg: string; icon: string; label: string }> = {
  pasta: { bg: 'bg-amber-100', icon: '🍝', label: 'Pasta' },
  meat: { bg: 'bg-red-100', icon: '🥩', label: 'Carne' },
  salad: { bg: 'bg-green-100', icon: '🥗', label: 'Ensalada' },
  dessert: { bg: 'bg-pink-100', icon: '🍰', label: 'Postre' },
  soup: { bg: 'bg-orange-100', icon: '🍲', label: 'Sopa' },
  fish: { bg: 'bg-blue-100', icon: '🐟', label: 'Pescado' },
  rice: { bg: 'bg-yellow-100', icon: '🍚', label: 'Arroz' },
  bread: { bg: 'bg-amber-50', icon: '🥖', label: 'Pan' },
  vegetable: { bg: 'bg-emerald-100', icon: '🥕', label: 'Vegetales' },
  default: { bg: 'bg-slate-100', icon: '🍽️', label: 'Receta' },
};

const sizeClasses = {
  sm: 'h-12 w-12 text-xl',
  md: 'h-20 w-20 text-3xl',
  lg: 'h-32 w-32 text-5xl',
};

export function FoodPlaceholder({
  category = 'default',
  className,
  size = 'md'
}: FoodPlaceholderProps) {
  const config = categoryConfig[category];

  return (
    <div
      className={cn(
        'rounded-xl flex items-center justify-center',
        config.bg,
        sizeClasses[size],
        className
      )}
      aria-label={config.label}
    >
      <span role="img" aria-hidden="true">{config.icon}</span>
    </div>
  );
}

export function detectFoodCategory(title: string, cuisine?: string): FoodCategory {
  const lower = title.toLowerCase();
  const cuisineLower = cuisine?.toLowerCase() || '';

  if (lower.includes('pasta') || lower.includes('spaguetti') || lower.includes('macarron')) return 'pasta';
  if (lower.includes('ensalada') || lower.includes('salad')) return 'salad';
  if (lower.includes('carne') || lower.includes('pollo') || lower.includes('ternera') || lower.includes('cerdo')) return 'meat';
  if (lower.includes('postre') || lower.includes('tarta') || lower.includes('pastel') || lower.includes('helado')) return 'dessert';
  if (lower.includes('sopa') || lower.includes('caldo') || lower.includes('crema')) return 'soup';
  if (lower.includes('pescado') || lower.includes('salmon') || lower.includes('atun') || lower.includes('merluza')) return 'fish';
  if (lower.includes('arroz') || lower.includes('paella')) return 'rice';
  if (lower.includes('pan') || lower.includes('pizza')) return 'bread';
  if (lower.includes('verdura') || lower.includes('vegetal')) return 'vegetable';

  // Check by cuisine
  if (cuisineLower.includes('italian')) return 'pasta';
  if (cuisineLower.includes('japanese') || cuisineLower.includes('oriental')) return 'rice';

  return 'default';
}
