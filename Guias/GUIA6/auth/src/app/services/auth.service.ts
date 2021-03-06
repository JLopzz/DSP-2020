import { Injectable, NgZone } from '@angular/core';
import { User } from '../models/user'
import { auth } from 'firebase/app'
import { AngularFireAuth } from '@angular/fire/auth'
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/firestore'
import { Router } from "@angular/router"

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  userData: User;

  constructor(
    public afs : AngularFirestore,
    public afAuth : AngularFireAuth,
    public router : Router,
    public ngZone : NgZone
  ) {
    this.afAuth.authState.subscribe( user => {
      if(user){
        this.userData = user
        localStorage.setItem('user',JSON.stringify(this.userData))
        JSON.parse(localStorage.getItem('user'))
      } else{
        localStorage.setItem('user', null)
        JSON.parse(localStorage.getItem('user'))
      }
    })
  }

  SignIn( email:string, pass:string ){
    return this.afAuth.signInWithEmailAndPassword(email,pass)
      .then(res=>{
        this.ngZone.run(()=>{
          this.router.navigate(['dashboard'])
        })
        this.setUserData(res.user)
      })
      .catch(err => {
        window.alert(err.message)
      })
  }

  SignUp(email:string, pass:string){
    return this.afAuth.createUserWithEmailAndPassword(email,pass)
      .then(res => {
        this.SendVerificationMail();
        this.setUserData(res.user)
      })
      .catch(err => {
        window.alert(err.message)
      })
  }

  SendVerificationMail(){
    return this.afAuth.currentUser
      .then(u => {
        u.sendEmailVerification();
      })
      .then(() => {
        this.router.navigate(['verify-email-addres'])
      })
  }

  ForgotPassword(email) {
    return this.afAuth.sendPasswordResetEmail(email)
      .then(() => {
        window.alert('Se ha enviado el correo de restauracion de contraseña')
      })
      .catch(err => {
        window.alert(err)
      })
  }
  get isLoggedIn(): boolean{
    const user = JSON.parse(localStorage.getItem('user'))
    return (user !== null && user.emailVerified !==  false) ? true : false
  }
  FacebookAuth() {
    return this.AuthLogin(new auth.FacebookAuthProvider());
  }

  TwitterAuth() {
    return this.AuthLogin(new auth.TwitterAuthProvider());
  }

  GoogleAuth() {
    return this.AuthLogin(new auth.GoogleAuthProvider());
  }

  AuthLogin( provider ){
    this.afAuth.signInWithPopup(provider)
      .then(res => {
        this.setUserData(res.user)
        this.router.navigate(['dashboard'])
      })
      .catch(err => window.alert(err))
      .then(()=>console.log('tnedria que haber actualizado'))
  }

  setUserData( user ) {
    const userRef: AngularFirestoreDocument<any> = this.afs.doc(`users/${user.uid}`)
    this.userData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified
    }
    return userRef.set(this.userData, { merge: true })
  }

  SignOut(){
    return this.afAuth.signOut()
    .then(() => {
      localStorage.setItem('user', null)
      localStorage.removeItem('user')
      this.router.navigate(['sign-in'])
    })
  }
}
