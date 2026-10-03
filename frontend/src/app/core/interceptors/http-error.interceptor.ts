import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';
import { MetricsService } from '../../services/metrics.service';

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastService = inject(ToastService);
  const metricsService = inject(MetricsService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An unexpected system error occurred.';
      let title = 'API Error';

      if (error.error && error.error.error && error.error.error.message) {
        errorMessage = error.error.error.message;
        title = error.error.error.code || 'Workflow Error';
      } else if (error.status === 0) {
        errorMessage = 'Unable to connect to EnergyOps backend server. Check backend connection.';
        title = 'Network Error';
      } else if (error.status === 404) {
        errorMessage = 'Requested resource was not found.';
        title = 'Not Found';
      }

      // Display user-friendly toast error notification
      toastService.error(title, errorMessage);

      // Report metric
      metricsService.reportFrontendError({
        status: error.status,
        url: req.url,
        message: errorMessage
      }).subscribe({ error: () => {} });

      return throwError(() => error);
    })
  );
};
