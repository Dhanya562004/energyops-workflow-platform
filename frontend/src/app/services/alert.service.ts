import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { OperationalAlert, AlertSummary } from '../models/alert.model';
import { RoleService } from '../core/services/role.service';

export interface AlertsResponse {
  success: boolean;
  data: OperationalAlert[];
  summary: AlertSummary;
}

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private apiUrl = 'http://localhost:3000/api/alerts';

  private activeAlertsSubject = new BehaviorSubject<OperationalAlert[]>([]);
  public activeAlerts$: Observable<OperationalAlert[]> = this.activeAlertsSubject.asObservable();

  private activeCountSubject = new BehaviorSubject<number>(0);
  public activeCount$: Observable<number> = this.activeCountSubject.asObservable();

  constructor(
    private http: HttpClient,
    private roleService: RoleService
  ) {}

  getAlerts(status = 'All', severity = 'All'): Observable<AlertsResponse> {
    let params = new HttpParams();
    if (status !== 'All') params = params.set('status', status);
    if (severity !== 'All') params = params.set('severity', severity);

    return this.http.get<AlertsResponse>(this.apiUrl, { params }).pipe(
      tap(res => {
        if (res.success) {
          this.activeAlertsSubject.next(res.data);
          this.activeCountSubject.next(res.summary.activeAlerts || 0);
        }
      })
    );
  }

  acknowledgeAlert(id: string): Observable<any> {
    const payload = {
      acknowledgedBy: this.roleService.currentUser.name
    };
    return this.http.patch<any>(`${this.apiUrl}/${id}/acknowledge`, payload).pipe(
      tap(() => {
        // Refresh alert list
        this.getAlerts().subscribe();
      })
    );
  }
}
