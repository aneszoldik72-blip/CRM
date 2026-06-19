// Locale-aware 404. Fires when a path under /[locale] doesn't match any
// route. Uses next-intl since the layout above has already loaded
// messages.

import { NotFoundScreen } from "@/components/shared/not-found-screen";

export default function LocaleNotFound() {
  return <NotFoundScreen fullscreen backHref="/dashboard" />;
}
