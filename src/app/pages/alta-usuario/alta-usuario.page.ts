import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { AlertService } from 'src/app/services/alert.service';
import { ValidatorService } from 'src/app/services/validator.service';
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
export class AltaUsuarioPage implements OnInit {

  public form: FormGroup;
  public imgFile: any;

  public barcodes: Barcode[] = [];
  public infoQR: string | null = null;
  public scanSupported: boolean = false;
  public scanAvailable: boolean = false;

  constructor(private firestore: AngularFirestore, private firestorage: AngularFireStorage, private alert: AlertService, private router: Router, 
    private auth: AuthService, public formBuilder: FormBuilder, private validator: ValidatorService) 
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
      confirmarClave: [
        '', 
        [Validators.required, this.validator.passwordMatchValidator, this.validator.spaceValidator]
      ],
      nombre: [
        '',
        [Validators.required, Validators.minLength(2), Validators.maxLength(50), Validators.pattern(/^[a-zA-ZÀ-ÿ\u00f1\u00d1]+(\s*[a-zA-ZÀ-ÿ\u00f1\u00d1]*)*$/)]//anterior -> "[a-zA-Zá-úÁ-Ú ]*" Cuti -> /^[a-zA-Z\s]*$/
      ],
      apellido: [
        '',
        [Validators.required, Validators.minLength(2), Validators.maxLength(50), Validators.pattern(/^[a-zA-ZÀ-ÿ\u00f1\u00d1]+(\s*[a-zA-ZÀ-ÿ\u00f1\u00d1]*)*$/)]
      ],
      dni: [
        '', 
        [Validators.required, Validators.min(10000000), Validators.max(99999999), this.validator.noDecimalValidator]//yo -> Validators.min(10000000), Validators.max(99999999) + this.noDecimalValidator Cuti -> Validators.pattern(/^\d{1,10}$/)
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

  isValidField(field: string): boolean | null {
    return this.validator.isValidField(this.form, field);
  }

  getErrorByField(field: string): string | null {
    return this.validator.getErrorByField(this.form, field);
  }

  async scan(): Promise<void> {
    const permission = await this.requestCameraPermission();

    if (!permission) {
      this.alert.sweetAlert('Escáner rechazado', 'Debe habilitar los permisos para poder escanear el QR', 'error');
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

  async register() {
    const { nombre, apellido, dni, correo, clave } = this.form.value;
    this.auth.register(correo, clave).then(async () => {
      
      this.alert.waitAlert('Comprobando datos', 'Este proceso puede demorar unos segundos');

      const path = `Administración/${nombre}_${apellido}_${dni}.${this.imgFile.format}`;

      const response = await fetch(this.imgFile.webPath!);
      const blob = await response.blob();
      const uploadTask = await this.firestorage.upload(path, blob);
      const url = await uploadTask.ref.getDownloadURL(); 

      const id = this.firestore.createId();
      const doc = this.firestore.doc("common-users/" + id);

      doc.set({
        nombre: nombre,
        apellido: apellido,
        correo: correo,
        dni: dni,
        clave: clave,
        foto: url,
      }).then(() => {
        Swal.fire({
          title: "Éxito",
          text: "El usuario ha sido guardado exitosamente.",
          icon: "success",
          confirmButtonText: "Aceptar",
          confirmButtonColor: 'var(--ion-color-primary)',
          heightAuto: false
        });
  
        this.clearData();
      })
      .catch((error) => {
        console.error("Error al dar de alta el producto:", error);
        Swal.fire({
          title: "Error",
          text: "Hubo un problema al dar de alta al usuario. Por favor, inténtelo de nuevo.",
          icon: "error",
          confirmButtonText: "Aceptar",
          confirmButtonColor: 'var(--ion-color-medium)',
          heightAuto: false
        });
      });
    })
    .catch(error => {
      let excepcion : string = error.toString();
      if (excepcion.includes("(auth/email-already-in-use)")) {
        this.alert.sweetAlert("ERROR", "El correo electónico ya se encuentra en uso", 'error');
      } else {
        this.alert.sweetAlert("ERROR", excepcion, 'error');
      }
    });
  }

  async onSubmit() {
    if (this.form.valid) {
      this.register();
    } else {
      this.alert.sweetAlert("ERROR", "Hay campos vacíos o incorrectos", 'error');
    }
  }

  async takePhoto() {
    const image = await Camera.getPhoto({
      quality: 100,
      promptLabelHeader: 'Seleccione una opción',
      promptLabelPhoto: 'Elegir desde la galería',
      promptLabelPicture: 'Tomar una foto',
      resultType: CameraResultType.Uri
    });

    this.savePhoto(image);
  }

  async savePhoto(file : any) {
    if(file) {
      if(file.format == 'jpg' || file.format == 'jpeg' || file.format == 'png' || file.format == 'jfif') {
        this.imgFile = file;
      } else {
        this.alert.sweetAlert("ERROR", "Formato de archivo incompatible", 'error');
      }
    } else {
      this.alert.sweetAlert("ERROR", "Ningún archivo fue seleccionado", 'error');
    }
  }

  clearData() {
    this.imgFile = null;
    this.form.reset({ nombre: '', apellido: '', correo: '', dni: '', clave: '', confirmarClave: ''});
  }

  goBack() {
    this.router.navigateByUrl('/home');
  }
}
