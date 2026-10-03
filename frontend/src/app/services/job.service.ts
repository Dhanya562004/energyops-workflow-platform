import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, catchError, throwError } from 'rxjs';
import { Job, JobPagination, JobQueryParams, JobStats, WorkflowStage, WorkflowStatus } from '../models/job.model';
import { RoleService } from '../core/services/role.service';

export interface JobsResponse {
  success: boolean;
  data: Job[];
  pagination: JobPagination;
  stats: JobStats;
}

export interface SingleJobResponse {
  success: boolean;
  data: Job;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class JobService {
  private apiUrl = 'http://localhost:3000/api/jobs';
  
  private jobsSubject = new BehaviorSubject<Job[]>([]);
  public jobs$: Observable<Job[]> = this.jobsSubject.asObservable();

  private statsSubject = new BehaviorSubject<JobStats | null>(null);
  public stats$: Observable<JobStats | null> = this.statsSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$: Observable<boolean> = this.loadingSubject.asObservable();

  constructor(
    private http: HttpClient,
    private roleService: RoleService
  ) {}

  getJobs(params: JobQueryParams = {}): Observable<JobsResponse> {
    this.loadingSubject.next(true);
    let httpParams = new HttpParams();

    Object.keys(params).forEach(key => {
      const val = (params as any)[key];
      if (val !== undefined && val !== null && val !== '') {
        httpParams = httpParams.set(key, val.toString());
      }
    });

    return this.http.get<JobsResponse>(this.apiUrl, { params: httpParams }).pipe(
      tap(res => {
        if (res.success) {
          this.jobsSubject.next(res.data);
          if (res.stats) {
            this.statsSubject.next(res.stats);
          }
        }
        this.loadingSubject.next(false);
      }),
      catchError(err => {
        this.loadingSubject.next(false);
        return throwError(() => err);
      })
    );
  }

  getJobById(id: string): Observable<SingleJobResponse> {
    return this.http.get<SingleJobResponse>(`${this.apiUrl}/${id}`);
  }

  createJob(jobData: Partial<Job>): Observable<SingleJobResponse> {
    const payload = {
      ...jobData,
      assignedManager: jobData.assignedManager || this.roleService.currentUser.name
    };
    return this.http.post<SingleJobResponse>(this.apiUrl, payload);
  }

  updateJob(id: string, updates: Partial<Job>): Observable<SingleJobResponse> {
    return this.http.put<SingleJobResponse>(`${this.apiUrl}/${id}`, updates);
  }

  updateStage(id: string, newStage: WorkflowStage, override = false, reason?: string): Observable<SingleJobResponse> {
    const payload = {
      newStage,
      userRole: this.roleService.currentRole,
      userName: this.roleService.currentUser.name,
      override,
      reason
    };
    return this.http.patch<SingleJobResponse>(`${this.apiUrl}/${id}/stage`, payload);
  }

  updateStatus(id: string, status: WorkflowStatus, blockerReason?: string): Observable<SingleJobResponse> {
    const payload = {
      status,
      blockerReason,
      userName: this.roleService.currentUser.name
    };
    return this.http.patch<SingleJobResponse>(`${this.apiUrl}/${id}/status`, payload);
  }

  addBlocker(id: string, reason: string): Observable<SingleJobResponse> {
    const payload = {
      reason,
      createdBy: this.roleService.currentUser.name
    };
    return this.http.post<SingleJobResponse>(`${this.apiUrl}/${id}/blockers`, payload);
  }

  resolveBlocker(blockerId: string, resolutionNotes: string): Observable<any> {
    const payload = {
      resolvedBy: this.roleService.currentUser.name,
      resolutionNotes
    };
    return this.http.patch<any>(`http://localhost:3000/api/blockers/${blockerId}/resolve`, payload);
  }

  addNote(jobId: string, content: string): Observable<any> {
    const payload = {
      author: this.roleService.currentUser.name,
      role: this.roleService.currentRole,
      content
    };
    return this.http.post<any>(`${this.apiUrl}/${jobId}/notes`, payload);
  }
}
