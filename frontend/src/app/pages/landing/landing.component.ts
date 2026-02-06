import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
// 👇 Importamos los nuevos componentes hijos
import { LoginModalComponent } from '../../components/login-modal/login-modal.component';
import { RegisterModalComponent } from '../../components/register-modal/register-modal.component';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, LoginModalComponent, RegisterModalComponent, LucideAngularModule], 
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent {
  
  // SOLO ESTADO VISUAL
  isLoginOpen = false;
  isRegisterOpen = false;
  isTeamOpen = false;
  isContactOpen = false;
  animateStats = false;

  ngAfterViewInit() {
    // Observar cuando la sección de stats entra en viewport
    const statsSection = document.querySelector('.stats') as HTMLElement;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !this.animateStats) {
          this.animateStats = true;
          this.animateNumbers();
        }
      });
    }, { threshold: 0.5 });

    if (statsSection) {
      observer.observe(statsSection);
    }
  }

  animateNumbers() {
    const statNumbers = document.querySelectorAll('.stat-number[data-target]');
    
    statNumbers.forEach((stat) => {
      const target = parseFloat((stat as HTMLElement).getAttribute('data-target') || '0');
      const duration = 2000; // 2 segundos
      const increment = target / (duration / 16); // 60 FPS
      let current = 0;

      const updateNumber = () => {
        current += increment;
        if (current < target) {
          if (target === 99.9) {
            stat.textContent = current.toFixed(1);
          } else {
            stat.textContent = Math.floor(current).toString();
          }
          requestAnimationFrame(updateNumber);
        } else {
          if (target === 99.9) {
            stat.textContent = target.toFixed(1);
          } else {
            stat.textContent = Math.floor(target).toString();
          }
        }
      };

      updateNumber();
    });
  }

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

  toggleTeam() {
    this.isTeamOpen = !this.isTeamOpen;
  }

  toggleContact() {
    this.isContactOpen = !this.isContactOpen;
  }
}