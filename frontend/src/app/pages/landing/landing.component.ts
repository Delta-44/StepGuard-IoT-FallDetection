import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
// 👇 Importamos los nuevos componentes hijos
import { LoginModalComponent } from '../../components/login-modal/login-modal.component';
import { RegisterModalComponent } from '../../components/register-modal/register-modal.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, LoginModalComponent, RegisterModalComponent], 
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent {
  
  // SOLO ESTADO VISUAL
  isLoginOpen = false;
  isRegisterOpen = false;

  openLogin() {
    this.isRegisterOpen = false;
    this.isLoginOpen = true;
  }

  openRegister() {
    this.isLoginOpen = false;
    this.isRegisterOpen = true;
  }

  closeModals() {
    this.isLoginOpen = false;
    this.isRegisterOpen = false;
  }
}