import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { User, UserRole } from '../../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private readonly availableUsers: User[] = [
    { id: 'USR-001', name: 'Robert Sterling', email: 'robert.sterling@energyops.com', role: 'Admin', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' },
    { id: 'USR-002', name: 'Amanda Torres', email: 'amanda.torres@energyops.com', role: 'Manager', avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150' },
    { id: 'USR-004', name: 'Elena Rostova', email: 'elena.rostova@energyops.com', role: 'Engineer', avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150' }
  ];

  private activeUserSubject = new BehaviorSubject<User>(this.availableUsers[0]);
  public activeUser$: Observable<User> = this.activeUserSubject.asObservable();

  private tokenCache = new Map<string, string>();
  private currentTokenSubject = new BehaviorSubject<string | null>(null);
  public currentToken$: Observable<string | null> = this.currentTokenSubject.asObservable();

  get currentUser(): User {
    return this.activeUserSubject.value;
  }

  get currentRole(): UserRole {
    return this.activeUserSubject.value.role;
  }

  get currentToken(): string | null {
    return this.currentTokenSubject.value;
  }

  constructor() {
    this.initTokens();
  }

  private async initTokens(): Promise<void> {
    for (const u of this.availableUsers) {
      await this.fetchTokenForUser(u);
    }
  }

  public async fetchTokenForUser(user: User): Promise<string | null> {
    if (this.tokenCache.has(user.role)) {
      const cached = this.tokenCache.get(user.role)!;
      if (this.currentUser.role === user.role) {
        this.currentTokenSubject.next(cached);
      }
      return cached;
    }

    try {
      if (typeof fetch !== 'undefined') {
        const resp = await fetch('http://localhost:3000/api/auth/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role: user.role,
            name: user.name,
            email: user.email
          })
        });
        if (resp.ok) {
          const res = await resp.json();
          if (res.success && res.token) {
            this.tokenCache.set(user.role, res.token);
            if (this.currentUser.role === user.role) {
              this.currentTokenSubject.next(res.token);
            }
            return res.token;
          }
        }
      }
    } catch {
      // Backend not running or offline
    }
    return null;
  }

  getUsers(): User[] {
    return this.availableUsers;
  }

  setRole(role: UserRole): void {
    const found = this.availableUsers.find(u => u.role === role);
    const target = found || {
      id: `USR-TMP`,
      name: `${role} User`,
      email: `${role.toLowerCase()}@energyops.com`,
      role
    };
    this.activeUserSubject.next(target);
    const cached = this.tokenCache.get(role);
    if (cached) {
      this.currentTokenSubject.next(cached);
    } else {
      this.fetchTokenForUser(target);
    }
  }

  setUser(user: User): void {
    this.activeUserSubject.next(user);
    const cached = this.tokenCache.get(user.role);
    if (cached) {
      this.currentTokenSubject.next(cached);
    } else {
      this.fetchTokenForUser(user);
    }
  }

  canOverrideStage(): boolean {
    return this.currentRole === 'Admin';
  }

  canApproveStage(): boolean {
    return this.currentRole === 'Admin' || this.currentRole === 'Manager';
  }

  canResolveBlocker(): boolean {
    return this.currentRole === 'Admin' || this.currentRole === 'Manager';
  }
}
