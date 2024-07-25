import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { User } from 'src/app/classes/user';
import { DatabaseService } from 'src/app/services/database.service';
import { AuthService } from 'src/app/services/auth.service';
import { AlertService } from 'src/app/services/alert.service';
import { ValidatorService } from 'src/app/services/validator.service';
import { Subscription } from 'rxjs';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit, OnDestroy {

  public cargaFin: boolean = false;
  public alertController: any;

  public arrayFirebase: Array<User> = [];
  public arrayTestUsers: Array<User> = [];
  public formLog: FormGroup;

  private subsDatabase: Subscription = Subscription.EMPTY;

  constructor(private alert: AlertService, private router: Router, private data: DatabaseService,
    private auth: AuthService, public formBuilder: FormBuilder, private validator: ValidatorService) 
  {
    console.log("Entro en Login");
    this.formLog = this.formBuilder.group({
      email: [
        '',
        [Validators.required, Validators.minLength(10), this.validator.emailValidator, this.validator.spaceValidator]
      ],
      password: [
        '', 
        [Validators.required, Validators.minLength(6), Validators.maxLength(30), this.validator.spaceValidator]]
    });
  }

  ngOnInit() {
    this.cleanInputs();
    
    this.subsDatabase = this.data.getCollectionObservable('usuarios').subscribe((next: any) => {
      let result: Array<any> = next;
      this.arrayFirebase = [];
      this.arrayTestUsers = [];

      result.forEach((obj: any) => {
        this.arrayFirebase.push(new User(obj.id, obj.correo, obj.clave, obj.perfil, obj.sexo, obj.nombre));
      });
      
      this.arrayFirebase.forEach(user => {
        if (user.id == 1 || user.id == 2 || user.id == 3) {
          this.arrayTestUsers.push(user);
        }

        this.cargaFin = true;
        console.log("Carga Fin");
      });
    });
  }

  ngOnDestroy(): void {
    this.subsDatabase.unsubscribe();
  }

  isValidField(field: string): boolean | null {
    return this.validator.isValidField(this.formLog, field);
  }

  getErrorByField(field: string): string | null {
    return this.validator.getErrorByField(this.formLog, field);
  }

  async iniciarSesion() {
    if (this.formLog.valid) {
      this.alertaEspera();

      let formValues = this.formLog.value;
      
      await this.auth.logIn(formValues.email, formValues.password).then(res => {
        console.log("Usuario valido");

        if (res != null && res.user.email != null) {
          this.auth.email = res.user.email;
          this.data.obtenerUsuarioPorEmail(res.user.email).then(async (cliente) => {
            console.log(cliente);
            if(cliente) {
              this.auth.perfil = cliente.perfil;
            }
          })
          .catch((error) => {
            console.error('Error retrieving cliente:', error);
          });
        }

        setTimeout(() => {
          Swal.close(this.alertController);
          //this.alert.successToast("Sesión iniciada correctamente");
          this.cleanInputs();
          this.router.navigateByUrl('/home');
        }, 1500);
      })
      .catch(err => {
        console.error(err);

        if (Swal.isVisible()) {
          setTimeout(() => {
            
            this.auth.logOut();
            this.alert.sweetAlert('Error', 'No fue posible iniciar sesión, compruebe los datos ingresados', 'error');
            this.cleanInputs();
          }, 1000);
        }
      });
    } else {
      this.alert.sweetAlert('Error', 'Debe llenar los campos para iniciar sesión', 'error');
    }
  }

  onQuickUser(user: any) {
    this.formLog.controls['email'].setValue(user.target.value.correo);
    this.formLog.controls['password'].setValue(user.target.value.clave);
  }

  cleanInputs() {
    this.formLog.reset({email: '', password: ''});
  }

  async alertaEspera() {
    this.alertController = await this.alert.waitAlert('Iniciando Sesión', 'Por favor espere...');
  }
}
