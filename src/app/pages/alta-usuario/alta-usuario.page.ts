import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { DatabaseService } from 'src/app/services/database.service';
import { AuthService } from 'src/app/services/auth.service';
import { AlertService } from 'src/app/services/alert.service';
import { ValidatorService } from 'src/app/services/validator.service';
import { Subscription } from 'rxjs';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Camera, CameraResultType } from '@capacitor/camera';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { BarcodeScanner, Barcode } from '@capacitor-mlkit/barcode-scanning';
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
  public imgFileBlob: any;

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
        [Validators.required, Validators.minLength(2), Validators.maxLength(50), Validators.pattern(/^[a-zA-Z\s]*$/)]// (/^[a-zA-ZÀ-ÿ\u00f1\u00d1]+(\s*[a-zA-ZÀ-ÿ\u00f1\u00d1]*)*$/) Expresión regular para evitar números, puntos y comas, aceptar espacios, letras con tíldes y la ñ.
      ],
      dni: [
        0, 
        [Validators.required, Validators.pattern(/^\d{1,10}$/)]
      ]
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

  registrar()
  {
    if(this.form.valid && this.imgFileBlob) {
      let formValues = this.form.value;

      this.guardarUsuario();
    } else {
      this.alert.sweetAlert("ERROR", "Hay campos vacíos o incorrectos", 'error');
    }
  }

  async tomarFoto()
  {
    const image = await Camera.getPhoto({
      quality: 100,
      promptLabelHeader: 'Seleccione una opción',
      promptLabelPhoto: 'Elegir desde la galería',
      promptLabelPicture: 'Tomar una foto',
      resultType: CameraResultType.Uri
    });

    this.subirFotoPerfil(image);
  }

  async subirFotoPerfil(file : any) {
    if(file) {
      if(file.format == 'jpg' || file.format == 'jpeg' || file.format == 'png' || file.format == 'jfif') {
        //this.alert.waitAlert('Publicando...', 'Esto puede demorar unos segundos');

        //let id_imagen = this.firestore.createId();
        //let fecha = new Date();

        const response = await fetch(file.webPath!);
        this.imgFileBlob = await response.blob();

        //const path = 'Relevamiento/' + this.auth.nombre + '_' + this.auth.id + '/' + fecha.getTime() + '.' + file.format;
        //const uploadTask = await this.firestorage.upload(path, blob); 
        //const url = await uploadTask.ref.getDownloadURL(); 
      } else {
        this.alert.sweetAlert("ERROR", "Formato de archivo incompatible", 'error');
      }
    } else {
      this.alert.sweetAlert("ERROR", "Ningún archivo fue seleccionado", 'error');
    }
  }

  reestablecerDatos()
  {
    this.imgPerfil = '';
    this.imgFileBlob = null;
    this.form.reset({ nombre: '', apellido: '', correo: '', dni: 0, clave: '', confirmarClave: ''});
  }

  goBack() {
    this.router.navigateByUrl('/home');
  }
}
