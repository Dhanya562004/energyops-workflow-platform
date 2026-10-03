import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type Theme = 'dark' | 'light';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private themeSubject = new BehaviorSubject<Theme>('dark');
  public theme$: Observable<Theme> = this.themeSubject.asObservable();

  constructor() {
    const saved = localStorage.getItem('energyops_theme') as Theme;
    const initial = saved || 'dark';
    this.setTheme(initial);
  }

  get currentTheme(): Theme {
    return this.themeSubject.value;
  }

  toggleTheme(): void {
    const next = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(next);
  }

  setTheme(theme: Theme): void {
    this.themeSubject.next(theme);
    localStorage.setItem('energyops_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    } else {
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    }
  }
}
