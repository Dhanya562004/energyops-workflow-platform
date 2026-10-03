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

  get currentUser(): User {
    return this.activeUserSubject.value;
  }

  get currentRole(): UserRole {
    return this.activeUserSubject.value.role;
  }

  getUsers(): User[] {
    return this.availableUsers;
  }

  setRole(role: UserRole): void {
    const found = this.availableUsers.find(u => u.role === role);
    if (found) {
      this.activeUserSubject.next(found);
    } else {
      this.activeUserSubject.next({
        id: `USR-TMP`,
        name: `${role} User`,
        email: `${role.toLowerCase()}@energyops.com`,
        role
      });
    }
  }

  setUser(user: User): void {
    this.activeUserSubject.next(user);
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
