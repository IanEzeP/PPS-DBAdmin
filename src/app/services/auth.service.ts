import { Injectable } from '@angular/core';
import { Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User
} from '@angular/fire/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  public loggedUser: any;

  public logueado : boolean = false;
  public email : string = "";
  public perfil : string = "";
  public id : number = 0;
  public nombre : string = "";
  public sexo : string = "";

  constructor(private auth: Auth) { }

  async logIn(email: string, password: string) {
    try {
      const credential = signInWithEmailAndPassword(this.auth, email, password);
      this.logueado = true;

      return credential;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  async logOut() {
    this.logueado = false;
    this.email = '';
    this.perfil = "";
    this.nombre = '';
    this.id = 0;
    this.sexo = '';
    this.loggedUser = undefined;
    
    return await signOut(this.auth);
  }

  async register(email : string, password : string) {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      await this.logIn(email, password);
  
      return userCredential;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
  
  get usuarioActual() : User | null {
    return this.auth.currentUser
  }
  
  cambiarUsuarioActual(usuario : User | null) {
    return this.auth.updateCurrentUser(usuario)
  }
}
