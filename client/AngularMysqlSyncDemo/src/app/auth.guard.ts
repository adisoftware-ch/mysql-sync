import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {

    constructor(
        private router: Router,
        private authService: AuthService,
    ) {}

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        console.log('checking route permission for user:', this.authService.user);

        if (this.authService.user) {
            // authorised & verified, so return true
            return true;
        }

        // not logged in so redirect to login page
        this.router.navigate(['login']);
        return false;
    }
}
