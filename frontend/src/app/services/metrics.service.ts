import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SystemMetrics } from '../models/metrics.model';

export interface MetricsResponse {
  success: boolean;
  data: SystemMetrics;
}

@Injectable({
  providedIn: 'root'
})
export class MetricsService {
  private apiUrl = 'http://localhost:3000/api/metrics';

  constructor(private http: HttpClient) {}

  getMetrics(): Observable<MetricsResponse> {
    return this.http.get<MetricsResponse>(this.apiUrl);
  }

  reportFrontendError(errorDetails: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/frontend-error`, { error: errorDetails });
  }
}
