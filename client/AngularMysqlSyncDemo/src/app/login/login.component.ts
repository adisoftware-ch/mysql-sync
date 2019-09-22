// Import the core angular services.
import { Component } from '@angular/core';
import { Location } from '@angular/common';

import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  templateUrl: 'login.component.html',
  styleUrls: ['login.component.css']
})
export class LoginComponent {

  email: string;
  password: string;

  // I initialize the component.
  constructor(public authService: AuthService, private location:Location) { }

  public signup() {
    this.authService.signup(this.email, this.password);
    this.email = this.password = '';
  }

  public login() {
    this.authService.login(this.email, this.password);

    if (this.authService.user) {
      this.email = this.password = '';
      this.location.back();
    }
  }

}
