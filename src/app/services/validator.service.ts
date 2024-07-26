import { Injectable } from '@angular/core';
import { FormGroup, AbstractControl, ValidationErrors } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class ValidatorService {

  public firstNameAndLastnamePattern: string = '([a-zA-Z]+) ([a-zA-Z]+)';
  public emailPattern: string = '^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$';

  public isValidField(form: FormGroup, field: string) {
    return form.controls[field].errors && form.controls[field].touched;
  }

  getErrorByField(form: FormGroup, field: string): string | null {
    if (!form.controls[field]) return null;

    const errors = form.controls[field].errors || {};
    let error = null

    for (const key of Object.keys(errors)) {
      switch (key) {
        case 'required':
          error = 'Este campo es requerido';
          break;
        case 'minlength':
          error = `Mínimo de ${errors['minlength'].requiredLength} caracteres`;
          break;
        case 'maxlength':
          error = `Máximo de ${errors['maxlength'].requiredLength} caracteres`;
          break;
        case 'min':
          error = `Valor no puede ser menor a ${errors['min'].min}`;
          break;
        case 'max':
          error = `No puede tener más de ${errors['max'].max.toString().length} caracteres`;
          break;
        case 'pattern':
          error = `No se permiten carácteres especiales`;
          break;
        case 'decimal':
          error = `Sin puntos ni comas`;
          break; 
        case 'passwordMismatch':
          error = `Las claves no coinciden`;
          break;
        case 'spaces':
          error = `No puede contener espacios en blanco`;
          break;
        case 'email':
          error = `El formato es incorrecto`;
          break;
      }
    }

    return error;
  }

  emailValidator(control : AbstractControl) : null | ValidationErrors { 
    const value = <string>control.value;
    const arroba = value.includes('@');

    if(!arroba) {
      return { email: true };
    } else {
      return null;
    }
  }

  spaceValidator(control : AbstractControl) : null | ValidationErrors { 
    const value = <string>control.value.toString();
    const espacios = value.includes(' ');
    
    if(espacios) {
      return { spaces: true };
    } else {
      return null;
    }
  }

  passwordMatchValidator(control: AbstractControl) : null | ValidationErrors  {
    const clave = control.parent?.value.clave;
    const confirmarClave = <string>control.value.toString();

    if (!clave || !confirmarClave) return null;
    return clave === confirmarClave ? null : { passwordMismatch: true };
  }

  noDecimalValidator(control: AbstractControl) : null | ValidationErrors {
    const valor: string = control.value != null? control.value.toString() : '';

    if (valor.includes(',') || valor.includes('.')) {
      return { decimal: true };
    } else {
      return null;
    }
  }
}
