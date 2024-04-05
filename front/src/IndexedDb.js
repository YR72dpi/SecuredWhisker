// TODO : refactor

class IndexedDBManager {
  constructor(dbName) {
    this.db;
    this.dbName = dbName;

    const request = window.indexedDB.open(this.dbName, 1);
    // Gérer l'événement d'upgrade de la base de données
    request.onupgradeneeded = function (event) {
      this.db = event.target.result;

      // Créer un object store si ce n'est pas déjà fait
      if (!this.db.objectStoreNames.contains('userData')) {
        this.db.createObjectStore('userData', { autoIncrement: true, unique: true });
      }
      if (!this.db.objectStoreNames.contains('ip')) {
        this.db.createObjectStore('ip', { autoIncrement: true, unique: true });
      }
      if (!this.db.objectStoreNames.contains('port')) {
        this.db.createObjectStore('port', { autoIncrement: true, unique: true });
      }
    };
  }

  async clear(storeName) {
    const request = window.indexedDB.open(this.dbName, 1);

    // Gérer les événements liés à l'ouverture de la base de données
    request.onerror = function (event) {
      console.error("Erreur lors de l'ouverture de la base de données :", event.target.error);
    };

    request.onsuccess = function (event) {
      this.db = event.target.result;
      const transaction = this.db.transaction([storeName], 'readwrite');
      const objectStore = transaction.objectStore(storeName);
      const request = objectStore.clear();
    
      return new Promise((resolve, reject) => {
        request.onsuccess = function(event) {
          resolve();
        };
    
        request.onerror = function(event) {
          reject(event.target.error);
        };
      });
    }
  }

  async addPrivateKey(rsaKeysPrivateKey) {
    await this.clear("userData")
    // Ouvrir une connexion avec la base de données
    const request = window.indexedDB.open(this.dbName, 1);

    // Gérer les événements liés à l'ouverture de la base de données
    request.onerror = function (event) {
      console.error("Error while opening bdd: ", event.target.error);
    };

    request.onsuccess = function (event) {
      this.db = event.target.result;

      // Démarre une transaction en lecture-écriture
      const transaction = this.db.transaction(['userData'], 'readwrite');

      // Récupère l'object store des textes
      const objectStore = transaction.objectStore('userData');

      // Ajoute le texte à l'object store
      const ajoutRequest = objectStore.add(btoa(rsaKeysPrivateKey));

      ajoutRequest.onsuccess = function (event) {
        console.log('PrivateKey added');
      };

      ajoutRequest.onerror = function (event) {
        console.error("Error while adding PrivateKey", event.target.error);
      };
    };
  }

  async addIpService(ip) {
    // Ouvrir une connexion avec la base de données
    const request = window.indexedDB.open(this.dbName, 1);

    // Gérer les événements liés à l'ouverture de la base de données
    request.onerror = function (event) {
      console.error("Error while opening bdd: ", event.target.error);
    };

    request.onsuccess = function (event) {
      this.db = event.target.result;

      // Démarre une transaction en lecture-écriture
      const transaction = this.db.transaction(['ip'], 'readwrite');

      // Récupère l'object store des textes
      const objectStore = transaction.objectStore('ip');

      // Ajoute le texte à l'object store
      const ajoutRequest = objectStore.add(ip);

      ajoutRequest.onsuccess = function (event) {
        console.log('Ip added');
      };

      ajoutRequest.onerror = function (event) {
        console.error("Error while adding Ip", event.target.error);
      };
    };
  }

  async addPortService(port) {
    // Ouvrir une connexion avec la base de données
    const request = window.indexedDB.open(this.dbName, 1);

    // Gérer les événements liés à l'ouverture de la base de données
    request.onerror = function (event) {
      console.error("Error while opening bdd: ", event.target.error);
    };

    request.onsuccess = function (event) {
      this.db = event.target.result;

      // Démarre une transaction en lecture-écriture
      const transaction = this.db.transaction(['port'], 'readwrite');

      // Récupère l'object store des textes
      const objectStore = transaction.objectStore('port');

      // Ajoute le texte à l'object store
      const ajoutRequest = objectStore.add(port);

      ajoutRequest.onsuccess = function (event) {
        console.log('Port added');
      };

      ajoutRequest.onerror = function (event) {
        console.error("Error while adding port", event.target.error);
      };
    };
  }
}