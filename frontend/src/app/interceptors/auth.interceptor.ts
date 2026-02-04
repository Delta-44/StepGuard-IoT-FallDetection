import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // 1. Buscamos el token en el almacenamiento
  const token = localStorage.getItem('stepguard_token');

  // 2. Si existe, clonamos la petición y le pegamos el Token en la cabecera
  if (token) {
    const clonedRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(clonedRequest);
  }

  // 3. Si no hay token, dejamos pasar la petición tal cual (ej: login)
  return next(req);
};