export class CommonUser {
    
    correo: string = '';
    clave: string = '';
    nombre: string = '';
    apellido: string = '';
    dni: number = 0;
    foto: string = '';

    constructor(correo: string, clave: string, nombre: string, apellido: string, dni: number, foto: string | '')
    {
        this.correo = correo;
        this.clave = clave;
        this.nombre = nombre;
        this.apellido = apellido;
        this.dni = dni;
        this.foto = foto;
    }

    static initialize() : CommonUser
    {
        return new CommonUser('','','','',0,'');
    }
}
