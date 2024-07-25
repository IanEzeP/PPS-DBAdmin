import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AltaUsuarioPage } from './alta-usuario.page';

describe('AltaUsuarioPage', () => {
  let component: AltaUsuarioPage;
  let fixture: ComponentFixture<AltaUsuarioPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AltaUsuarioPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
