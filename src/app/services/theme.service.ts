import {Injectable, signal} from '@angular/core';

const THEME_KEY = 'dev-tracker-theme';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly _isDark = signal<boolean>(this._getInitialTheme());
  readonly isDark = this._isDark.asReadonly();

  constructor() {
    this._applyTheme();
  }

  toggle(): void {
    this._isDark.update((prev) => {
      const next = !prev;
      localStorage.setItem(THEME_KEY, JSON.stringify(next));
      this._setThemeAttribute(next);
      return next;
    });
  }

  private _getInitialTheme(): boolean {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored !== null) {
      return JSON.parse(stored);
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  private _applyTheme(): void {
    this._setThemeAttribute(this._isDark());
  }

  private _setThemeAttribute(dark: boolean): void {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  }
}
