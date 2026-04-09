import { useLocale, type Locale } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";

export function LanguageSwitcher() {
  const [locale, setLocale] = useLocale();

  const toggle = () => {
    setLocale(locale === "en" ? "sv" : "en");
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 relative"
      onClick={toggle}
      title={locale === "en" ? "Byt till svenska" : "Switch to English"}
    >
      <Languages className="h-4 w-4" />
      <span className="absolute -bottom-0.5 -right-0.5 text-[8px] font-bold text-primary uppercase">
        {locale}
      </span>
    </Button>
  );
}
