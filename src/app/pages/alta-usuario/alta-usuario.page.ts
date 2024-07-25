import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { DatabaseService } from 'src/app/services/database.service';
import { AuthService } from 'src/app/services/auth.service';
import { AlertService } from 'src/app/services/alert.service';
import { ValidatorService } from 'src/app/services/validator.service';
import { Subscription } from 'rxjs';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import {
  BarcodeScanner,
  Barcode,
  BarcodeFormat,
  LensFacing,
} from '@capacitor-mlkit/barcode-scanning';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-alta-usuario',
  templateUrl: './alta-usuario.page.html',
  styleUrls: ['./alta-usuario.page.scss'],
})
export class AltaUsuarioPage implements OnInit, OnDestroy {

  public alertController: any;
  public form: FormGroup;
  public imgPerfil: string = '';
  public imgFile: any;

  public barcodes: Barcode[] = [];
  public infoQR: string | null = null;
  public scanSupported: boolean = false;
  public scanAvailable: boolean = false;

  private subsDatabase: Subscription = Subscription.EMPTY;

  constructor(private firestore: AngularFirestore, private firestorage: AngularFireStorage, private alert: AlertService, private router: Router, 
    private data: DatabaseService, private auth: AuthService, public formBuilder: FormBuilder, private validator: ValidatorService) 
  { 
    console.log("Entro en Alta de usuario");
    this.form = this.formBuilder.group({
      correo: [
        '',
        [Validators.required, Validators.minLength(10), this.validator.emailValidator, this.validator.spaceValidator]
      ],
      clave: [
        '', 
        [Validators.required, Validators.minLength(6), Validators.maxLength(30), this.validator.spaceValidator]
      ],
      confirmarclave: [
        '', 
        [Validators.required, this.validator.passwordMatchValidator, this.validator.spaceValidator]
      ],
      nombre: [
        '',
        [Validators.required, Validators.minLength(2), Validators.maxLength(50), Validators.pattern(/^[a-zA-Z\s]*$/)]//a-zA-Zá-úÁ-Ú 
      ],
      apellido: [
        '',
        [Validators.required, Validators.minLength(2), Validators.maxLength(50), Validators.pattern(/^[a-zA-Z\s]*$/)]
      ],
      dni: [
        0, 
        [Validators.required, Validators.pattern(/^\d{1,10}$/)]
      ]
      //foto: []
    });
  }

  ngOnInit() {
    BarcodeScanner.isSupported().then((result) => {
      this.scanSupported = result.supported;
      BarcodeScanner.isGoogleBarcodeScannerModuleAvailable().then((res) => {
        if (res.available == false) {
          BarcodeScanner.installGoogleBarcodeScannerModule().then(() => {
            BarcodeScanner.addListener("googleBarcodeScannerModuleInstallProgress",
              () => this.scanAvailable = true);
          })
          .catch((err) => console.log("Error in installation: " + err));
        } else {
          this.scanAvailable = res.available;
        }
      }).catch((err) => console.log("Error: " + err));
    });

  }

  ngOnDestroy(): void {
    
  }

  async scan(): Promise<void> {
    const permission = await this.requestCameraPermission();

    if (!permission) {
      this.alert.sweetAlert('Escáner rechazado',
      'Debe habilitar los permisos para poder escanear el QR',
      'error');
    }

    const { barcodes } = await BarcodeScanner.scan();

    if (barcodes.length > 0) {
      this.infoQR = barcodes[0].rawValue;
      this.fillForm(this.infoQR);
    }

    this.barcodes.push(...barcodes);
  }

  async requestCameraPermission() {
    const { camera } = await BarcodeScanner.requestPermissions();
    return camera;
  }

  fillForm(dniScan: string): void {
    try {
      const qrData = dniScan.split('@');

      if (qrData.length >= 4) {
        this.form.patchValue({
          apellido: qrData[1].trim(),
          nombre: qrData[2].trim(),
          dni: qrData[4].trim(),
        });
      } else {
        throw new Error('Formato de QR incorrecto');
      }
    } catch (error) {
      console.error('Error parsing QR data', error);
      alert('Error parsing QR data');
    }
  }
/*
  registrar()
  {
    if(this.formRegistro.valid && this.imgFile)
    {
      let formValues = this.formRegistro.value;

      this.administrador = new Usuario('', formValues.nombre, formValues.apellido, formValues.edad,
        formValues.dni, formValues.email, formValues.password, 'empty');

      this.guardarUsuario();
    }
    else
    {
      this.alertas.failureAlert("ERROR - Hay campos vacíos o incorrectos");
    }
  }

  async tomarFoto(tipo: string)
  {
    const image = await Camera.getPhoto({
      quality: 100,
      promptLabelHeader: 'Seleccione una opción',
      promptLabelPhoto: 'Elegir desde la galería',
      promptLabelPicture: 'Tomar una foto',
      resultType: CameraResultType.Uri
    });

    this.subirFotoPerfil(tipo, image);
  }

  async guardarImagen() {
    try {
      const nombreArchivo =  this.form.value.dni + this.form.value.nombre + this.form.value.apellido;
      const fotoBase64 = this.fotoUrl;
      const dataURL = `data:image/jpeg;base64,${fotoBase64}`;

      const urlDescarga = await this.storage.subirImagen('fotosPerfil',nombreArchivo,dataURL);

      if (!urlDescarga) {
        Swal.fire({
          html: '<br><label style="font-size:80%">Error: No se pudo obtener la URL de descarga de la imagen</label>',
          confirmButtonText: 'Ok',
          confirmButtonColor: 'var(--ion-color-primary)',
          heightAuto: false,
        });
        return false;
      }

      return urlDescarga;
    } catch (error) {
      console.error('Error al guardar la imagen:', error);
      return false;
    }
  }

  async subirFotoPerfil(tipo : string, file : any)
  {
    if(file)
    {
      if(file.format == 'jpg' || file.format == 'jpeg' || file.format == 'png' || file.format == 'jfif')
      {
        this.alert.waitAlert('Publicando...', 'Esto puede demorar unos segundos');

        let id_imagen = this.firestore.createId();
        let fecha = new Date();

        const response = await fetch(file.webPath!);
        const blob = await response.blob();

        const path = 'Relevamiento/' + this.auth.nombre + '_' + this.auth.id + '/' + fecha.getTime() + '.' + file.format;
        const uploadTask = await this.firestorage.upload(path, blob); 
        const url = await uploadTask.ref.getDownloadURL(); 
        
        const documento = this.firestore.doc("fotos-edificio/" + id_imagen);
        documento.set(
        {
          imagen : url,
          tipo: tipo,
          usuario: this.auth.nombre,
          id_usuario: this.auth.id,
          id_foto: id_imagen,
          votantes: new Array(0),
          fecha: new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), fecha.getHours(), fecha.getMinutes()),
          votos: 0
        });

        this.validarGuardado(documento.ref.id);
      }
      else
      {
        this.alert.failureAlert("ERROR", "Formato de archivo incompatible");
      }
    }
    else
    {
      this.alert.failureAlert("ERROR", "Ningún archivo fue seleccionado");
    }
  }

  async subirFotoPerfil(id : string, directorio : string, file : any)
  {
    if(file)
    {
      let extension : string = file.name.slice(file.name.indexOf('.'));

      if(extension == '.jpg' || extension == '.jpeg' || extension == '.png' || extension == '.jfif')
      {
        const path = directorio + '/' + id + '/' + this.formRegistro.controls['nombre'].value + extension;
        const uploadTask = await this.firestorage.upload(path, file);
        const url = await uploadTask.ref.getDownloadURL(); 

        const documento = this.firestore.doc(directorio + '/' + id);
        documento.update({ ImagenPerfil : url });
      }
      else
      {
        this.alertas.infoToast("El formato del archivo seleccionado no es compatible.");
      }
    }
  }

  onFileChange($event : any)
  {
    this.imgFile = $event.target.files[0];
  }*/

  

  reestablecerDatos()
  {
    this.imgPerfil = '';
    this.imgFile = null;
    this.form.reset({ nombre: '', apellido: '', correo: '', dni: 0, clave: '', confirmarClave: ''});
  }

  goBack() {
    this.router.navigateByUrl('/home');
  }
}
