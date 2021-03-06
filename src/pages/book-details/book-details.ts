import {Component} from '@angular/core';
import {IonicPage, ModalController, NavController, NavParams, ToastController} from 'ionic-angular';
import {Book} from "../../models/book";
import {UserService} from "../../services/user/user.service";
import {PhotoViewer} from "@ionic-native/photo-viewer";
import {BookService} from "../../services/book/book.service";

@IonicPage({
  defaultHistory: ['HomePage']
})
@Component({
  selector: 'page-book-details',
  templateUrl: 'book-details.html',
})
export class BookDetailsPage {
  book: Book;
  alreadyRequested: boolean;
  freightLabels = Book.freightLabels;
  chooseDateInfo: string;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public userService: UserService,
    public photoViewer: PhotoViewer,
    public modalCtrl: ModalController,
    public toastCtrl: ToastController,
    public bookService: BookService,
  ) {
    this.book = this.navParams.get('book');
  }

  ionViewCanEnter() {
    return !!this.book;
  }

  ionViewWillEnter() {
    this.verifyIfRequested();
  }

  ionViewDidLoad() {
    this.verifyAddress();
  }

  verifyIfRequested() {
    this.bookService.getRequested(this.book.id).subscribe(resp => {
      this.alreadyRequested = resp.value && resp.value.bookRequested;

      if (this.alreadyRequested) {
        this.calculateChoosingDate();
      }
    }, err => {

    })
  }

  verifyAddress() {
    const { address } = this.book.user;

    if (address) {
      if (!address.city && address.postalCode) {
        this.getCity(address.postalCode);
      }
    } else {
      this.book.user.address = {};
    }
  }

  getCity(cep) {
    this.userService.consultarCEP(cep).subscribe(address => {
      const {localidade, uf} = <any>address;
      if (localidade && uf) {
        this.book.user.address.city = localidade;
        this.book.user.address.state = uf;
      }
    }, err => {

    })
  }

  openBookCover() {
    this.photoViewer.show(this.book.imageUrl);
  }

  openBookRequest() {
    const bookModal = this.modalCtrl.create('BookRequestPage', {
      book: this.book
    });

    const addressModal = this.modalCtrl.create('ConfirmAddressPage');

    bookModal.onDidDismiss((data) => {
      if (data && data.success) {
        addressModal.present();
        this.verifyIfRequested();
      }
    });

    addressModal.onDidDismiss((data) => {
      if (!(data && data.preventToast)) {
        this.toastCtrl.create({
          message: 'Livro solicitado com sucesso!',
          cssClass: 'toast-success',
          duration: 3000,
        }).present();
      }
    });

    bookModal.present();
  }

  calculateChoosingDate() {
    if (!this.book.chooseDate) return;
    const chooseDate = Math.floor(new Date(this.book.chooseDate).getTime() / (3600 * 24 * 1000));
    const todayDate   = Math.floor(new Date().getTime() / (3600 * 24 * 1000));

    const daysToChoose = chooseDate - todayDate;
    this.chooseDateInfo = daysToChoose <= 0 ? 'Hoje' : 'Daqui a ' + daysToChoose + ' dia(s)';
  }
}
