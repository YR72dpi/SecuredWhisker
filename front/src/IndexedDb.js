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

  async getPrivateKey() {
    return new Promise((resolve, reject) => {
      // Ouvrir une connexion avec la base de données
      const request = window.indexedDB.open(this.dbName, 1);

      // Gérer les événements liés à l'ouverture de la base de données
      request.onerror = function (event) {
        console.error("Error while opening bdd: ", event.target.error);
        reject(event.target.error);
      };

      request.onsuccess = function (event) {
        this.db = event.target.result;

        // Démarre une transaction en lecture seule
        const transaction = this.db.transaction(['userData'], 'readonly');

        // Récupère l'object store des données utilisateur
        const objectStore = transaction.objectStore('userData');

        // Récupère la clé privée à partir de l'object store
        const getRequest = objectStore.getAll();

        getRequest.onsuccess = function (event) {
          const privateKeys = event.target.result;
          if (privateKeys && privateKeys.length > 0) {
            // Récupère la première clé privée (supposant qu'il n'y en a qu'une)
            const privateKey = atob(privateKeys[0]); // Décodage de la clé privée de Base64
            resolve(privateKey);
          } else {
            resolve(null); // Aucune clé privée trouvée
          }
        };

        getRequest.onerror = function (event) {
          console.error("Error while getting PrivateKey", event.target.error);
          reject(event.target.error);
        };
      };
    });
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