interface Props {
  password: string;
}

type Strength = { label: string; color: string; bg: string; score: number };

function evaluate(password: string): Strength {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { score, label: "Weak", color: "#ef4444", bg: "bg-red-500" };
  if (score <= 3) return { score, label: "Fair", color: "#f97316", bg: "bg-orange-500" };
  if (score <= 4) return { score, label: "Good", color: "#eab308", bg: "bg-yellow-500" };
  if (score <= 5) return { score, label: "Strong", color: "#22c55e", bg: "bg-green-500" };
  return { score, label: "Very Strong", color: "#10b981", bg: "bg-emerald-500" };
}

export default function PasswordStrengthBar({ password }: Props) {
  const { label, color, bg, score } = evaluate(password);
  const segments = 4;
  const filled = Math.ceil((score / 6) * segments);

  return (
    <div className="mt-2.5 space-y-1.5" aria-label={`Password strength: ${label}`}>
      <div className="flex gap-1.5">
        {Array.from({ length: segments }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-500 ${
              i < filled ? bg : "bg-white/10"
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-right transition-colors duration-300" style={{ color }}>
        {label}
      </p>
    </div>
  );
}
