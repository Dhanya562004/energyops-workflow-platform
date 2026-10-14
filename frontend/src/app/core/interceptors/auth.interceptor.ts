import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { RoleService } from '../services/role.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const roleService = inject(RoleService);
  const token = roleService.currentToken;

  if (token && !req.headers.has('Authorization') && !req.url.includes('/api/auth/token')) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(authReq);
  }

  return next(req);
};
